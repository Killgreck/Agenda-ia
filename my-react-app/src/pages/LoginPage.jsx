import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/weekly");
  };

  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", backgroundColor: "#FAFAFA" }}>
      <h1 style={{ fontSize: "40px", fontWeight: "300", marginBottom: "40px", color: "#2E2E2E" }}>Calendario IA</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px", width: "320px" }}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "14px", fontSize: "16px", borderRadius: "12px", border: "none", background: "#FFFFFF", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)", outline: "none" }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "14px", fontSize: "16px", borderRadius: "12px", border: "none", background: "#FFFFFF", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.05)", outline: "none" }}
        />
        <button type="submit" style={{ padding: "14px", fontSize: "16px", borderRadius: "12px", backgroundColor: "#4A90E2", color: "white", cursor: "pointer", border: "none", transition: "background 0.3s" }}>
          Iniciar sesión
        </button>
      </form>
      <p style={{ marginTop: "20px", color: "#4A90E2", cursor: "pointer", fontSize: "14px" }} onClick={() => alert("Recuperar contraseña")}>¿Olvidaste tu contraseña?</p>
    </div>
  );
}

export default LoginPage;
