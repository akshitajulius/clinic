import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useNotifications } from '../context/NotificationContext';
import styles from './UserDashboard.module.css';
import { listServices, getQueuePosition } from '../backend/api';

export default function UserDashboard() {
  const navigate = useNavigate(); 
  const { addNotification } = useNotifications();

  // State for live data from the backend
  const [services, setServices] = useState([]);
  const [activeQueue, setActiveQueue] = useState(null);

  // Hardcoded for assignment phase consistency
  const userId = 'patient-123';

  useEffect(() => {
    // 1. Fetch all clinic services from the backend
    const servicesResult = listServices();
    if (servicesResult.success) {
      setServices(servicesResult.data);

      // 2. Check if the user is currently waiting in any of these service queues
      for (const service of servicesResult.data) {
        const posResult = getQueuePosition(userId, service.id);
        if (posResult.success) {
          // Found an active queue! Save it to state and stop searching
          setActiveQueue({
            serviceName: service.name,
            position: posResult.data.position,
            estWait: posResult.data.estimatedWaitTime,
            status: posResult.data.position === 1 ? 'Next Up' : 'Waiting'
          });
          break; 
        }
      }
    }
  }, []);

  return (
    <div className={styles.page}>
      <Navbar role="user" />
      
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Patient Dashboard</h1>
            <p className={styles.sub}>Welcome back! Here is your queue status and available services.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className={styles.testBtn}
              onClick={() => addNotification('Your turn for General Checkup is approaching!', 'update')}
            >
              + Test Notification
            </button>

            <button
              className={styles.testBtn}
              onClick={() => navigate('/history')}
            >
              My History
            </button>
            
            <button
              className={styles.testBtn}
              style={{ background: '#2563eb', color: 'white', borderColor: '#2563eb' }}
              onClick={() => navigate('/join')}
            >
              + Join a Queue
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          {/* Left Column: Dynamically displays empty state or active queue */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Current Status</h2>
            
            {!activeQueue ? (
              <div className={styles.serviceCard} style={{ textAlign: 'center', padding: '32px' }}>
                <p style={{ color: '#64748b', marginBottom: '16px' }}>
                  You are not currently waiting in any queues.
                </p>
                <button
                  className={styles.testBtn}
                  style={{ background: '#2563eb', color: 'white', borderColor: '#2563eb' }}
                  onClick={() => navigate('/join')}
                >
                  Join a Queue Now
                </button>
              </div>
            ) : (
              <div 
                className={styles.serviceCard} 
                onClick={() => navigate('/status')}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                title="Click to view live queue details"
              >
                <div className={styles.serviceTop}>
                  <span className={styles.serviceName}>{activeQueue.serviceName}</span>
                  <span className={`${styles.statusBadge} ${styles.waiting}`}>{activeQueue.status}</span>
                </div>
                <div className={styles.serviceMeta}>
                  <span>Position: #{activeQueue.position}</span>
                  <span>Est. Wait: {activeQueue.estWait}</span>
                </div>
              </div>
            )}
          </section>

          {/* Right Column: List of real available services pulled from backend */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Available Services</h2>
            <div className={styles.serviceList}>
              {services.map((s) => (
                <div key={s.id} className={styles.serviceCard}>
                  <div className={styles.serviceTop}>
                    <span className={styles.serviceName}>{s.name}</span>
                    {/* Assuming all services are open by default for this phase */}
                    <span className={`${styles.statusBadge} ${styles.open}`}>
                      Open
                    </span>
                  </div>
                  <div className={styles.serviceMeta}>
                    <span>Avg wait: {s.avgWait}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}