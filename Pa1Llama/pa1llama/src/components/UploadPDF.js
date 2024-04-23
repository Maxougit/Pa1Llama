// components/UploadPDF.js
"use client";
import React, { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export default function UploadPDF() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]); // État pour garder une trace des fichiers téléchargés

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    // Vérifier si le fichier a déjà été téléchargé
    if (uploadedFiles.includes(file.name)) {
      setMessage("This file has already been uploaded.");
      return; // Ne pas continuer l'envoi si le fichier est déjà listé
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${process.env.RAG_URL}upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${Cookies.get("authToken")}`,
          },
        }
      );
      setMessage(response.data.message);
      setFile(null);
      setUploadedFiles((prevFiles) => [...prevFiles, file.name]);
    } catch (error) {
      setMessage("Error uploading file.");
      console.error("Upload error:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 w-1/5">
      <form onSubmit={handleUpload}>
        <input type="file" onChange={handleFileChange} accept=".pdf" />
        <button
          type="submit"
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
            !file ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!file}
        >
          Upload PDF
        </button>
      </form>
      {message && <p>{message}</p>}
      {uploadedFiles.length > 0 && (
        <div>
          <h3 className="mt-4">Uploaded Files:</h3>
          <ul>
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
