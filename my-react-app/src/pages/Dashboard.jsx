import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "40px", backgroundColor: "#FAFAFA", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h1 style={{ fontSize: "48px", fontWeight: "300", color: "#2E2E2E", marginBottom: "40px" }}>👋 ¡Bienvenido al Calendario IA!</h1>

      <button
        onClick={() => navigate("/weekly")}
        style={{ padding: "16px 32px", backgroundColor: "#4A90E2", color: "white", border: "none", borderRadius: "12px", fontSize: "18px", cursor: "pointer", transition: "background 0.3s" }}
      >
        📅 Ir a la Vista Semanal
      </button>
    </div>
  );
}

export default Dashboard;

