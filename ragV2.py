import chromadb
from PyPDF2 import PdfReader
import os
import ollama
import hashlib

# Initialize the ChromaDB client
chroma_client = chromadb.Client()

try:
    collection = chroma_client.create_collection(name="pdf_docs")
except chromadb.exceptions.UniqueConstraintError:
    collection = chroma_client.get_collection(name="pdf_docs")

def clean_text(text):
    """Remove unnecessary characters and normalize whitespaces."""
    return ' '.join(text.split())

def chunk_text(text, chunk_size=1000):
    """Divide text into manageable chunks."""
    words = text.split()
    for i in range(0, len(words), chunk_size):
        yield ' '.join(words[i:i+chunk_size])

def hash_chunk(text):
    """Generate a hash for each text chunk."""
    return str(hashlib.md5(text.encode()).hexdigest())

def load_and_index_pdfs(pdf_files):
    """Load PDFs, extract text, split into chunks, and index them."""
    for pdf_file in pdf_files:
        reader = PdfReader(pdf_file)
        full_text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + " "
        full_text = clean_text(full_text)

        if full_text:
            for chunk in chunk_text(full_text):
                response = ollama.embeddings(model="snowflake-arctic-embed", prompt=chunk)
                embedding = response["embedding"]
                document_id = pdf_file + hash_chunk(chunk)
                collection.add(ids=[document_id], embeddings=[embedding], documents=[chunk])

def retrieve_documents(prompt, n_results=5, threshold_ratio=1.15):
    """Retrieve the most relevant documents based on the prompt."""
    response = ollama.embeddings(model="snowflake-arctic-embed", prompt=prompt)
    query_embedding = response["embedding"]
    results = collection.query(query_embeddings=[query_embedding], n_results=n_results)

    # Using cosine similarity to rank and filter documents
    first_distance = results['distances'][0][0]
    filtered_documents = [doc for idx, doc in enumerate(results['documents'][0])
                          if results['distances'][0][idx] <= first_distance * threshold_ratio]

    return filtered_documents

def main():
    folder_path = "Files"
    pdf_files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.endswith(".pdf")]

    if pdf_files:
        load_and_index_pdfs(pdf_files)
        print("Indexing completed.")
    else:
        print("No PDF documents found for indexing.")

    while True:
        prompt = input("Posez votre question (ou tapez 'exit' pour quitter) : ")
        if prompt.lower() == 'exit':
            break
        relevant_docs = retrieve_documents(prompt)
        if relevant_docs:
            print("Documents pertinents trouvés:", relevant_docs)
        else:
            print("Aucun document pertinent trouvé.")

if __name__ == "__main__":
    main()
