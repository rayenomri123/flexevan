import './CarProfile.css'
import car from '../../assets/car.png'

const CarProfile = () => {
  return (
    <div className='carprofile-container'>
        <div className="car-title">FlexEvan</div>
        <div className="car-description">Optional Description</div>
        <div className="car-img-container">
            <img src={car} alt="FlexEvan" className='car-img'/>
        </div>
        <div className="car-status">Status :<span className='status-content'>Recorded</span>-<u className='status-option'>Export Report</u></div>
    </div>
  )
}

export default CarProfile
