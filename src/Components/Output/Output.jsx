import { useState, useEffect } from 'react';
import './Output.css';

const Output = () => {
  const [vehicleInfo, setVehicleInfo] = useState({
    vehicleIdentificationNumber: '',
    ecuSerialNumberDataIdentifier: '',
    systemSupplierIdentifier: '',
    vehicleManufacturerEcuHardwareNumber: '',
    manufacturerSparePartNumber: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/vehicle_info');
        const data = await response.json();
        setVehicleInfo(data);
      } catch (error) {
        console.error('Error fetching vehicle info:', error);
      }
    };

    fetchData();  // Initial fetch
    const intervalId = setInterval(fetchData, 1000);  // Poll every 5 seconds

    return () => clearInterval(intervalId);  // Cleanup
  }, []);

  function InfoItem({ label, value, index }) {
    return (
      <div className={`info-item ${index % 2 === 0 ? 'even-item' : ''}`}>
        <div className="info-label">{label}:</div>
        <div className="info-value">{value}</div>
      </div>
    );
  }

  return (
    <div className='output-container'>
      <div className="info-title">Vehicle Information</div>
      <div className="info-grid">
        {Object.entries(vehicleInfo).map(([key, value], index) => (
          <InfoItem
            key={index}
            label={key.replace(/([A-Z])/g, ' $1').trim()}
            value={value}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default Output;