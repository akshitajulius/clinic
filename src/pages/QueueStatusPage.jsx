import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './QueueStatusPage.module.css';

export default function QueueStatusPage() {
  const navigate = useNavigate(); 
  // Using state to track the 3 required phases: 0 = Waiting, 1 = Almost Ready, 2 = Served
  const [phase, setPhase] = useState(0);

  // Mock data
  const statusData = [
    { position: 4, wait: '~20 min', label: 'Waiting', colorClass: styles.waiting },
    { position: 1, wait: '~2 min', label: 'Almost ready', colorClass: styles.almostReady },
    { position: 0, wait: '0 min', label: 'Ready To Serve', colorClass: styles.readytoserve }
  ];

  const current = statusData[phase];

  const advanceQueue = () => {
    if (phase < 2) setPhase(phase + 1);
  };

  const resetQueue = () => {
    setPhase(0);
  };

  return (
    <div className={styles.page}>
      <Navbar role="user" />
      <div className={styles.content}>
        
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Live Queue Status</h1>
            <p className={styles.sub}>General Checkup</p>
          </div>
          
          {/* Button Container for Layout */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* New Return to Dashboard Button */}
            <button 
              className={styles.simulateBtn} 
              onClick={() => navigate('/dashboard')}
            >
              Return to Dashboard
            </button>

            {/* Simulator button*/}
            <button className={styles.simulateBtn} onClick={phase === 2 ? resetQueue : advanceQueue}>
              {phase === 2 ? 'Reset Simulation' : 'Simulate Time Passing'}
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.statusHeader}>
            <span className={`${styles.badge} ${current.colorClass}`}>
              {current.label}
            </span>
          </div>

          <div className={styles.metricsGrid}>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Your Position</span>
              <span className={styles.metricValue}>
                {current.position === 0 ? '-' : `#${current.position}`}
              </span>
            </div>
            
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Est. Wait Time</span>
              <span className={styles.metricValue}>{current.wait}</span>
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
        </div>
      </div>
    </div>
  );
}