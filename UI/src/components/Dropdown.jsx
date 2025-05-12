function Dropdown({ selected, onChange }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label htmlFor="location-select">Select Location: </label>
      <select id="location-select" value={selected} onChange={onChange}>
        <option value="indoors">Indoors</option>
        <option value="outdoors">Outdoors</option>
        <option value="in-vehicle">In Vehicle</option>
      </select>
    </div>
  );
}

export default Dropdown;
