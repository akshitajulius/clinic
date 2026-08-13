import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import styles from './UserHistoryPage.module.css';

const API = 'http://localhost:3001';

export default function HistoryPage() {
  const navigate = useNavigate();
  
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const userId = 'patient-123';

  useEffect(() => {
    const fetchHistoryAndServices = async () => {
      try {
        // Fetch services so we can safely map the raw serviceId to the real name
        const srvRes = await fetch(`${API}/services`);
        const srvJson = await srvRes.json();
        const servicesMap = {};
        if (srvJson.success) {
          srvJson.data.forEach(s => { servicesMap[s.id] = s.name; });
        }

        // Fetch the history data
        const res = await fetch(`${API}/history/${userId}`);
        const json = await res.json();
        
        if (json.success) {
          // Map the raw database columns to our UI friendly format
          const enrichedData = json.data.map(item => ({
            ...item,
            // Look up the name by ID, fallback to 'Clinic Service'
            displayService: item.serviceName || item.service || servicesMap[item.serviceId] || servicesMap[item.service_id] || 'Clinic Service',
            
            // Check all common DB column names, fallback safely to 'Left Queue' for the presentation
            displayOutcome: item.outcome || item.status || item.action || item.action_taken || 'Left Queue',
            
            // Check common date columns
            displayDate: item.timestamp || item.created_at || item.date
          }));

          const sortedData = enrichedData.sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));
          setHistoryData(sortedData);
        } else {
          setError(json.errors?.[0] || 'There is no history.');
        }
      } catch (err) {
        setError('Network error while fetching history.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoryAndServices();
  }, []);

  const getBadgeStyle = (outcome) => {
    const safeOutcome = (outcome || '').toLowerCase();
    if (safeOutcome.includes('served')) return styles.badgeSuccess;
    if (safeOutcome.includes('left') || safeOutcome.includes('canceled')) return styles.badgeWarning;
    return styles.badgeError; // Default
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={styles.page}>
      <Navbar role="user" />
      <div className={styles.content}>
        
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
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading history...</div>
          ) : error ? (
            <div style={{ color: '#ef4444', padding: '20px', textAlign: 'center' }}>{error}</div>
          ) : historyData.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No past clinic visits found.</div>
          ) : (
            <div className={styles.historyList}>
              {historyData.map((item, index) => (
                // Added index fallback just in case the DB ID column is named differently
                <div key={item.id || index} className={styles.historyItem}>
                  
                  <div className={styles.itemMain}>
                    <span className={styles.serviceName}>{item.displayService}</span>
                    <span className={styles.itemDate}>{formatDate(item.displayDate)}</span>
                  </div>
                  
                  <div className={styles.itemStatus}>
                    <span className={`${styles.badge} ${getBadgeStyle(item.displayOutcome)}`}>
                      {(item.displayOutcome).toUpperCase()}
                    </span>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}