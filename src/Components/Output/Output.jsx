import { useState, useEffect } from 'react';
import './Output.css';

const Output = ({ isRecorded, setIsRecorded, vehicleInfo, setVehicleInfo, reports, selectedReportId }) => {
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

    fetchData(); // Initial fetch
    const intervalId = setInterval(fetchData, 500);

    return () => clearInterval(intervalId); // Cleanup
  }, [setVehicleInfo]);

  useEffect(() => {
    const allValuesPresent = Object.values(vehicleInfo).every(
      (value) => value !== null && value !== ''
    );

    if (allValuesPresent) {
      setIsRecorded(true);
    } else {
      setIsRecorded(false);
    }
  }, [vehicleInfo, setIsRecorded]);

  // Find the selected report
  const selectedReport = reports.find((report) => report.id === selectedReportId);

  function InfoItem({ label, value, index }) {
    return (
      <div className={`info-item ${index % 2 === 0 ? 'even-item' : ''}`}>
        <div className={`info-label ${isRecorded ? 'recorded' : ''}`}>{label}:</div>
        <div className="info-value">{value}</div>
      </div>
    );
  }

  return (
    <div className='output-container'>

      {selectedReport ? (
      <>
        <div className="info-title">Selected Report</div>
        <div className="info-grid">
          {[
            'ecu_serial_number_data_identifier',
            'manufacturer_spare_part_number',
            'system_supplier_identifier',
            'vehicle_identification_number',
            'vehicle_manufacturer_ecu_hardware_number'
          ].map((key, index) => {
            const value = selectedReport[key] ?? '—';
            const label = key
              .split('_')
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
            return (
              <InfoItem
                key={index}
                label={label}
                value={value}
                index={index}
              />
            );
          })}
        </div>
      </>
      ) : (
      <>
        <div className="info-title">Vehicle Information</div>
        <div className="info-grid">
          {Object.entries(vehicleInfo).map(([key, value], index) => (
            <InfoItem
              key={index}
              label={key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, (str) => str.toUpperCase())}
              value={value}
              index={index}
            />
          ))}
        </div>
      </>
      )}
    </div>
  );
};

export default Output;