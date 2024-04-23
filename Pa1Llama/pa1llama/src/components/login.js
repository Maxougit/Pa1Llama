// components/Login.js
"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get("authToken");
      if (token) {
        try {
          await axios.get(`${process.env.RAG_URL}validate-token`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          onLogin(true);
        } catch (error) {
          console.error("Token validation error:", error);
          Cookies.remove("authToken"); // Remove invalid token
        }
      }
    };

    checkAuth();
  }, [onLogin]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.RAG_URL}login`, {
        username,
        password,
      });
      Cookies.set("authToken", response.data.access_token, { expires: 1 }); // Set cookie for 1 day
      onLogin(true);
    } catch (error) {
      const message =
        error.response?.data?.msg ||
        "Failed to login. Please check your credentials.";
      setError(message);
      console.error("Login error:", error);
    }
  };

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col justify-center items-center ">
      <div className="w-full max-w-xs">
        <form
          className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          onSubmit={handleLogin}
        >
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-400 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-xs italic">{error}</p>}
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
