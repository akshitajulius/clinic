import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './JoinQueuePage.module.css';

import { syncServices } from '../backend/data/store.js';

const API = 'http://localhost:3001';

export default function JoinQueuePage() {
  const navigate = useNavigate(); 
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [ticketId, setTicketId] = useState(null); 
  
  // Smart Feature: State for the recommendation
  const [smartRec, setSmartRec] = useState(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await fetch(`${API}/services`);
        const json = await res.json();
        if (json.success) {
          setServices(json.data);
          syncServices(json.data);
        }
      } catch {
        /* network error */
      }
    };
    loadServices();
  }, []);

  const handleJoin = async (e) => {
    e.preventDefault(); 
    
    if (!selectedService) {
      setError('Please select a service before joining the queue.');
      return;
    }

    try {
      const res = await fetch(`${API}/queue/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'patient-123', serviceId: Number(selectedService) }),
      });
      const result = await res.json();
      if (result.success) {
        setError('');
        setJoined(true);
        setTicketId(result.data?.id || null);
        setSmartRec(null); // Clear the recommendation once joined
      } else {
        setError(result.errors?.join(', ') || 'Failed to join queue');
      }
    } catch {
      setError('Network error. Please try again.');
    }
  };

  const handleLeave = async () => {
    if (ticketId) {
      try {
        // Cancel the active ticket
        await fetch(`${API}/queue/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entryId: ticketId }),
        });

        // Log the cancellation in the user's history
        await fetch(`${API}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: 'patient-123', 
            serviceId: Number(selectedService), 
            outcome: 'Left Queue' 
          })
        });
      } catch { /* ignore */ }
    }
    setJoined(false);
    setSelectedService('');
    setTicketId(null);
  };

  const currentServiceDetails = services.find(s => s.id === Number(selectedService));

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
                
                // Smart Feature: Trigger the backend fetch when the user selects a service
                onChange={async (e) => {
                  const newServiceId = e.target.value;
                  setSelectedService(newServiceId);
                  setError(''); 
                  setSmartRec(null); // Clear old recommendations when switching

                  if (newServiceId) {
                    try {
                      // Fetch the alternative recommendation from our new API route
                      const res = await fetch(`${API}/smart-recommendation/${newServiceId}`);
                      const json = await res.json();
                      if (json.success && json.data) {
                        setSmartRec(json.data);
                      }
                    } catch (err) {
                      // Fail silently so it doesn't break the main UI
                    }
                  }
                }}
              >
                <option value="">-- Choose a service --</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} 
                  </option>
                ))}
              </select>
              
              {error && <div className={styles.errorText}>{error}</div>}

              {currentServiceDetails && (
                <div className={styles.waitTimeDisplay}>
                  <strong>Estimated Wait Time:</strong> {currentServiceDetails.avgWait}
                </div>
              )}

              {/* Smart Feature: Display the recommendation box if one exists */}
              {smartRec && (
                <div style={{ backgroundColor: '#eef8ff', padding: '15px', borderRadius: '8px', marginTop: '10px', border: '1px solid #bce0fd' }}>
                  <p style={{ margin: '0 0 10px 0', color: '#0056b3' }}>
                    <strong>Smart Tip:</strong> {smartRec.message}
                  </p>
                  <button 
                    type="button" 
                    onClick={() => {
                      setSelectedService(smartRec.serviceId.toString());
                      setSmartRec(null); // Clear the box after they click it
                    }}
                    style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                  >
                    Switch to {smartRec.serviceName} (Wait: {smartRec.estimatedWaitTime})
                  </button>
                </div>
              )}

              <button type="submit" className={styles.joinBtn}>Join Queue</button>
            </form>
          ) : (
            <div className={styles.successState}>
              <h2>You are in line!</h2>
              <p>You have successfully joined the queue for <strong>{currentServiceDetails?.name}</strong>.</p>
              <p>Estimated Wait: {currentServiceDetails?.avgWait}</p>
              <button onClick={handleLeave} className={styles.leaveBtn}>Leave Queue</button>
              
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