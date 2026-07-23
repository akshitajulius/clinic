import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './UserHistoryPage.module.css';

// Mock data: Simulating the user's past visits for now
const mockHistory = [
  { id: 1, date: 'July 1, 2026', service: 'General Checkup', outcome: 'Served' },
  { id: 2, date: 'June 21, 2026', service: 'Lab Draw', outcome: 'Left Queue' },
  { id: 3, date: 'April 10, 2026', service: 'Vaccination', outcome: 'Served' },
  { id: 4, date: 'February 14, 2026', service: 'General Checkup', outcome: 'Canceled by Clinic' },
];

export default function HistoryPage() {
  const navigate = useNavigate();

  // Helper function to assign a color based on the outcome
  const getBadgeStyle = (outcome) => {
    if (outcome === 'Served') return styles.badgeSuccess;
    if (outcome === 'Left Queue') return styles.badgeWarning;
    return styles.badgeError;
  };

  return (
    <div className={styles.page}>
      <Navbar role="user" />
      <div className={styles.content}>
        
        {/* Adjusted the header to use flexbox so the button sits nicely on the right */}
        <div className={styles.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.heading}>My History</h1>
            <p className={styles.sub}>A record of your past clinic visits and queue outcomes.</p>
          </div>
          
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ 
              background: 'white', 
              color: '#2563eb', 
              border: '1px solid #2563eb', 
              padding: '10px 16px', 
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '600' 
            }}
          >
            Return to Dashboard
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.historyList}>
            {mockHistory.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                
                <div className={styles.itemMain}>
                  <span className={styles.serviceName}>{item.service}</span>
                  <span className={styles.itemDate}>{item.date}</span>
                </div>
                
                <div className={styles.itemStatus}>
                  <span className={`${styles.badge} ${getBadgeStyle(item.outcome)}`}>
                    {item.outcome}
                  </span>
                </div>
                
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}