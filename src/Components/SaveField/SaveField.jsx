import React, { useState } from 'react';
import './SaveField.css';
import { VscBookmark } from 'react-icons/vsc';

const SaveField = ({ vehicleInfo, setIsToSave, setRefresh }) => {
  const [title, setTitle] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      
      return;
    }

    try {
      const report = {
        title: title.trim(),
        vehicle_identification_number: vehicleInfo?.vehicleIdentificationNumber || '',
        ecu_serial_number_data_identifier: vehicleInfo?.ecuSerialNumberDataIdentifier || '',
        system_supplier_identifier: vehicleInfo?.systemSupplierIdentifier || '',
        vehicle_manufacturer_ecu_hardware_number: vehicleInfo?.vehicleManufacturerEcuHardwareNumber || '',
        manufacturer_spare_part_number: vehicleInfo?.manufacturerSparePartNumber || '',
      };

      await window.electronAPI.addReport(report);
      setTitle(''); // Clear input after saving
      setIsToSave(false)
      setRefresh(true)
      setTimeout(() => setRefresh(false), 1);
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Failed to save report: ' + error.message);
    }
  };

  return (
    <div className='savefield-container'>
      <input
        type="text"
        className='save-input'
        placeholder='File name'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="save-field-icon-container" onClick={handleSave}>
        <VscBookmark />
      </div>
    </div>
  );
};

export default SaveField;