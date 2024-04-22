from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, verify_jwt_in_request
from flask_jwt_extended.exceptions import NoAuthorizationError
import secrets
import chromadb
from PyPDF2 import PdfReader
import os
import hashlib
import ollama

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for simplicity, adjust in production

# Generate a secure random secret key for JWT
app.config['JWT_SECRET_KEY'] = secrets.token_urlsafe(32)
jwt = JWTManager(app)

# Initialize the ChromaDB client
chroma_client = chromadb.Client()

try:
    print("Creating collection")
    collection = chroma_client.create_collection(name="pdf_docs")
    print("Collection created.")
except chromadb.exceptions.UniqueConstraintError:
    chroma_client.delete_collection(name="pdf_docs")
    collection = chroma_client.get_collection(name="pdf_docs")
    print("Collection deleted and recreated.")

USERS = {
    "admin": "admin"
}

@app.errorhandler(NoAuthorizationError)
def handle_auth_error(e):
    return jsonify({"msg": "Authentication is required to access this resource."}), 401

@app.route('/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    if username not in USERS or USERS[username] != password:
        return jsonify({"msg": "Bad username or password"}), 401
    access_token = create_access_token(identity=username)
    return jsonify(access_token=access_token)

def clean_text(text):
    return ' '.join(text.split())

def chunk_text(text, chunk_size=500):
    words = text.split()
    for i in range(0, len(words), chunk_size):
        yield ' '.join(words[i:i+chunk_size])

def hash_chunk(text):
    return str(hashlib.md5(text.encode()).hexdigest())

def load_and_index_pdfs(pdf_files):
    for pdf_file in pdf_files:
        reader = PdfReader(pdf_file)
        full_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + " "
        full_text = clean_text(full_text)
        for chunk in chunk_text(full_text):
            response = ollama.embeddings(model="mxbai-embed-large", prompt=chunk)
            embedding = response["embedding"]
            collection.add(ids=[pdf_file + hash_chunk(chunk)], embeddings=[embedding], documents=[chunk])

def retrieve_documents(prompt, n_results=3, threshold_ratio=1.2, threshold_limit=290):
    response = ollama.embeddings(model="mxbai-embed-large", prompt=prompt)
    query_embedding = response["embedding"]
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)
    first_distance = results['distances'][0][0]
    filtered_documents = []
    for idx, distance in enumerate(results['distances'][0]):
        if distance > threshold_limit:
            break
        if distance <= first_distance * threshold_ratio:
            filtered_documents.append(results['documents'][0][idx])
    return filtered_documents

@app.route('/retrieve', methods=['POST'])
@jwt_required()
def api_retrieve_documents():
    data = request.json
    prompt = data['prompt']
    documents = retrieve_documents(prompt)
    return jsonify({'documents': documents})

def main():
    folder_path = "Files"
    pdf_files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.endswith(".pdf")]

    if pdf_files:
        load_and_index_pdfs(pdf_files)
        print("Indexing completed.")
    else:
        print("No PDF documents found for indexing.")

if __name__ == '__main__':
    main()
    app.run(debug=True)
