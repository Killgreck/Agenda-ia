import { useState } from 'react';

const EventForm = ({ onSubmit, onDelete, onCancel }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, date });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h2 className="text-xl font-bold mb-4">Agregar Evento</h2>
      <input
        type="text"
        placeholder="Título del evento"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 mb-4 w-full"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border p-2 mb-4 w-full"
      />
      <div className="flex gap-4">
        <button type="submit" className="btn">Agregar</button>
        <button type="button" onClick={onDelete} className="btn">Eliminar</button>
        <button type="button" onClick={onCancel} className="btn">Salir</button>
      </div>
    </form>
  );
};

export default EventForm;
