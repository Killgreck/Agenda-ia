import { useState } from "react";

export function TrainAI() {
  const [query, setQuery] = useState("");

  return (
    <div style={{ padding: "40px", backgroundColor: "#FAFAFA", minHeight: "100vh", display: "flex", flexDirection: "column", gap: "32px" }}>
      <h1 style={{ fontSize: "36px", fontWeight: "300", color: "#2E2E2E" }}>🤖 Entrena tu agente IA</h1>

      <input
        placeholder="Introduce tus preferencias..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ padding: "16px", borderRadius: "12px", border: "none", backgroundColor: "#FFFFFF", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)", outline: "none", fontSize: "16px" }}
      />

      <button
        onClick={() => alert(`Entrenando IA con: ${query}`)}
        style={{ padding: "14px 28px", backgroundColor: "#4A90E2", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", transition: "background 0.3s" }}
      >
        🚀 Entrenar IA
      </button>
    </div>
  );
}

export default TrainAI;



