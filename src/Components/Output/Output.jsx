import { useState, useEffect } from 'react';
import './Output.css';

const Output = ({ isRecorded, setIsRecorded, vehicleInfo, setVehicleInfo }) => {

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/vehicle_info');
        const data = await response.json();
        setVehicleInfo(data);
      } catch (error) {
        console.error('Error fetching vehicle info:', error);
        setVehicleInfo({
          vehicleIdentificationNumber: '',
          ecuSerialNumberDataIdentifier: '',
          systemSupplierIdentifier: '',
          vehicleManufacturerEcuHardwareNumber: '',
          manufacturerSparePartNumber: ''
        });
      }
    };

    fetchData();  // Initial fetch
    const intervalId = setInterval(fetchData, 500);

    return () => clearInterval(intervalId);  // Cleanup
  }, []);

  useEffect(() => {
    const allValuesPresent = Object.values(vehicleInfo).every(
      (value) => value !== null && value !== ''
    );

    if (allValuesPresent) {
      setIsRecorded(true);
    }

    else setIsRecorded(false);
  }, [vehicleInfo, setIsRecorded]);

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