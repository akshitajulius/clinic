import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './QueueStatusPage.module.css';
import { getQueuePosition } from '../backend/api';

export default function QueueStatusPage() {
  const navigate = useNavigate(); 
  const [positionInfo, setPositionInfo] = useState(null);
  const [error, setError] = useState('');

  // Hardcoded for assignment demonstration
  const userId = 'patient-123';
  const serviceId = 1; // General Checkup

  // Function to fetch the live status from the backend
  const fetchLiveStatus = () => {
    const result = getQueuePosition(userId, serviceId);
    if (result.success) {
      setPositionInfo(result.data);
      setError('');
    } else {
      setError(result.errors[0]);
    }
  };

  // Fetch status on mount
  useEffect(() => {
    fetchLiveStatus();
  }, []);

  // Determine UI phase based on backend position
  let phase = 0; 
  let label = 'Waiting';
  let colorClass = styles.waiting;

  if (positionInfo) {
    if (positionInfo.position === 1) {
      phase = 1;
      label = 'Almost ready';
      colorClass = styles.almostReady;
    } else if (positionInfo.position === 0) {
      phase = 2;
      label = 'Ready To Serve';
      colorClass = styles.readytoserve;
    }
  }

  return (
    <div className={styles.page}>
      <Navbar role="user" />
      <div className={styles.content}>
        
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Live Queue Status</h1>
            <p className={styles.sub}>General Checkup</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className={styles.simulateBtn} 
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </button>

            {/* Changed from simulating time passing to fetching actual live updates */}
            <button className={styles.simulateBtn} onClick={fetchLiveStatus}>
              Refresh Status
            </button>
          </div>
        </div>

        <div className={styles.card}>
          {error ? (
            <div className={styles.errorText}>{error} (Join the queue first!)</div>
          ) : (
            <>
              <div className={styles.statusHeader}>
                <span className={`${styles.badge} ${colorClass}`}>
                  {label}
                </span>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>Your Position</span>
                  <span className={styles.metricValue}>
                    {positionInfo?.position === 0 ? '-' : `#${positionInfo?.position || '--'}`}
                  </span>
                </div>
                
                <div className={styles.metricBox}>
                  <span className={styles.metricLabel}>Est. Wait Time</span>
                  <span className={styles.metricValue}>{positionInfo?.estimatedWaitTime || '--'}</span>
                </div>
              </div>

              <div className={styles.progressContainer}>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: phase === 0 ? '33%' : phase === 1 ? '66%' : '100%' }}
                  ></div>
                </div>
                <div className={styles.progressLabels}>
                  <span className={phase >= 0 ? styles.activeLabel : ''}>Waiting</span>
                  <span className={phase >= 1 ? styles.activeLabel : ''}>Almost Ready</span>
                  <span className={phase === 2 ? styles.activeLabel : ''}>Ready To Serve</span>
                </div>
              </div>

              {phase === 2 && (
                <div className={styles.readytoserveMessage}>
                  <h3>It is your turn!</h3>
                  <p>Please proceed to the front desk.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}