import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useNotifications } from '../context/NotificationContext';
import styles from './UserDashboard.module.css';

// Mock data for now: Simulating a queue on the main page to the left for a user who just logged in.
const mockActiveQueue = {
  service: 'General Checkup',
  position: 3,
  estWait: '~20 min',
  status: 'Waiting'
};

// Mock data: Simulating the services they can join
const mockServices = [
  { name: 'General Checkup', open: true, avgWait: '18 min' },
  { name: 'Vaccination', open: true, avgWait: '5 min' },
  { name: 'Lab Draw', open: false, avgWait: '—' },
];

export default function UserDashboard() {
  const navigate = useNavigate(); 
  const { addNotification } = useNotifications();

  return (
    <div className={styles.page}>
      {/* 1. Reusing the Navbar, but setting the role to user */}
      <Navbar role="user" />
      
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Patient Dashboard</h1>
            <p className={styles.sub}>Welcome back! Here is your queue status and available services.</p>
          </div>
          
          {/* Button Container for Layout */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* 2. Notification simulation}
            <button
              className={styles.testBtn}
              onClick={() => addNotification('Your turn for General Checkup is approaching!', 'update')}
            >
              + Test Notification
            </button>

            {/* History Navigation Button */}
            <button
              className={styles.testBtn}
              onClick={() => navigate('/history')}
            >
              My History
            </button>
            
            {/* 3. Join Queue Button */}
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
          {/* 3. Left Column: The patient's active status */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Current Status</h2>
            
            {/* MODIFIED: Made this card clickable based on your UX idea! */}
            <div 
              className={styles.serviceCard} 
              onClick={() => navigate('/status')}
              style={{ cursor: 'pointer', transition: 'background 0.2s' }}
              title="Click to view live queue details"
            >
                <div className={styles.serviceTop}>
                  <span className={styles.serviceName}>{mockActiveQueue.service}</span>
                  <span className={`${styles.statusBadge} ${styles.waiting}`}>{mockActiveQueue.status}</span>
                </div>
                <div className={styles.serviceMeta}>
                  <span>Position: #{mockActiveQueue.position}</span>
                  <span>Est. Wait: {mockActiveQueue.estWait}</span>
                </div>
            </div>
          </section>

          {/* 4. Right Column: List of all clinic services */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Available Services</h2>
            <div className={styles.serviceList}>
              {mockServices.map((s) => (
                <div key={s.name} className={styles.serviceCard}>
                  <div className={styles.serviceTop}>
                    <span className={styles.serviceName}>{s.name}</span>
                    <span className={`${styles.statusBadge} ${s.open ? styles.open : styles.closed}`}>
                      {s.open ? 'Open' : 'Closed'}
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