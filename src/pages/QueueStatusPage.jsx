import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './QueueStatusPage.module.css';

const API = 'http://localhost:3001';

export default function QueueStatusPage() {
  const navigate = useNavigate(); 
  const [positionInfo, setPositionInfo] = useState(null);
  const [error, setError] = useState('');
  
  const [activeServiceName, setActiveServiceName] = useState('Loading...');
  const [activeServiceId, setActiveServiceId] = useState(null);

  const userId = 'patient-123';

  const fetchLiveStatus = async () => {
    try {
      const servicesRes = await fetch(`${API}/services`);
      const servicesJson = await servicesRes.json();
      
      if (servicesJson.success) {
        for (const service of servicesJson.data) {
          const positionRes = await fetch(`${API}/queue/${service.id}/position/${userId}`);
          const positionData = await positionRes.json();
          
          if (positionData.success) {
            setPositionInfo(positionData.data);
            setActiveServiceName(service.name);
            setActiveServiceId(service.id);
            setError(''); 
            return; 
          }
        }
        
        setError('User is not currently in any queue. (Join the queue first!)');
        setActiveServiceName('No Active Queue');
        setActiveServiceId(null);
      }
    } catch (err) {
      setError('Network error while fetching queue status.');
    }
  };

const handleLeaveQueue = async () => {
    if (!activeServiceId) return;

    try {
      const queueRes = await fetch(`${API}/queue/${activeServiceId}`);
      const queueJson = await queueRes.json();

      if (queueJson.success) {
         const myEntries = queueJson.data.queue.filter(q => q.userId === userId);
         
         for (const entry of myEntries) {
            // 1. Cancel the active ticket
            await fetch(`${API}/queue/leave`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ entryId: entry.id })
            });

            // 2. Log the cancellation in the user's history
            await fetch(`${API}/history`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                 userId: userId, 
                 serviceId: activeServiceId, 
                 outcome: 'Left Queue' 
               })
            });
         }
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to leave queue:', err);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
  }, []);

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
            <p className={styles.sub}>{activeServiceName}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {activeServiceId && (
              <button 
                className={styles.simulateBtn} 
                onClick={handleLeaveQueue}
                style={{ borderColor: '#ef4444', color: '#ef4444' }}
              >
                Leave Queue
              </button>
            )}

            <button 
              className={styles.simulateBtn} 
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </button>

            <button className={styles.simulateBtn} onClick={fetchLiveStatus}>
              Refresh Status
            </button>
          </div>
        </div>

        <div className={styles.card}>
          {error ? (
            <div className={styles.errorText}>{error}</div>
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