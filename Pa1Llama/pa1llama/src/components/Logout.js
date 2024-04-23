// components/Logout.js
"use client";
import React from "react";
import Cookies from "js-cookie";
import axios from "axios";

export default function Logout({ onLogout }) {
  const deleteFile = async () => {
    try {
      const response = await axios.delete(`${process.env.RAG_URL}delete`, {
        headers: {
          Authorization: `Bearer ${Cookies.get("authToken")}`,
        },
      });
      return response.status;
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleLogout = async () => {
    const filestatus = await deleteFile();
    if (Cookies.get("authToken") && filestatus === 200) {
      Cookies.remove("authToken");
      onLogout(false);
    } else {
      console.error("Error deleting file");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 w-20"
    >
      Sign Out
    </button>
  );
}
