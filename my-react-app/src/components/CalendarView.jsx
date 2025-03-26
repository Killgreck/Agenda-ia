import { useState } from 'react';

const CalendarView = ({ events }) => {
  const days = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i + 1}:00`);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Bienvenido USERNAME</h2>
      <div className="flex justify-between mb-4">
        <button className="btn">AGREGAR TAREA</button>
        <button className="btn">AJUSTES</button>
        <button className="btn">PERIODO</button>
        <button className="btn">PREFERENCIAS</button>
      </div>

      <div className="grid grid-cols-8 border-t border-l">
        <div className="border-r border-b"></div>
        {days.map((day) => (
          <div key={day} className="text-center border-r border-b p-2">{day}</div>
        ))}

        {hours.map((hour) => (
          <>
            <div key={hour} className="border-r border-b p-2">{hour}</div>
            {days.map((day) => (
              <div key={day + hour} className="border-r border-b h-12"></div>
            ))}
          </>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
  