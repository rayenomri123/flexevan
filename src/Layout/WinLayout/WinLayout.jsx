import { useState, useRef } from 'react';
import './WinLayout.css';
import doc from '../../assets/doc.png';
import { VscClose } from 'react-icons/vsc';
import NavigationSection from '../NavigationSection/NavigationSection';
import CarProfile from '../../Components/CarProfile/CarProfile';
import Output from '../../Components/Output/Output';
import Console from '../../Components/Console/Console';
import Controls from '../../Components/Controls/Controls';
import SearchSection from '../../Components/SearchSection/SearchSection';
import Settings from '../../Components/Settings/Settings';
import SaveField from '../../Components/SaveField/SaveField';

const WinLayout = () => {
  const [isSearchSectionOpen, setIsSearchSectionOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHomeOpen, setIsHomeOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isRecorded, setIsRecorded] = useState(false);
  const [isToSave, setIsToSave] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState({
    vehicleIdentificationNumber: '',
    ecuSerialNumberDataIdentifier: '',
    systemSupplierIdentifier: '',
    vehicleManufacturerEcuHardwareNumber: '',
    manufacturerSparePartNumber: ''
  });
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null); // Add state for selected report
  const settingsRef = useRef(null);
  const saveRef = useRef(null);

  const handleOutsideClick = (event) => {
    if (settingsRef.current && !settingsRef.current.contains(event.target)) {
      setIsSettingsOpen(false);
    } else if (saveRef.current && !saveRef.current.contains(event.target)) {
      setIsToSave(false);
    }
  };

  return (
    <div className='layout-container'>
      {isSettingsOpen && (
        <div className="settings-section" onClick={handleOutsideClick}>
          <div className="settings-section-close-btn" onClick={() => setIsSettingsOpen(false)}>
            <VscClose />
          </div>
          <div ref={settingsRef}>
            <Settings />
          </div>
        </div>
      )}
      {isRecorded && isToSave && (
        <div className="settings-section" onClick={handleOutsideClick}>
          <div className="save-section-close-btn" onClick={() => setIsToSave(false)}>
            <VscClose />
          </div>
          <div ref={saveRef}>
            <SaveField vehicleInfo={vehicleInfo} setIsToSave={setIsToSave} setRefresh={setRefresh} />
          </div>
        </div>
      )}
      <div className="navigation-section">
        <NavigationSection
          isSettingsOpen={isSettingsOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          isSearchSectionOpen={isSearchSectionOpen}
          setIsSearchSectionOpen={setIsSearchSectionOpen}
          isHomeOpen={isHomeOpen}
          setIsHomeOpen={setIsHomeOpen}
          isRunning={isRunning}
          setIsRunning={setIsRunning}
        />
      </div>
      {isHomeOpen ? (
        <>
          <div className="mid-section">
            {isSearchSectionOpen && (
              <div className="left-section">
                {!refresh && (
                  <SearchSection
                    reports={reports}
                    setReports={setReports}
                    selectedReportId={selectedReportId} // Pass selectedReportId
                    setSelectedReportId={setSelectedReportId} // Pass setter
                  />
                )}
              </div>
            )}
            <div className="right-section">
              <div className="right-top-section">
                <div className="right-top-left-section">
                  <Output
                    isRecorded={isRecorded}
                    setIsRecorded={setIsRecorded}
                    vehicleInfo={vehicleInfo}
                    setVehicleInfo={setVehicleInfo}
                    reports={reports}
                    selectedReportId={selectedReportId} // Pass selectedReportId
                  />
                </div>
                <div className="right-top-right-section">
                  <CarProfile
                    isRecorded={isRecorded}
                    setIsRecorded={setIsRecorded}
                    vehicleInfo={vehicleInfo}
                    setVehicleInfo={setVehicleInfo}
                  />
                </div>
              </div>
              <div className="right-bottom-section">
                <Console />
              </div>
            </div>
          </div>
          <div className="control-section">
            <Controls
              isRunning={isRunning}
              setIsRunning={setIsRunning}
              isRecorded={isRecorded}
              vehicleInfo={vehicleInfo}
              isToSave={isToSave}
              setIsToSave={setIsToSave}
            />
          </div>
        </>
      ) : (
        <div className="documentation-section">
          <img src={doc} alt="Documentation" className='documentation-img' />
        </div>
      )}
    </div>
  );
};

export default WinLayout;