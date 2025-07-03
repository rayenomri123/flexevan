import './Navigations.css'
import { VscTools, VscLayoutSidebarLeft, VscLayoutSidebarLeftOff, VscBell, VscSettingsGear } from 'react-icons/vsc'

const Navigations = ({ isSettingsOpen, setIsSettingsOpen, isSearchSectionOpen, setIsSearchSectionOpen }) => {
  return (
    <div className='nav-container'>
      <button className="nav-button">
        <VscTools />
      </button>

      <button 
        className="nav-button" 
        onClick={() => setIsSearchSectionOpen(!isSearchSectionOpen)}
      >
        {isSearchSectionOpen ? <VscLayoutSidebarLeft /> : <VscLayoutSidebarLeftOff />}
      </button>

      <button className="nav-button">
        <VscBell />
      </button>

      <button 
        className={`nav-button ${isSettingsOpen ? 'active' : ''}`} 
        onClick={() => setIsSettingsOpen(true)}
      >
        <VscSettingsGear />
      </button>
    </div>
  )
}

export default Navigations