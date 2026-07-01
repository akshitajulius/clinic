import Navbar from '../components/Navbar';
import { useNotifications } from '../context/NotificationContext';
import styles from './DashboardPage.module.css';

const mockQueue = [
  { id: 1, name: 'Sarah M.', service: 'General Checkup', position: 1, wait: '~5 min', status: 'Next up' },
  { id: 2, name: 'James T.', service: 'General Checkup', position: 2, wait: '~18 min', status: 'Waiting' },
  { id: 3, name: 'Priya K.', service: 'General Checkup', position: 3, wait: '~30 min', status: 'Waiting' },
];

const mockServices = [
  { name: 'General Checkup', open: true, queueLength: 3, avgWait: '18 min' },
  { name: 'Vaccination', open: true, queueLength: 1, avgWait: '5 min' },
  { name: 'Lab Draw', open: false, queueLength: 0, avgWait: '—' },
];

export default function DashboardPage() {
  const { addNotification } = useNotifications();

  return (
    <div className={styles.page}>
      <Navbar role="admin" />
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Admin dashboard</h1>
            <p className={styles.sub}>Overview of active services and queues.</p>
          </div>
          <button
            className={styles.testBtn}
            onClick={() => addNotification('Queue update: Patient #4 joined General Checkup.', 'update')}
          >
            + Simulate notification
          </button>
        </div>

        <div className={styles.grid}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Services</h2>
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
                    <span>{s.queueLength} in queue</span>
                    <span>Avg wait: {s.avgWait}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>General Checkup — live queue</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Patient</th>
                  <th>Est. wait</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockQueue.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.pos}>{p.position}</td>
                    <td>{p.name}</td>
                    <td>{p.wait}</td>
                    <td>
                      <span className={`${styles.qBadge} ${p.position === 1 ? styles.nextUp : styles.waiting}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}
