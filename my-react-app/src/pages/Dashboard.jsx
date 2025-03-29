import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">👋 ¡Bienvenido al Calendario IA!</h1>

      <button className="button-japan" onClick={() => navigate("/weekly")}>📅 Ir a la Vista Semanal</button>
    </div>
  );
}

export default Dashboard;

