import './NavigationSection.css'
import Navigations from '../../Components/Navigations/Navigations'
import Logo from '../../Components/Logo/Logo'
import Profile from '../../Components/Profile/Profile'

const NavigationSection = ({ isSettingsOpen, setIsSettingsOpen, isSearchSectionOpen, setIsSearchSectionOpen, isHomeOpen, setIsHomeOpen }) => {
  return (
    <div className='navigation-section-content'>
      <div className="logo-container">
        <Logo />
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
      <div className="profile-container">
        <Profile />
      </div>
    </div>
  )
}

export default NavigationSection
