import './NavigationSection.css'
import Navigations from '../../Components/Navigations/Navigations'

const NavigationSection = () => {
  return (
    <div className='navigation-section-content'>
      <div className="logo-container"></div>
      <div className="navigation-container">
        <Navigations />
      </div>
      <div className="profile-container"></div>
    </div>
  )
}

export default NavigationSection
