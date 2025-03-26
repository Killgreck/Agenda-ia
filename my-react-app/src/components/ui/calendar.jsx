export function Calendar({ onChange, value }) {
  return (
    <input
      type="date"
      onChange={(e) => onChange(e.target.value)}
      value={value}
      className="p-2 border rounded"
    />
  );
}

  