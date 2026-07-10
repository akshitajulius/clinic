import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './JoinQueuePage.module.css';

// Mock data: Simulating the services for now
const mockServices = [
  { id: '1', name: 'General Checkup', waitTime: '~20 min', open: true },
  { id: '2', name: 'Vaccination', waitTime: '~5 min', open: true },
  { id: '3', name: 'Lab Draw', waitTime: 'Closed', open: false }
];

export default function JoinQueuePage() {
  const navigate = useNavigate(); 
  const [selectedService, setSelectedService] = useState('');
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault(); // Prevents the browser from refreshing
    
    // UI Validation: Require a selection
    if (!selectedService) {
      setError('Please select a service before joining the queue.');
      return;
    }
    
    setError('');
    setJoined(true);
  };

  const handleLeave = () => {
    setJoined(false);
    setSelectedService('');
  };

  // Find the wait time for the currently selected service
  const currentServiceDetails = mockServices.find(s => s.id === selectedService);

  return (
    <div className={styles.page}>
      <Navbar role="user" />
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <h1 className={styles.heading}>Join a Queue</h1>
          <p className={styles.sub}>Select a clinic service to see your estimated wait time.</p>
        </div>

        <div className={styles.card}>
          {!joined ? (
            <form onSubmit={handleJoin} className={styles.form}>
              <label className={styles.label} htmlFor="service-select">
                Select Service <span className={styles.required}>*</span>
              </label>
              
              <select 
                id="service-select"
                className={`${styles.select} ${error ? styles.selectError : ''}`}
                value={selectedService} 
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  setError(''); // Clear the error once they make a choice
                }}
              >
                <option value="">-- Choose a service --</option>
                {mockServices.map(s => (
                  <option key={s.id} value={s.id} disabled={!s.open}>
                    {s.name} {!s.open ? '(Closed)' : ''}
                  </option>
                ))}
              </select>
              
              {/* Validation Error Message */}
              {error && <div className={styles.errorText}>{error}</div>}

              {/* Dynamic Wait Time Display */}
              {currentServiceDetails && currentServiceDetails.open && (
                <div className={styles.waitTimeDisplay}>
                  <strong>Estimated Wait Time:</strong> {currentServiceDetails.waitTime}
                </div>
              )}

              <button type="submit" className={styles.joinBtn}>Join Queue</button>
            </form>
          ) : (
            <div className={styles.successState}>
              <h2>You are in line!</h2>
              <p>You have successfully joined the queue for <strong>{currentServiceDetails?.name}</strong>.</p>
              <p>Estimated Wait: {currentServiceDetails?.waitTime}</p>
              <button onClick={handleLeave} className={styles.leaveBtn}>Leave Queue</button>
              
              {/* Added the onClick navigation to this button */}
              <button 
                className={styles.dashboardBtn}
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </button>
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
}