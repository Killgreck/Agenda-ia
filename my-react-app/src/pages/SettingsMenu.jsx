import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function SettingsMenu() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          padding: "14px 28px",
          border: "none",
          borderRadius: "12px",
          backgroundColor: darkMode ? "#4A90E2" : "#FFFFFF",
          color: darkMode ? "white" : "#4A90E2",
          cursor: "pointer",
          transition: "background 0.3s",
        }}
      >
        {darkMode ? "🌙 Desactivar Modo Nocturno" : "☀️ Activar Modo Nocturno"}
      </button>

      <button
        onClick={() => alert("Accediendo a más opciones...")}
        style={{
          padding: "14px 28px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #4A90E2",
          borderRadius: "12px",
          color: "#4A90E2",
          cursor: "pointer",
          transition: "background 0.3s",
        }}
      >
        🔒 Accede a más
      </button>

      <button
        onClick={() => alert("Guardando historial...")}
        style={{
          padding: "14px 28px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #4A90E2",
          borderRadius: "12px",
          color: "#4A90E2",
          cursor: "pointer",
          transition: "background 0.3s",
        }}
      >
        📊 Guardar historial
      </button>

      <button
        onClick={() => alert("Acerca de la aplicación...")}
        style={{
          padding: "14px 28px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #4A90E2",
          borderRadius: "12px",
          color: "#4A90E2",
          cursor: "pointer",
          transition: "background 0.3s",
        }}
      >
        📘 Acerca de
      </button>

      <button
        onClick={() => navigate("/")}
        style={{
          padding: "14px 28px",
          backgroundColor: "#FF5A5F",
          border: "none",
          borderRadius: "12px",
          color: "white",
          cursor: "pointer",
          transition: "background 0.3s",
        }}
      >
        🚪 Cerrar sesión
      </button>
    </div>
  );
}

export default SettingsMenu;

