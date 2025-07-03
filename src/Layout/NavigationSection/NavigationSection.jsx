import './NavigationSection.css'
import Navigations from '../../Components/Navigations/Navigations'
import Logo from '../../Components/Logo/Logo'
import Profile from '../../Components/Profile/Profile'

const NavigationSection = () => {
  return (
    <div className='navigation-section-content'>
      <div className="logo-container">
        <Logo />
      </div>
      <div className="navigation-container">
        <Navigations />
      </div>
      <div className="profile-container">
        <Profile />
      </div>
    </div>
  )
}

export default NavigationSection
