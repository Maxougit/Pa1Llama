// pages/index.js
"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Login from "@/components/Login";
import Chat from "@/components/Chat";
import UploadPDF from "@/components/UploadPDF";
import Logout from "@/components/Logout";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showFileSystem, setShowFileSystem] = useState(false);

  const toggleFileSystem = () => {
    setShowFileSystem(!showFileSystem);
  };

  const ChatInterface = () => (
    <div className="h-screen flex justify-center">
      <Chat />
      {showFileSystem && <UploadPDF />}
      <button onClick={toggleFileSystem} className="bg-slate-600 w-20">
        {showFileSystem ? "Hide File System" : "Show File System"}
      </button>
      <Logout onLogout={setIsLoggedIn} />
    </div>
  );

  useEffect(() => {
    const loggedIn = Cookies.get("loggedIn") === "true";
    setIsLoggedIn(loggedIn);
  }, []);

  return (
    <div>
      {isLoggedIn ? <ChatInterface /> : <Login onLogin={setIsLoggedIn} />}
    </div>
  );
}
