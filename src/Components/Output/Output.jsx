import { useState, useEffect, useRef } from 'react';
import { ScaleLoader } from 'react-spinners';

import './Output.css';

const Output = ({
  isRecorded,
  setIsRecorded,
  vehicleInfo,
  setVehicleInfo,
  reports,
  selectedReportId,
  isRunning
}) => {

  const prevRunningRef = useRef(false);
  const [port, setPort] = useState(6800);

  useEffect(() => {
    if (!prevRunningRef.current && isRunning) {
      setPort((prev) => prev + 1);
    }
    prevRunningRef.current = isRunning;
  }, [isRunning]);
  
  // 1) Fetch vehicle info every 500ms when running
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://localhost:${port.toString()}/vehicle_info`);
        const data = await response.json();

        // Check for errors inside the API response
        const hasError = Object.values(data).some(
          (v) => typeof v === 'string' && (v.includes('Exception') || v.includes('Error'))
        );

        if (hasError) {
          setVehicleInfo({
            vehicleIdentificationNumber: '',
            ecuSerialNumberDataIdentifier: '',
            systemSupplierIdentifier: '',
            vehicleManufacturerEcuHardwareNumber: '',
            manufacturerSparePartNumber: ''
          });
        } else {
          setVehicleInfo(data);
        }

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

    if (isRunning) {
      fetchData(); // Initial fetch
      const intervalId = setInterval(fetchData, 1000);
      return () => clearInterval(intervalId);
    }
  }, [isRunning, setVehicleInfo]);

  // 2) Clear all values when isRunning goes false
  useEffect(() => {
    if (!isRunning) {
      setVehicleInfo({
        vehicleIdentificationNumber: '',
        ecuSerialNumberDataIdentifier: '',
        systemSupplierIdentifier: '',
        vehicleManufacturerEcuHardwareNumber: '',
        manufacturerSparePartNumber: ''
      });
    }
  }, [isRunning, setVehicleInfo]);

  // 3) Determine if all values are present
  useEffect(() => {
    const allValuesPresent = Object.values(vehicleInfo).every(
      (value) => value !== null && value !== ''
    );
    setIsRecorded(allValuesPresent);
  }, [vehicleInfo, setIsRecorded]);

  // Find the selected report
  const selectedReport = reports.find((report) => report.id === selectedReportId);

  function InfoItem({ label, value, index }) {
    return (
      <div className={`info-item ${index % 2 === 0 ? 'even-item' : ''}`}>
        <div className={`info-label ${isRecorded && !selectedReportId ? 'recorded' : ''}`}>
          {label}:
        </div>
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
              return <InfoItem key={index} label={label} value={value} index={index} />;
            })}
          </div>
        </>
      ) : (
        <>
          <div className="info-title">Vehicle Information</div>
          {isRunning && !isRecorded ? (
            <div className='spinne-container'>
              <ScaleLoader
                color="#3498db"
                height={30}
                width={3}
                radius={2}
                margin={2}
                cssOverride={{
                  opacity: 0.4,
                  transform: 'scale(0.8)'  // optional: further scale down everything
                }}
              />
            </div>
          ) : (
            <div className="info-grid">
              {Object.entries(vehicleInfo).map(([key, value], index) => (
                <InfoItem
                  key={index}
                  label={key
                    .replace(/([A-Z])/g, ' $1')
                    .trim()
                    .replace(/^./, (str) => str.toUpperCase())}
                  value={value}
                  index={index}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Output;