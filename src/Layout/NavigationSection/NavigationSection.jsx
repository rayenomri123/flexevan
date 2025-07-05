import './NavigationSection.css'
import Navigations from '../../Components/Navigations/Navigations'
import Power from '../../Components/Power/Power'
import Profile from '../../Components/Profile/Profile'
import { VscDebugDisconnect } from 'react-icons/vsc'
import { PiPlugsConnectedLight } from 'react-icons/pi'

const NavigationSection = ({ isSettingsOpen, setIsSettingsOpen, isSearchSectionOpen, setIsSearchSectionOpen, isHomeOpen, setIsHomeOpen, isRunning, setIsRunning }) => {
  return (
    <div className='navigation-section-content'>
      <div className="power-container">
        <Power />
      </div>
      <div className="navigation-container">
        <Navigations 
          isSettingsOpen={isSettingsOpen} 
          setIsSettingsOpen={setIsSettingsOpen} 
          isSearchSectionOpen={isSearchSectionOpen} 
          setIsSearchSectionOpen={setIsSearchSectionOpen}
          isHomeOpen={isHomeOpen} 
          setIsHomeOpen={setIsHomeOpen}
        />
      </div>
      <div className="connection-container">
        <div className="connection-icon-container">
          {isRunning ? (<PiPlugsConnectedLight className='connected' />) : (<VscDebugDisconnect className='disconnected' />)}
        </div>
      </div>
      <div className="profile-container">
        <Profile />
      </div>
    </div>
  )
}

export default NavigationSection
