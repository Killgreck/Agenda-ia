import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function SettingsMenu() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="settings-menu-container">
      <button
        className={darkMode ? "button-japan-dark" : "button-japan-outline"}
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? "🌙 Desactivar Modo Nocturno" : "☀️ Activar Modo Nocturno"}
      </button>

      <button
        className="button-japan-outline"
        onClick={() => alert("Accediendo a más opciones...")}
      >
        🔒 Accede a más
      </button>

      <button
        className="button-japan-outline"
        onClick={() => alert("Guardando historial...")}
      >
        📊 Guardar historial
      </button>

      <button
        className="button-japan-outline"
        onClick={() => alert("Acerca de la aplicación...")}
      >
        📘 Acerca de
      </button>

      <button
        className="button-japan-danger"
        onClick={() => navigate("/")}
      >
        🚪 Cerrar sesión
      </button>
    </div>
  );
}

export default SettingsMenu;

