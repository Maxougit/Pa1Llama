// pages/index.js
"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Login from "@/components/Login";
import Chat from "@/components/Chat";

const ChatInterface = () => (
  <div className="h-screen flex justify-center">
    <Chat />
  </div>
);

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
