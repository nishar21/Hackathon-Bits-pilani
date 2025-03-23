import React, { useState } from "react";
import "../css/Chatbot.css";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to the chat
    setMessages((prev) => [...prev, { sender: "user", text: input }]);
    setInput("");

    try {
      // Send message to Django backend
      const response = await fetch("http://localhost:8000/api/ollama/ask/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ question: input }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add bot response to the chat
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: data.response },
        ]);
      } else {
        throw new Error("Failed to fetch response");
      }
    } catch (error) {
      console.error(error);
      // Add error message to the chat
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, something went wrong." },
      ]);
    }
  };

  return (
    <>
      {/* Overlay when chat is open */}
      {isOpen && <div className="overlay" onClick={() => setIsOpen(false)} />}

      {/* Chatbot button */}
      {!isOpen && (
        <button className="chat-button" onClick={() => setIsOpen(true)}>
          <img
            src="/robot.png" // Path to the image in the public folder
            alt="Chatbot"
            className="chat-icon"
          />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="header">
            <span>Chatbot</span>
            <button className="close-button" onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.sender === "user" ? "user-message" : "bot-message"
                }
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              className="input"
              placeholder="Type a message..."
            />
            <button className="send-button" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
