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
    <div className="preferences-container">
      <h2 className="preferences-title">🔧 Entrena tu agente IA</h2>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${msg.sender === "user" ? "user-message" : "bot-message"}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="input-japan"
        />
        <button className="button-japan" onClick={handleSendMessage}>➤ Enviar</button>
      </div>

      <button className="button-japan-outline" onClick={() => navigate("/weekly")}>⬅️ Volver</button>
    </div>
  );
}

export default Preferences;