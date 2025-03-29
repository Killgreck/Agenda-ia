import { useState } from "react";

export function TrainAI() {
  const [query, setQuery] = useState("");

  return (
    <div className="train-ai-container">
      <h1 className="train-ai-title">🤖 Entrena tu agente IA</h1>

      <input
        className="input-japan"
        placeholder="Introduce tus preferencias..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <button
        className="button-japan"
        onClick={() => alert(`Entrenando IA con: ${query}`)}
      >
        🚀 Entrenar IA
      </button>
    </div>
  );
}

export default TrainAI;



