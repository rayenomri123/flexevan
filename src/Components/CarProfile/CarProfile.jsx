import './CarProfile.css';
import car from '../../assets/car.png';
import { generateVehicleReportPdf } from '../../utils/pdfUtils';

const CarProfile = ({ isRecorded, vehicleInfo }) => {
  return (
    <div className="carprofile-container">
      <div className="car-title">FlexEvan</div>
      <div className="car-description">Optional Description</div>
      <div className="car-img-container">
        <img src={car} alt="FlexEvan" className="car-img" draggable="false" />
      </div>
      <div className="car-status">
        Status:
        <span className={`status-content ${isRecorded ? 'recorded' : 'unrecorded'}`}>
          {isRecorded ? 'Recorded' : 'Unrecorded'}
        </span>
        {isRecorded && (
          <button
            onClick={() => generateVehicleReportPdf(vehicleInfo)}
            className="export-button"
          >
            <u>Export report</u>
          </button>
        )}
      </div>
    </div>
  );
};

export default CarProfile;