import React from 'react';
import './CarCard.css';
import car from '../../assets/car.png';

const CarCard = ({ report, title, timestamp, isSelected, onSelect }) => {
  const handleClick = () => {
    onSelect(report); // Call the onSelect handler with the report data
  };

  return (
    <div
      className={`carcard-container ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()} // Accessibility
    >
      <div className="carcard-img-container">
        <img src={car} alt="Vehicle" className='carcard-img' draggable='false' />
      </div>
      <div className="carcard-name">{title || 'Unnamed Report'}</div>
      <div className="carcard-timestamp">{timestamp || 'Unknown time'}</div>
    </div>
  );
};

export default CarCard;