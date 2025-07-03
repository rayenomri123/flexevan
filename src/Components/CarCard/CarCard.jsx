import './CarCard.css'
import car from '../../assets/car.png'

const CarCard = () => {
  return (
    <div className='carcard-container'>
      <div className="carcard-img-container">
        <img src={car} alt="FlexEvan" className='carcard-img' draggable='false' />
      </div>
      <div className="carcard-name">Name</div>
      <div className="carcard-timestamp">5 min ago</div>
    </div>
  )
}

export default CarCard
