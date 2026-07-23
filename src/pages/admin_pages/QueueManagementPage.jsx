import { useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import styles from './QueueManagementPage.module.css';

export default function QueueManagementPage({ services, queues, setQueues, onBack }) {
  const [selectedService, setSelectedService] = useState('all');
  const [servedToast, setServedToast] = useState(null);

  const filteredServices = useMemo(() => {
    if (selectedService === 'all') return services;
    return services.filter(s => s.id === Number(selectedService));
  }, [selectedService, services]);

  const totalInQueue = useMemo(() => {
    return filteredServices.reduce((sum, s) => sum + (queues[s.id]?.patients.length || 0), 0);
  }, [filteredServices, queues]);

  const nextUpCount = useMemo(() => {
    return filteredServices.filter(s => (queues[s.id]?.patients.length || 0) > 0).length;
  }, [filteredServices, queues]);

  const movePatient = (serviceId, fromIndex, toIndex) => {
    setQueues(prev => {
      const patients = [...prev[serviceId].patients];
      const [moved] = patients.splice(fromIndex, 1);
      patients.splice(toIndex, 0, moved);
      return { ...prev, [serviceId]: { ...prev[serviceId], patients } };
    });
  };

  const removePatient = (serviceId, patientIndex) => {
    setQueues(prev => {
      const patients = prev[serviceId].patients.filter((_, i) => i !== patientIndex);
      return { ...prev, [serviceId]: { ...prev[serviceId], patients } };
    });
  };

  const serveNext = (serviceId) => {
    const q = queues[serviceId];
    if (!q || q.patients.length === 0) return;
    const served = q.patients[0];
    const serviceName = services.find(s => s.id === serviceId)?.name;

    setQueues(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], patients: prev[serviceId].patients.slice(1) },
    }));

    setServedToast(`✓ Now serving ${served.name} — ${serviceName}`);
    setTimeout(() => setServedToast(null), 3000);
  };

  return (
    <div className={styles.page}>
      <Navbar role="admin" />
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Queue Management</h1>
            <p className={styles.sub}>View, reorder, and manage patient queues by service.</p>
          </div>
          {onBack && (
            <button className={styles.backBtn} onClick={onBack}>
              ← Dashboard
            </button>
          )}
        </div>

        <div className={styles.filterBar}>
          <span className={styles.filterLabel}>Filter by Service</span>
          <select
            id="queue-service-filter"
            className={styles.filterSelect}
            value={selectedService}
            onChange={e => setSelectedService(e.target.value)}
          >
            <option value="all">All Services</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({queues[s.id]?.patients.length || 0})
              </option>
            ))}
          </select>
          <div className={styles.filterStats}>
            <span className={`${styles.statChip} ${styles.statChipBlue}`}>
              {totalInQueue} in queue
            </span>
            <span className={`${styles.statChip} ${styles.statChipAmber}`}>
              {nextUpCount} next up
            </span>
          </div>
        </div>

        {filteredServices.map(service => {
          const q = queues[service.id];
          if (!q) return null;
          return (
            <div key={service.id} className={styles.queueSection} style={{ marginBottom: 20 }}>
              <div className={styles.queueHeader}>
                <div className={styles.queueTitle}>
                  <span className={`${styles.queueTitleDot} ${!q.open ? styles.queueTitleDotClosed : ''}`} />
                  {service.name}
                  <span className={styles.serviceName}>
                    — {q.patients.length} patient{q.patients.length !== 1 ? 's' : ''}
                    {!q.open && ' (Closed)'}
                  </span>
                </div>
                <div className={styles.headerActions}>
                  <button
                    className={styles.serveBtn}
                    disabled={q.patients.length === 0}
                    onClick={() => serveNext(service.id)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    Serve Next
                  </button>
                </div>
              </div>

              {q.patients.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <p className={styles.emptyTitle}>No patients waiting</p>
                  <p className={styles.emptyDesc}>The queue for {service.name} is currently empty.</p>
                </div>
              ) : (
                <div className={styles.queueList}>
                  {q.patients.map((patient, idx) => (
                    <div key={patient.id} className={styles.queueItem}>
                      <div className={`${styles.positionBadge} ${idx === 0 ? styles.posFirst : styles.posOther}`}>
                        {idx + 1}
                      </div>
                      <div className={styles.patientInfo}>
                        <div className={styles.patientName}>{patient.name}</div>
                        <div className={styles.patientMeta}>
                          Joined {patient.joinedAt} · Est. ~{(idx + 1) * service.duration} min
                        </div>
                      </div>
                      <span className={`${styles.statusBadge} ${idx === 0 ? styles.statusNext : styles.statusWaiting}`}>
                        {idx === 0 ? 'Next Up' : 'Waiting'}
                      </span>
                      <div className={styles.itemActions}>
                        <button
                          className={styles.moveBtn}
                          disabled={idx === 0}
                          onClick={() => movePatient(service.id, idx, idx - 1)}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          className={styles.moveBtn}
                          disabled={idx === q.patients.length - 1}
                          onClick={() => movePatient(service.id, idx, idx + 1)}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          className={styles.removeBtn}
                          onClick={() => removePatient(service.id, idx)}
                          title="Remove from queue"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {filteredServices.length === 0 && (
          <div className={styles.queueSection}>
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <p className={styles.emptyTitle}>No service selected</p>
              <p className={styles.emptyDesc}>Choose a service from the filter above.</p>
            </div>
          </div>
        )}
      </div>

      {servedToast && (
        <div className={styles.servedToast}>{servedToast}</div>
      )}
    </div>
  );
}
