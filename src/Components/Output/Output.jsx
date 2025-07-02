import './Output.css'

const Output = () => {

  const vehicleInfo = {
    vehicleIdentificationNumber: 'VIN1234567890ABCDE',
    ecuSerialNumberDataIdentifier: 'ECU-SN-9876543210',
    systemSupplierIdentifier: 'XYZ Automotive Systems',
    vehicleManufacturerEcuHardwareNumber: 'HW-ECU-2025-001',
    manufacturerSparePartNumber: 'SP-2025-ECU-001'
  };

  function InfoItem({ label, value, index }) {
    return (
      <div className={`info-item ${index % 2 === 1 ? 'even-item' : ''}`}>
        <div className="info-label">{label}:</div>
        <div className="info-value">{value}</div>
      </div>
    );
  }

  return (
    <div className='output-container'>
      <div className="info-title">Vehicle Information</div>
      <div className="info-grid">
        {Object.entries(vehicleInfo).map(([label, value], index) => (
          <InfoItem 
            key={index}
            label={label.replace(/([A-Z])/g, ' $1').trim()} 
            value={value}
            index={index}
          />
        ))}
      </div>
    </div>
  )
}

export default Output
