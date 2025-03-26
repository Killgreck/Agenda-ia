import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Preferences() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { text: "¡Hola! Soy tu asistente IA. ¿En qué puedo ayudarte a gestionar tus eventos?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");

  const handleSendMessage = () => {
    if (input.trim() === "") return;

    // Agregar el mensaje del usuario
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);

    // Simular una respuesta del agente IA
    setTimeout(() => {
      const botResponse = {
        text: `He recibido tu solicitud: "${input}". Ajustaré las preferencias según lo que necesites.`,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);

    setInput("");
  };

  return (
    <div
      style={{
        padding: "40px",
        backgroundColor: "#FAFAFA",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}
    >
      <h2
        style={{ fontSize: "36px", fontWeight: "300", color: "#2E2E2E" }}
      >
        🔧 Entrena tu agente IA
      </h2>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          borderRadius: "12px",
          padding: "20px",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "12px",
              textAlign: msg.sender === "user" ? "right" : "left",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "10px 16px",
                borderRadius: "12px",
                backgroundColor: msg.sender === "user" ? "#4A90E2" : "#EAEAEA",
                color: msg.sender === "user" ? "white" : "#333333",
              }}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #4A90E2",
            outline: "none",
            fontSize: "16px",
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            padding: "14px 28px",
            backgroundColor: "#4A90E2",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          ➤ Enviar
        </button>
      </div>

      <button
        onClick={() => navigate("/weekly")}
        style={{
          padding: "14px 28px",
          backgroundColor: "#FFFFFF",
          color: "#4A90E2",
          border: "1px solid #4A90E2",
          borderRadius: "12px",
          cursor: "pointer",
          transition: "background 0.3s",
        }}
      >
        ⬅️ Volver
      </button>
    </div>
  );
}

export default Preferences;
