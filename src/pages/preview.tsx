import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFlightPreview } from '../api/api';
import '../preview.css';

const Preview: React.FC = () => {
  const [flights, setFlights] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showBoardingPopup, setShowBoardingPopup] = useState(false);
  const [boardingFlights, setBoardingFlights] = useState<any[]>([]);
  const navigate = useNavigate();

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const formatDateTime = (date: Date) => {
    const day = date.getDate();
    const ordinal = getOrdinalSuffix(day);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${weekday}, ${day}${ordinal} ${month} ${year} ${time}`;
  };

  const loadPreviewData = async () => {
    try {
      const data = await getFlightPreview();
      setFlights(data);
      const now = new Date();
      setCurrentTime(formatDateTime(now));
      console.log("🔄 Flight data refreshed at:", now.toLocaleTimeString());
    } catch (err) {
      console.error("Failed to load flight preview data", err);
    }
  };

  useEffect(() => {
    const enterFullscreen = () => {
      const docElm = document.documentElement as any;
      if (docElm.requestFullscreen) {
        docElm.requestFullscreen();
      } else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
      } else if (docElm.webkitRequestFullscreen) {
        docElm.webkitRequestFullscreen();
      } else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen();
      }
    };

    enterFullscreen();
    loadPreviewData();

    const refreshInterval = setInterval(() => {
      loadPreviewData();
    }, 60000); // ✅ Refresh every 60 seconds

    return () => clearInterval(refreshInterval);
  }, []);

  useEffect(() => {
    const tableBody = document.querySelector('.flight-table .table-body') as HTMLElement;
    if (!tableBody || flights.length <= 10) return;

    let animationFrameId: number;
    let scrollPosition = 0;
    let isScrollingDown = true;
    const scrollSpeed = 0.5;
    const pauseDuration = 3000;
    let pauseTimeout: ReturnType<typeof setTimeout> | null = null;
    let isPaused = false;

    const getMaxScroll = () => tableBody.scrollHeight - tableBody.clientHeight;

    const scrollStep = () => {
      if (isPaused) return;

      const maxScroll = getMaxScroll();

      if (isScrollingDown) {
        scrollPosition += scrollSpeed;
        if (scrollPosition >= maxScroll) {
          scrollPosition = maxScroll;
          isScrollingDown = false;
          pauseScrolling();
        }
      } else {
        scrollPosition -= scrollSpeed;
        if (scrollPosition <= 0) {
          scrollPosition = 0;
          isScrollingDown = true;
          pauseScrolling();
        }
      }

      tableBody.scrollTop = scrollPosition;
      animationFrameId = requestAnimationFrame(scrollStep);
    };

    const pauseScrolling = () => {
      isPaused = true;
      if (pauseTimeout) clearTimeout(pauseTimeout);
      pauseTimeout = setTimeout(() => {
        isPaused = false;
        animationFrameId = requestAnimationFrame(scrollStep);
      }, pauseDuration);
    };

    animationFrameId = requestAnimationFrame(scrollStep);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (pauseTimeout) clearTimeout(pauseTimeout);
    };
  }, [flights]);

  useEffect(() => {
    const interval = setInterval(() => {
      const boarding = flights.filter(
        (flight) => flight.flightStatus?.toLowerCase().startsWith('boarding')
      );
      if (boarding.length > 0) {
        setBoardingFlights(boarding);
        setShowBoardingPopup(true);
        setTimeout(() => setShowBoardingPopup(false), 10000);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [flights]);

  return (
    <div className="preview-screen">
      <button
        className="back-button"
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen?.();
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
          }

          navigate('/dashboard');
        }}
      >
        ← Go Home
      </button>

      <div className="airline-logo">
        <img src="/logo.png" alt="Airline Logo" className="airline-logo-preview" />
      </div>

      <div className="header-section">
        <h1>BOARDING INFORMATION</h1>
        <h2>उडान जानकारी</h2>
        <img src="/departure.png" alt="Departure Logo" className="departure-logo" />
        <div className="time-display">
          {currentTime && <span>Last Updated: {currentTime}</span>}
        </div>
      </div>

      <div className="flight-table-container">
        <table className="flight-table">
          <thead className="table-header">
            <tr>
              <th>FLIGHT NO</th>
              <th>ORIGIN</th>
              <th>DESTINATION</th>
              <th>ETD</th>
              <th>REVISED TIME</th>
              <th>STATUS</th>
              <th className="remarks-column">REMARKS</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {flights.map((flight) => (
              <tr key={flight.flightId}>
                <td>{flight.flightNo}</td>
                <td>{flight.originName}</td>
                <td>{flight.destinationName}</td>
                <td>{flight.departureTime}</td>
                <td>{flight.revisedTime || '-'}</td>
                <td>{flight.flightStatus || '-'}</td>
                <td className="remarks">{flight.flightstatusRemarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBoardingPopup && (
        <div className="boarding-popup">
          <div className="popup-content">
            <img src="/logo.png" alt="Airline Logo" className="popup-logo" />
            <table className="boarding-table">
              <thead>
                <tr>
                  <th>FLIGHT NO</th>
                  <th>DESTINATION</th>
                </tr>
              </thead>
              <tbody>
                {boardingFlights.map((flight) => (
                  <tr key={flight.flightId}>
                    <td>{flight.flightNo}</td>
                    <td>{flight.destinationName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h1 className="blinking">BOARDING</h1>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preview;
