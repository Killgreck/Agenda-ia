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
    <div
      style={{
        padding: "40px",
        backgroundColor: "#FAFAFA",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        gap: "32px",
      }}
    >
      <h2
        style={{ fontSize: "36px", fontWeight: "300", color: "#2E2E2E" }}
      >
        📌 ¿Qué quieres añadir a tu itinerario?
      </h2>

      <input
        placeholder="Describe tu evento..."
        value={event}
        onChange={(e) => setEvent(e.target.value)}
        style={{
          padding: "16px",
          borderRadius: "12px",
          border: "none",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          outline: "none",
          fontSize: "16px",
        }}
      />

      <div style={{ display: "flex", gap: "20px" }}>
        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #4A90E2",
            cursor: "pointer",
          }}
        >
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <select
          value={hour}
          onChange={(e) => setHour(e.target.value)}
          style={{
            padding: "12px",
            borderRadius: "12px",
            border: "1px solid #4A90E2",
            cursor: "pointer",
          }}
        >
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <button
          onClick={handleAddOrEditEvent}
          style={{
            padding: "14px 28px",
            backgroundColor: "#4A90E2",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          {editIndex !== null ? "✏️ Editar" : "➕ Agregar"}
        </button>

        <button
          onClick={() => navigate("/weekly")}
          style={{
            padding: "14px 28px",
            backgroundColor: "#FFFFFF",
            color: "#4A90E2",
            border: "1px solid #4A90E2",
            borderRadius: "12px",
            cursor: "pointer",
            transition: "background 0.3s",
          }}
        >
          ⬅️ Salir
        </button>
      </div>

      <h3 style={{ fontSize: "28px", fontWeight: "300", color: "#2E2E2E" }}>🗓️ Eventos Programados</h3>
      <ul>
        {events.map((e, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            {e.event} - {e.day} a las {e.hour}
            <button onClick={() => handleEdit(index)} style={{ marginLeft: "10px" }}>✏️ Editar</button>
            <button onClick={() => handleDelete(index)} style={{ marginLeft: "10px" }}>❌ Eliminar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AddEvent;





