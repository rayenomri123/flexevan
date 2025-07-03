import './SearchSection.css'
import CarCard from '../CarCard/CarCard'

const SearchSection = () => {
  return (
    <div className='searchsection-container'>
        <div className="search-container">
            <input type="text" placeholder='Search...' className='search-input' />
        </div>
        <div className="card-container">
            <CarCard/>
            <CarCard/>
            <CarCard/>
        </div>
    </div>
  )
}

export default SearchSection
