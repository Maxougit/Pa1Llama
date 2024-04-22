import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const retrieveAndSendToLLM = async (userInput) => {
    try {
      // Attach JWT token to request headers
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Cookies.get("authToken")}`,
      };

      const response = await axios.post(
        `${process.env.RAG_URL}/retrieve`,
        { prompt: userInput },
        { headers: headers }
      );

      const contextDocuments = response.data.documents; // Sauvegarde du contexte récupéré

      // Préparation du message avec le contexte inclus
      const ongoingMessageId = Date.now();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", id: ongoingMessageId },
      ]);

      // Création du payload pour le LLM
      const payload = {
        model: "mistral",
        messages: [
          ...messages,
          {
            role: "user",
            content:
              "Respond to this prompt:" +
              userInput +
              " Using this data:" +
              contextDocuments.join(" "),
          },
        ],
        stream: true,
      };

      // Envoi au LLM
      const llmResponse = await fetch(`${process.env.API_URL}chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Traitement de la réponse du LLM
      const reader = llmResponse.body.getReader();
      const read = async () => {
        const { done, value } = await reader.read();
        if (done) return;
        const chunk = new TextDecoder("utf-8").decode(value);
        try {
          const json = JSON.parse(chunk);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === ongoingMessageId
                ? { ...msg, content: msg.content + json.message.content }
                : msg
            )
          );
        } catch (error) {
          console.error("Chunk parsing error:", error);
        }
        read();
      };

      read();
    } catch (error) {
      console.error("Error in fetch sequence:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to interact with LLM. " + error.code,
        },
      ]);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!inputText.trim()) return;
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: inputText },
    ]);
    retrieveAndSendToLLM(inputText);
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full w-full p-4 bg-black">
      <div className="flex flex-col grow overflow-auto mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message p-2 my-1 rounded-lg text-white ${
              message.role === "user"
                ? "bg-blue-500 ml-auto"
                : "bg-gray-500 mr-auto"
            }`}
            style={{ maxWidth: "80%", wordWrap: "break-word" }}
          >
            {message.content}
          </div>
        ))}
        <div ref={endOfMessagesRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex w-full mt-auto">
        <input
          type="text"
          placeholder="Type here..."
          className="input input-bordered flex-grow"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
        <button type="submit" className="btn btn-primary ml-2">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
