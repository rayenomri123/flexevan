import './WinLayout.css'
import NavigationSection from '../NavigationSection/NavigationSection'
import CarProfile from '../../Components/CarProfile/CarProfile'

const WinLayout = () => {
  return (
    <div className='layout-container'>
      <div className="navigation-section">
        <NavigationSection />
      </div>
      <div className="mid-section">
        <div className="left-section"></div>
        <div className="right-section">
            <div className="right-top-section">
                <div className="right-top-left-section"></div>
                <div className="right-top-right-section">
                  <CarProfile />
                </div>
            </div>
            <div className="right-bottom-section"></div>
        </div>
      </div>
      <div className="control-section">

      </div>
    </div>
  )
}

export default WinLayout
