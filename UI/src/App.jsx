import { useState } from 'react'
import './App.css'
import Dropdown from './components/Dropdown';

function App() {
  const [selectedLocation, setSelectedLocation] = useState('indoors');

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
  };

  return (
    <div className="app-container" style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Air Quality Dashboard</h1>

      {/* Dropdown */}
      <Dropdown selected={selectedLocation} onChange={handleLocationChange} />

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
