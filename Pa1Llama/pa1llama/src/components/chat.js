import React, { useState, useRef, useEffect } from "react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatCompletion = async (userInput) => {
    const ongoingMessageId = Date.now();

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "assistant", content: "", id: ongoingMessageId },
    ]);

    const data = JSON.stringify({
      model: "mistral",
      messages: [...messages, { role: "user", content: userInput }],
      stream: true,
    });

    try {
      const response = await fetch(`${process.env.API_URL}chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      });

      const reader = response.body.getReader();

      const read = async () => {
        const { done, value } = await reader.read();
        if (done) return;
        const chunk = new TextDecoder("utf-8").decode(value);

        try {
          const json = JSON.parse(chunk);
          if (!json.done) {
            // Update the ongoing message content with the new chunk
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === ongoingMessageId
                  ? { ...msg, content: msg.content + json.message.content }
                  : msg
              )
            );
          }
        } catch (error) {
          console.error("Chunk parsing error:", error);
        }
        read();
      };

      read();
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  // Handle input submission
  const handleSubmit = (event) => {
    event.preventDefault();
    if (!inputText.trim()) return;
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", content: inputText },
    ]);
    fetchChatCompletion(inputText);
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
