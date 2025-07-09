import React, { useState, useRef, useEffect } from 'react';
import './WinLayout.css';
import { VscClose } from 'react-icons/vsc';
import NavigationSection from '../NavigationSection/NavigationSection';
import CarProfile from '../../Components/CarProfile/CarProfile';
import Output from '../../Components/Output/Output';
import Console from '../../Components/Console/Console';
import Controls from '../../Components/Controls/Controls';
import SearchSection from '../../Components/SearchSection/SearchSection';
import Settings from '../../Components/Settings/Settings';
import SaveField from '../../Components/SaveField/SaveField';
import Login from '../../Components/Login/Login';

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
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const settingsRef = useRef(null);
  const saveRef = useRef(null);

  const handleOutsideClick = (event) => {
    if (settingsRef.current && !settingsRef.current.contains(event.target)) {
      setIsSettingsOpen(false);
    } else if (saveRef.current && !saveRef.current.contains(event.target)) {
      setIsToSave(false);
    }
  };

  // Poll login status every 1 second
  const fetchLoginStatus = async () => {
    try {
      // fetch all users and find the one with loggedin === '1'
      const users = await window.electronAPI.fetchUsers();
      const loggedInUser = users.find(u => Number(u.loggedin) === 1);
      setIsLoggedIn(Boolean(loggedInUser));
    } catch (err) {
      console.error('Error fetching login status:', err);
      setIsLoggedIn(false);
    }
  };

  const handleSettings = () => {
    setIsSettingsOpen(prev => !prev);
  };

  useEffect(() => {
    const handleKeydown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleSettings();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  useEffect(() => {
    // initial fetch
    fetchLoginStatus();
    // start polling
    const intervalId = setInterval(fetchLoginStatus, 500);
    // cleanup on unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className='layout-container'>
      {/* If not logged in, show Login */}
      {!isLoggedIn && (
        <div className="login-section">
          <Login />
        </div>
      )}

      {/* Main app UI when logged in */}
      {isLoggedIn && (
        <>  
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
                <SaveField
                  vehicleInfo={vehicleInfo}
                  setIsToSave={setIsToSave}
                  setRefresh={setRefresh}
                />
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
                        selectedReportId={selectedReportId}
                        setSelectedReportId={setSelectedReportId}
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
                        selectedReportId={selectedReportId}
                        isRunning={isRunning}
                      />
                    </div>
                    <div className="right-top-right-section">
                      <CarProfile
                        isRecorded={isRecorded}
                        setIsRecorded={setIsRecorded}
                        vehicleInfo={vehicleInfo}
                        setVehicleInfo={setVehicleInfo}
                        selectedReportId={selectedReportId}
                      />
                    </div>
                  </div>
                  <div className="right-bottom-section">
                    <Console isRunning={isRunning} />
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
                  reports={reports}
                  selectedReportId={selectedReportId}
                />
              </div>
            </>
          ) : (
            <div className="documentation-section">
              
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WinLayout;