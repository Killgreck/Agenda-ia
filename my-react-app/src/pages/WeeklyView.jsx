import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export function WeeklyView() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [userId, setUserId] = useState("USER");

  const days = ["L", "M", "Mi", "J", "V", "S", "D"];
  const hours = Array.from({ length: 24 }, (_, i) => `${i + 1}:00`);

  // Cargar eventos y userId desde localStorage
  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem("events")) || [];
    setEvents(storedEvents);

    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      navigate("/"); // Redirige al login si no hay userId
    }
  }, [navigate]);

  return (
    <div className="weekly-container">
      <h1 className="weekly-title">Hola, {userId} 👋</h1>

      <div className="weekly-table-container">
        <table className="weekly-table">
          <thead>
            <tr>
              <th>Hora</th>
              {days.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td>{hour}</td>
                {days.map((day) => (
                  <td key={day + hour}>
                    {events.map((event, index) =>
                      event.day === day && event.hour === hour ? (
                        <div key={index} className="event-tag">
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

      <div className="weekly-buttons">
        <button className="button-japan" onClick={() => navigate("/add-event")}>➕ Agregar Tarea</button>
        <button className="button-japan" onClick={() => navigate("/settings")}>⚙️ Ajustes</button>

        <button className="button-japan-outline" onClick={() => setShowModal(true)}>📅 Periodo</button>

        <button className="button-japan-outline" onClick={() => navigate("/preferences")}>🔧 Preferencias</button>
      </div>

      {showModal && (
        <div className="modal-japan">
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

