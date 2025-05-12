import { useState } from 'react'
import './App.css'

function App() {
  const [selectedLocation, setSelectedLocation] = useState('indoors');

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
  };

  return (
    <div className="app-container" style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Air Quality Dashboard</h1>

      {/* Dropdown */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="location-select">Select Location: </label>
        <select id="location-select" value={selectedLocation} onChange={handleLocationChange}>
          <option value="indoors">Indoors</option>
          <option value="outdoors">Outdoors</option>
          <option value="in-vehicle">In Vehicle</option>
        </select>
      </div>

      {/* Placeholder chart */}
      <div
        style={{
          width: '100%',
          height: '300px',
          border: '2px dashed #ccc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}
      >
        <p>Chart will go here</p>
      </div>
    </div>
  );
};

export default App
