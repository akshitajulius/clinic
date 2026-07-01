import NotificationBell from './NotificationBell';
import styles from './Navbar.module.css';

export default function Navbar({ role = 'patient' }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#2563EB"/>
            <path d="M8 22V14l8-6 8 6v8H20v-5h-4v5H8z" fill="white" opacity="0.9"/>
            <circle cx="16" cy="13" r="2" fill="white"/>
          </svg>
          <span className={styles.brandName}>QueueSmart</span>
        </div>
        <div className={styles.right}>
          <span className={styles.roleTag}>
            {role === 'admin' ? 'Clinic staff' : 'Patient'}
          </span>
          <NotificationBell />
          <div className={styles.avatar} aria-label="Account">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
}
