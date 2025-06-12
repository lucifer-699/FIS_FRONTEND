import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/auth-context';
import { getFlightSchedule, updateFlightStatus, getAllStatuses, getAllRemarks, getEditData } from '../api/api';
import { storage } from '../storage';
import { useNavigate } from 'react-router-dom';
import { Pencil, Filter } from 'lucide-react';
import '../dashboard.css';

const Dashboard: React.FC = () => {
  const { username, password } = useAuth();
  const navigate = useNavigate();

  const [flights, setFlights] = useState<any[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<any[]>([]);
  const [flightNoFilter, setFlightNoFilter] = useState<string>('');
  const [selectedAirport, setSelectedAirport] = useState<string>('');
  const [shownAirport] = useState<string>(storage.get("airport") || "");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [currentFlight, setCurrentFlight] = useState<any>(null);
  const [status, setStatus] = useState<string>('-');
  const [revisedTime, setRevisedTime] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('-');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string }[]>([]);
  const [remarksOptions, setRemarksOptions] = useState<{ value: string; label: string }[]>([]);
  const [isCustomRemarks, setIsCustomRemarks] = useState<boolean>(false);
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [statusTime, setStatusTime] = useState<string>('');
  const [customRemarksMap, setCustomRemarksMap] = useState<Record<string, boolean>>({});



  const airportList = ['KTM', 'PKR', 'BDP', 'BWA', 'JKR', 'KEP', 'BIR', 'SIF'];

  useEffect(() => {
    document.title = "Yeti FlightInfo";
  
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.setAttribute("href", "/icon.png");
    } else {
      const newFavicon = document.createElement("link");
      newFavicon.rel = "icon";
      newFavicon.href = "/icon.png";
      document.head.appendChild(newFavicon);
    }
  }, []);
  
  useEffect(() => {
    const storedMap = localStorage.getItem("customRemarksMap");
    if (storedMap) {
      setCustomRemarksMap(JSON.parse(storedMap));
    }
  }, []);
  

  useEffect(() => {
    const checkTokenExpiry = () => {
      const expiry = storage.get("tokenExpiry");
      if (expiry && new Date().getTime() > expiry) {
        storage.remove("username");
        storage.remove("password");
        storage.remove("tokenExpiry");
        navigate("/");
      }
    };

    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 60000);
    return () => clearInterval(interval);
  }, [navigate]);



  const handlePreview = () => {
    navigate('/preview');
  };

  const handleLogout = () => {
    storage.remove("username");
    storage.remove("token");
    storage.remove("airport"); // Clear persisted airport
    localStorage.removeItem('selectedAirport'); 
    navigate("/");
  };

  const loadData = async (airport: string) => {
    setLoading(true);
    try {
      const response = await getFlightSchedule(airport);
      if (response && response.length > 0) {
        const processedFlights = response.map((flight: any) => ({
          flightId: flight.flightId,
          flightNo: flight.flightNo,
          destinationName: flight.destinationName,
          departureTime: flight.departureTime,
          revisedTime: flight.revisedTime ? formatTimeDisplay(flight.revisedTime) : '-',
          status: flight.flightStatus === 'ACTIVE' ? '-' : (flight.flightStatus || '-'),
          remarks: flight.flightstatusRemarks || '-',
          originName: flight.originName,
          hide: flight.hide || 0
        }));

        setFlights(processedFlights);
        setFilteredFlights(processedFlights);
        storage.set('cachedFlights', processedFlights, 60);
      } else {
        setFlights([]);
        setFilteredFlights([]);
        setError("No flight data available.");
      }
    } catch (err) {
      setError("Failed to load flight schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedAirport = localStorage.getItem('selectedAirport');
    if (savedAirport) {
      setSelectedAirport(savedAirport);
    }
  }, [flights]); 
  
  useEffect(() => {
    loadData(selectedAirport);
  }, [username, password, selectedAirport]);

  useEffect(() => {
    const loadDropdownOptions = async () => {
      try {
        const statuses = await getAllStatuses();
        const remarksList = await getAllRemarks();

        setStatusOptions(statuses.map((item: any) => ({ value: item.status, label: item.status })));
        setRemarksOptions(remarksList.map((item: any) => ({ value: item.remarks, label: item.remarks })));
      } catch (err) {
        console.error("Failed to load dropdown data", err);
      }
    };

    loadDropdownOptions();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedAirport) {
        loadData(selectedAirport);
      }
    }, 30000); // every 30 seconds
  
    return () => clearInterval(interval);
  }, [selectedAirport]);
  

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (!flightNoFilter) {
      setFilteredFlights(flights);
      return;
    }

    const filtered = flights.filter(flight => 
      flight.flightNo.slice(-3).toLowerCase() === flightNoFilter.slice(-3).toLowerCase()
    );
    setFilteredFlights(filtered);
  }, [flightNoFilter, flights]);

  const formatTimeDisplay = (time: string) => {
    if (!time || time === '-') return '-';
    if (time.length !== 4) return time;

    const hours = parseInt(time.slice(0, 2), 10);
    const minutes = time.slice(2, 4);
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;

    return `${formattedHours}:${minutes}`;
  };

  const formatTimeToBackend = (time: string): string => {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return '-';
    const [hours, minutes] = time.split(':');
    return `${hours}${minutes}`;
  };
  



  const handleEditClick = async (flight: any) => {
    try {
      // Use flightNo instead of flightId when fetching data
      const editData = await getEditData(flight.flightNo);
  
      // Set the current flight data in state
      setCurrentFlight(editData);
      setStatus(editData.flightStatus || '-');
      
      const rt = editData.revisedTime === '-' ? '' : formatTimeDisplay(editData.revisedTime);
      setRevisedTime(rt);
      
      setRemarks(editData.flightstatusRemarks || '-');
      setIsHidden(editData.hide === '1'); // Check for '1' to hide, '0' to unhide
      
      const rawStatusTime = editData.flightstatusTime;
      const formattedStatusTime = rawStatusTime && rawStatusTime.length === 4
        ? `${rawStatusTime.slice(0, 2)}:${rawStatusTime.slice(2, 4)}`
        : '';
      setStatusTime(formattedStatusTime);
      
      const wasChecked = customRemarksMap[flight.flightNo];
      setIsCustomRemarks(!!wasChecked); // Default to false
      
      
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching edit data:", err);
      setError('Failed to fetch edit data for this flight.');
    }
  };
  
  

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formattedRevisedTime = formatTimeToBackend(revisedTime);
      const formattedStatusTime = formatTimeToBackend(statusTime);
  
     
      await updateFlightStatus(
        currentFlight.flightNo,
        formattedRevisedTime || '',
        status ,
        remarks,
        isHidden ? 1 : 0,
        formattedStatusTime || ''
      );
  
      setSelectedAirport('');
      localStorage.removeItem('selectedAirport');  // Remove from localStorage
  
      // Reload data after clearing airport selection
      await loadData('');
  
      setShowModal(false);
    } catch (err) {
      setError('Failed to update flight status.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  

  const handleAirportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const airport = e.target.value;
    setSelectedAirport(airport);
    localStorage.setItem('selectedAirport', airport);
  };

  if (loading) return <div className="loading">Loading flight schedule...</div>;

  return (
    <div className="dashboard-container">
      <div className="header-container">
        <img src="/logo.png" alt="Company Logo" className="header-logo" />
        <h1>Flight Departure Information</h1>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

      <div className="controls">
        <div className="airport-selector">
          <h3>Airport :</h3>
          <div className="airport-name">{shownAirport || 'No airport selected'}</div>

          <select 
            value={selectedAirport} 
            onChange={handleAirportChange} 
            className="airport-dropdown"
          >
            <option value="">Current Airport</option>
            {airportList.map(airport => (
              <option key={airport} value={airport}>{airport}</option>
              
            ))}
          </select>
          <label className='arrival'>Arrival From :</label>
        </div>
    
        <div className="search-box-with-icon">
          <Filter className="filter-icon" />
          <div className="search-box">
            <input
              type="text"
              placeholder="Filter by Flight No"
              value={flightNoFilter}
              onChange={(e) => setFlightNoFilter(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="preview-button" onClick={handlePreview}>
            Preview
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-responsive">
        <table className="flight-table">
          <thead>
            <tr>
              <th>Flight No</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>ETD</th>
              <th>Status</th>
              <th>Revised Time</th>
              <th>Remarks</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
          {filteredFlights.map((flight) => (
              <tr key={flight.flightId}>
                <td>{flight.flightNo}</td>
                <td>{flight.originName}</td>
                <td>{flight.destinationName}</td>
                <td>{flight.departureTime}</td>
                <td className={`status-${(flight.status || '-').toLowerCase()}`}>{flight.status}</td>
                <td>{flight.revisedTime}</td>
                <td>{flight.remarks}</td>
                <td>
                  <button className="action-button" onClick={() => handleEditClick(flight)}>
                    <Pencil className="edit-icon" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && currentFlight && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>Update Flight Information</h2>
      
      {/* Flight Info Header */}
      <div className="flight-info-header">
        <h3>{currentFlight.flightNo}</h3>
        <p>Scheduled: {currentFlight.departureTime}</p>
      </div>

      {/* Status Field */}
      <div className="form-group">
        <label>Status *</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="status-select"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <span>@</span>
          <input
            type="time"
            value={statusTime}
            onChange={(e) => setStatusTime(e.target.value)}
            className="status-time-input"
            step="60"
          />
        </div>
      </div>

      {/* Revised Time Field */}
      <div className="form-group">
        <label>Revised Flight Time</label>
        <input
          type="time"
          value={revisedTime}
          onChange={(e) => setRevisedTime(e.target.value)}
          step="60"
        />
      </div>

      {/* Remarks Field */}
      <div className="form-group">
        <label>Remarks *</label>
        <div className="remarks-with-checkbox">
        <input
            type="checkbox"
            checked={isCustomRemarks}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsCustomRemarks(checked);

              if (currentFlight?.flightNo) {
                const updatedMap = {
                  ...customRemarksMap,
                  [currentFlight.flightNo]: checked,
                };
                setCustomRemarksMap(updatedMap);
                localStorage.setItem("customRemarksMap", JSON.stringify(updatedMap));
              }
            }}
          />

        </div>
        {isCustomRemarks ? (
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter custom remarks"
          />
        ) : (
          <select
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="remarks-select"
          >
            {remarksOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        )}
      </div>

      {/* Hide Flight Information Checkbox */}
      <div className="form-group-hide">
        <label>
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
          />
          Hide Flight Information
        </label>
      </div>

      {/* Modal Actions */}
      <div className="modal-actions">
        <button className="cancel-button" onClick={() => setShowModal(false)}>Cancel</button>
        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Submit'}
        </button>
      </div>
    </div>
  </div>
)}

   
     
    
    </div>
  );
};

export default Dashboard;
