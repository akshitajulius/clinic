import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './JoinQueuePage.module.css';
import { joinQueue, leaveQueue } from '../backend/api'; 
import { syncServices } from '../backend/data/store.js';

const API = 'http://localhost:3001';

export default function JoinQueuePage() {
  const navigate = useNavigate(); 
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [ticketId, setTicketId] = useState(null); 

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

  const handleJoin = (e) => {
    e.preventDefault(); 
    
    if (!selectedService) {
      setError('Please select a service before joining the queue.');
      return;
    }

    const result = joinQueue({
      userId: 'patient-123',
      serviceId: Number(selectedService)
    });

    if (result.success) {
      setError('');
      setJoined(true);
      setTicketId(result.data.id);
    } else {
      setError(result.errors.join(', '));
    }
  };

  const handleLeave = () => {
    if (ticketId) {
      leaveQueue(ticketId);
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
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  setError(''); 
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