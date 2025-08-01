import './CarProfile.css';
import car from '../../assets/car.png';
import logo from '../../assets/logo.png';
import { generateVehicleReportPdf } from '../../utils/pdfUtils';

const CarProfile = ({ isRecorded, vehicleInfo, selectedReportId }) => {
  return (
    <div className="carprofile-container">
      <div className="car-title">FlexEvan</div>
      <div className="car-description">Renault FlexEVan, built for modern mobility.</div>
      <div className="car-img-container">
        <img src={logo} alt="FlexEvan" className="logo-img" draggable="false" />
        <img src={car} alt="FlexEvan" className="car-img" draggable="false" />
      </div>
      
      <div className="car-status">
        Status:
        <span className={`status-content ${isRecorded && !selectedReportId ? 'recorded' : 'unrecorded'}`}>
          {isRecorded && !selectedReportId ? 'Recorded' : 'Unrecorded'}
        </span>
        {isRecorded && !selectedReportId && (
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