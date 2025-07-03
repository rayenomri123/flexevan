import { useState, useRef } from 'react';
import './WinLayout.css';
import doc from '../../assets/doc.png'
import { VscClose } from 'react-icons/vsc';
import NavigationSection from '../NavigationSection/NavigationSection';
import CarProfile from '../../Components/CarProfile/CarProfile';
import Output from '../../Components/Output/Output';
import Console from '../../Components/Console/Console';
import Controls from '../../Components/Controls/Controls';
import SearchSection from '../../Components/SearchSection/SearchSection';
import Settings from '../../Components/Settings/Settings';

const WinLayout = () => {
  const [isSearchSectionOpen, setIsSearchSectionOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHomeOpen, setIsHomeOpen] = useState(false);
  const settingsRef = useRef(null);

  const handleOutsideClick = (event) => {
    if (settingsRef.current && !settingsRef.current.contains(event.target)) {
      setIsSettingsOpen(false);
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
      <div className="navigation-section">
        <NavigationSection 
          isSettingsOpen={isSettingsOpen} 
          setIsSettingsOpen={setIsSettingsOpen} 
          isSearchSectionOpen={isSearchSectionOpen} 
          setIsSearchSectionOpen={setIsSearchSectionOpen}
          isHomeOpen={isHomeOpen} 
          setIsHomeOpen={setIsHomeOpen} 
        />
      </div>
      {isHomeOpen? (
      <>
      <div className="mid-section">
        {isSearchSectionOpen && (
          <div className="left-section">
            <SearchSection />
          </div>
        )}
        <div className="right-section">
          <div className="right-top-section">
            <div className="right-top-left-section"><Output /></div> 
            <div className="right-top-right-section">
              <CarProfile />
            </div>
          </div>
          <div className="right-bottom-section">
            <Console />
          </div>
        </div>
      </div>
      <div className="control-section">
        <Controls />
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