import React, { useEffect } from 'react';
import './SearchSection.css';
import CarCard from '../CarCard/CarCard';

const SearchSection = ({ reports, setReports, selectedReportId, setSelectedReportId }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Fetch all reports on component mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const fetchedReports = await window.electronAPI.fetchReports();
        console.log('Fetched reports:', fetchedReports);
        setReports(fetchedReports);
      } catch (error) {
        console.error('Error fetching reports:', error);
        alert('Failed to fetch reports: ' + error.message);
      }
    };
    fetchReports();
  }, [setReports]);

  // Handle search input changes
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    try {
      if (query.trim()) {
        const searchQuery = `${query.trim()}*`;
        const searchResults = await window.electronAPI.searchReports(searchQuery);
        console.log('Search results:', searchResults);
        setReports(searchResults);
      } else {
        const fetchedReports = await window.electronAPI.fetchReports();
        setReports(fetchedReports);
      }
    } catch (error) {
      console.error('Error searching reports:', error);
      alert('Failed to search reports: ' + error.message);
    }
  };

  // Handle card selection with toggle functionality
  const handleCardSelect = (report) => {
    setSelectedReportId((prevId) => (prevId === report.id ? null : report.id));
    console.log('Selected report ID:', report.id);
  };

  return (
    <div className='searchsection-container'>
      <div className="search-container">
        <input
          type="text"
          placeholder='Search...'
          className='search-input'
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>
      <div className="card-container">
        {reports.length > 0 ? (
          reports.map((report) => (
            <CarCard
              key={report.id}
              report={report}
              title={report.title}
              timestamp={report.created_at}
              isSelected={report.id === selectedReportId}
              onSelect={handleCardSelect}
            />
          ))
        ) : (
          <div></div>
        )}
      </div>
    </div>
  );
};

export default SearchSection;