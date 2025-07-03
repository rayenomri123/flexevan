import './Navigations.css'
import { VscTools , VscLayoutSidebarLeft, VscBell, VscSettingsGear } from 'react-icons/vsc'

const Navigations = () => {
  return (
    <div className='nav-container'>
      <button className="nav-button">
        <VscTools />
      </button>
      <button className="nav-button">
        <VscLayoutSidebarLeft />
      </button>
      <button className="nav-button">
        <VscBell />
      </button>
      <button className="nav-button">
        <VscSettingsGear />
      </button>
    </div>
  )
}

export default Navigations
