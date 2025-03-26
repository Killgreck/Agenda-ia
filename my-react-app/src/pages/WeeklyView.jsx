import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export function WeeklyView() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);

  const days = ["L", "M", "Mi", "J", "V", "S", "D"];
  const hours = Array.from({ length: 24 }, (_, i) => `${i + 1}:00`);

  // Cargar eventos desde localStorage
  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem("events")) || [];
    setEvents(storedEvents);
  }, []);

  return (
    <div style={{ padding: "40px", backgroundColor: "#FAFAFA", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "36px", fontWeight: "300", marginBottom: "40px", color: "#2E2E2E" }}>Hola, USERNAME 👋</h1>

      <div style={{ overflowX: "auto", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)", marginBottom: "40px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#FFFFFF" }}>
              <th style={{ padding: "12px", textAlign: "left", color: "#4A4A4A" }}>Hora</th>
              {days.map((day) => (
                <th key={day} style={{ padding: "12px", textAlign: "center", color: "#4A4A4A" }}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td style={{ padding: "10px", color: "#6B6B6B" }}>{hour}</td>
                {days.map((day) => (
                  <td key={day + hour} style={{ padding: "8px", borderBottom: "1px solid #EAEAEA" }}>
                    {events.map((event, index) =>
                      event.day === day && event.hour === hour ? (
                        <div key={index} style={{ backgroundColor: "#4A90E2", color: "white", padding: "4px 8px", borderRadius: "8px", marginBottom: "4px" }}>
                          {event.event}
                        </div>
                      ) : null
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <button onClick={() => navigate("/add-event")} style={{ padding: "14px 28px", backgroundColor: "#4A90E2", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", transition: "background 0.3s" }}>➕ Agregar Tarea</button>
        <button onClick={() => navigate("/settings")} style={{ padding: "14px 28px", backgroundColor: "#4A90E2", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", transition: "background 0.3s" }}>⚙️ Ajustes</button>

        <button
          onClick={() => setShowModal(true)}
          style={{ padding: "14px 28px", backgroundColor: "#FFFFFF", color: "#4A90E2", border: "1px solid #4A90E2", borderRadius: "12px", cursor: "pointer", transition: "background 0.3s" }}
        >
          📅 Periodo
        </button>

        <button
          onClick={() => navigate("/preferences")}
          style={{ padding: "14px 28px", backgroundColor: "#FFFFFF", color: "#4A90E2", border: "1px solid #4A90E2", borderRadius: "12px", cursor: "pointer", transition: "background 0.3s" }}
        >
          🔧 Preferencias
        </button>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: "20%",
            left: "50%",
            transform: "translate(-50%, -20%)",
            backgroundColor: "#FFFFFF",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2>Selecciona un periodo:</h2>
          <button onClick={() => alert("Día seleccionado")}>Día</button>
          <button onClick={() => alert("Mes seleccionado")}>Mes</button>
          <button onClick={() => alert("Año seleccionado")}>Año</button>
          <button onClick={() => setShowModal(false)}>Cerrar</button>
        </div>
      )}
    </div>
  );
}

export default WeeklyView;
