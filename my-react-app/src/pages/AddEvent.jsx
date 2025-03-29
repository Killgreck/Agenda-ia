import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function AddEvent() {
  const navigate = useNavigate();

  // Cargar eventos desde localStorage
  const [events, setEvents] = useState(() => {
    return JSON.parse(localStorage.getItem("events")) || [];
  });

  const [event, setEvent] = useState("");
  const [day, setDay] = useState("L");
  const [hour, setHour] = useState("1:00");
  const [editIndex, setEditIndex] = useState(null);

  const days = ["L", "M", "Mi", "J", "V", "S", "D"];
  const hours = Array.from({ length: 24 }, (_, i) => `${i + 1}:00`);

  // Actualizar localStorage cuando los eventos cambian
  useEffect(() => {
    localStorage.setItem("events", JSON.stringify(events));
  }, [events]);

  const handleAddOrEditEvent = () => {
    if (!event) {
      alert("Por favor, ingresa un evento.");
      return;
    }

    if (editIndex !== null) {
      const updatedEvents = [...events];
      updatedEvents[editIndex] = { event, day, hour };
      setEvents(updatedEvents);
      setEditIndex(null);
    } else {
      setEvents([...events, { event, day, hour }]);
    }

    setEvent("");
    setDay("L");
    setHour("1:00");
  };

  const handleEdit = (index) => {
    const { event, day, hour } = events[index];
    setEvent(event);
    setDay(day);
    setHour(hour);
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    const updatedEvents = events.filter((_, i) => i !== index);
    setEvents(updatedEvents);
  };

  return (
    <div className="add-event-container">
      <h2 className="add-event-title">📌 ¿Qué quieres añadir a tu itinerario?</h2>

      <input
        className="input-japan"
        placeholder="Describe tu evento..."
        value={event}
        onChange={(e) => setEvent(e.target.value)}
      />

      <div className="add-event-select">
        <select
          className="input-japan"
          value={day}
          onChange={(e) => setDay(e.target.value)}
        >
          {days.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select
          className="input-japan"
          value={hour}
          onChange={(e) => setHour(e.target.value)}
        >
          {hours.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      <div className="add-event-buttons">
        <button className="button-japan" onClick={handleAddOrEditEvent}>
          {editIndex !== null ? "✏️ Editar" : "➕ Agregar"}
        </button>

        <button className="button-japan-outline" onClick={() => navigate("/weekly")}>
          ⬅️ Salir
        </button>
      </div>

      <h3 className="add-event-subtitle">🗓️ Eventos Programados</h3>

      <ul className="add-event-list">
        {events.map((e, index) => (
          <li key={index} className="add-event-item">
            {e.event} - {e.day} a las {e.hour}
            <button className="button-japan-small" onClick={() => handleEdit(index)}>✏️ Editar</button>
            <button className="button-japan-small" onClick={() => handleDelete(index)}>❌ Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AddEvent;





