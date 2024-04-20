// pages/index.js
"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Login from "@/components/login";
import Chat from "@/components/chat";

const ChatInterface = () => (
  <div className="h-screen flex justify-center">
    {/* <div className="max-w-3xl w-full h-full py-5 flex flex-col gap-4">
      <div className="flex gap-3 items-center">
        <img
          src="https://bookface-images.s3.amazonaws.com/logos/ee60f430e8cb6ae769306860a9c03b2672e0eaf2.png"
          className="w-16 h-16 transform rotate-180"
        ></img>
        <h1 className="text-4xl">Pa1Llama</h1>
      </div> */}
    <Chat />
    {/* </div> */}
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
