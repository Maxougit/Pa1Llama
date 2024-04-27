from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_jwt_extended.exceptions import NoAuthorizationError
import secrets
import chromadb
from PyPDF2 import PdfReader
import os
import hashlib
import ollama

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Adjust in production

# Generate a secure random secret key for JWT
app.config['JWT_SECRET_KEY'] = secrets.token_urlsafe(32)
jwt = JWTManager(app)

# Initialize the ChromaDB client
chroma_client = chromadb.Client()

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

    # Créer ou récupérer une collection spécifique à l'utilisateur
    collection_name = f"{username}_pdf_docs"
    try:
        print(f"Attempting to create collection for user: {username}")
        collection = chroma_client.create_collection(name=collection_name)
        print("Collection created.")
    except chromadb.exceptions.UniqueConstraintError:
        collection = chroma_client.get_collection(name=collection_name)
        print(f"Collection for {username} already exists.")

    # Stocker la référence de la collection dans une sorte de store global ou de contexte
    app.config[f"{username}_collection"] = collection

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

def load_and_index_pdfs(pdf_files, username):
    collection = app.config[f"{username}_collection"]
    for pdf_file in pdf_files:
        reader = PdfReader(pdf_file)
        full_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + " "
        full_text = clean_text(full_text)
        for chunk in chunk_text(full_text):
            response = ollama.embeddings(model="snowflake-arctic-embed", prompt=chunk)
            embedding = response["embedding"]
            collection.add(ids=[pdf_file + hash_chunk(chunk)], embeddings=[embedding], documents=[chunk])


def retrieve_documents(prompt, username, n_results=3, threshold_ratio=1.25, threshold_limit=380):
    collection = app.config[f"{username}_collection"]  # Access the correct collection
    response = ollama.embeddings(model="snowflake-arctic-embed", prompt=prompt)
    query_embedding = response["embedding"]
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)
    
    # Check if the results list is empty
    if not results['distances']:
        return []  # Return an empty list if no documents are found

    first_distance = results['distances'][0][0] if results['distances'][0] else float('inf')
    
    filtered_documents = []
    if first_distance < float('inf'):  # Ensure there is at least one valid distance
        for idx, distance in enumerate(results['distances'][0]):
            if distance > threshold_limit:
                break
            if distance <= first_distance * threshold_ratio:
                filtered_documents.append(results['documents'][0][idx])

    return filtered_documents



@app.route('/retrieve', methods=['POST'])
@jwt_required()
def api_retrieve_documents():
    username = get_jwt_identity()  # Retrieve the username from the JWT
    data = request.json
    prompt = data['prompt']
    documents = retrieve_documents(prompt, username)  # Pass the username to the function
    return jsonify({'documents': documents})


# Gestion des fichiers
@app.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    username = get_jwt_identity()  # Récupérer le nom d'utilisateur à partir du JWT
    file = request.files['file']
    filename = file.filename
    file_path = os.path.join("Files", filename)
    file.save(file_path)
    
    # Charger le fichier dans la collection de l'utilisateur
    load_and_index_pdfs([file_path], username)
    
    # Suppression du fichier après indexation
    os.remove(file_path)
    return jsonify({'message': 'File uploaded successfully'})


# Suppression des données du vector store 
@app.route('/delete', methods=['DELETE'])
@jwt_required()
def delete_data():
    username = get_jwt_identity()
    collection_name = f"{username}_pdf_docs"
    chroma_client.delete_collection(name=collection_name)
    return jsonify({'message': 'All data deleted successfully'})


@app.route('/validate-token', methods=['GET'])
@jwt_required()
def validate_token():
    # Si le décorateur jwt_required est passé, le token est valide
    current_user = get_jwt_identity()
    return jsonify({'is_valid': True, 'user': current_user}), 200

if __name__ == '__main__':
    app.run(debug=True)
