import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useNotifications } from '../../context/NotificationContext';
import QueueManagementPage from './QueueManagementPage';
import PATIENT_NAMES from './Patient_Names_Mock_Data';
import styles from './DashboardPage.module.css';

const initialServices = [
  { id: 1, name: 'General Checkup', description: 'Routine health assessment', duration: 20, priority: 'high', avgWait: '18 min' },
  { id: 2, name: 'Vaccination', description: 'Immunization services', duration: 10, priority: 'medium', avgWait: '5 min' },
  { id: 3, name: 'Lab Draw', description: 'Blood work collection', duration: 15, priority: 'medium', avgWait: '—' },
];

const initialQueue = {
  1: {
    open: true,
    patients: [
      { id: 1, name: 'Sarah M.', position: 1, wait: '~5 min', status: 'Next up', joinedAt: '10:02 AM' },
      { id: 2, name: 'James T.', position: 2, wait: '~18 min', status: 'Waiting', joinedAt: '10:08 AM' },
      { id: 3, name: 'Priya K.', position: 3, wait: '~30 min', status: 'Waiting', joinedAt: '10:14 AM' },
    ],
  },
  2: {
    open: true,
    patients: [
      { id: 4, name: 'Michael B.', position: 1, wait: '~3 min', status: 'Next up', joinedAt: '10:30 AM' },
    ],
  },
  3: {
    open: false,
    patients: [],
  },
};

const emptyForm = { name: '', description: '', duration: '', priority: 'low' };

function formatTime(date) {
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export default function DashboardPage() {
  const { addNotification } = useNotifications();
  const [services, setServices] = useState(initialServices);
  const [queues, setQueues] = useState(initialQueue);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findResult, setFindResult] = useState(null);
  const [view, setView] = useState('dashboard');

  const toggleQueue = (serviceId) => {
    setQueues(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], open: !prev[serviceId].open },
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Service name is required.';
    else if (form.name.length > 100) errs.name = 'Max 100 characters.';
    if (!form.description.trim()) errs.description = 'Description is required.';
    if (!form.duration || Number(form.duration) <= 0) errs.duration = 'Valid duration is required.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const newId = Date.now();
    setServices(prev => [...prev, {
      id: newId,
      name: form.name.trim(),
      description: form.description.trim(),
      duration: Number(form.duration),
      priority: form.priority,
      avgWait: `${Number(form.duration)} min`,
    }]);
    setQueues(prev => ({ ...prev, [newId]: { open: true, patients: [] } }));
    setForm(emptyForm);
    setErrors({});
    setShowForm(false);
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setErrors({});
    setShowForm(false);
  };

  const handleFind = () => {
    const match = services.find(s => s.name.toLowerCase() === findQuery.trim().toLowerCase());
    setFindResult(match || 'not_found');
  };

  const closeFind = () => {
    setShowFind(false);
    setFindQuery('');
    setFindResult(null);
  };

  const simulateNewQueue = () => {
    const openServices = services.filter(s => queues[s.id]?.open);
    if (openServices.length === 0) {
      addNotification('No open queues available.', 'update');
      return;
    }
    const randomService = openServices[Math.floor(Math.random() * openServices.length)];
    const randomName = PATIENT_NAMES[Math.floor(Math.random() * PATIENT_NAMES.length)];
    const now = new Date();
    const currentPatients = queues[randomService.id]?.patients || [];
    const position = currentPatients.length + 1;
    const estWait = `~${position * randomService.duration} min`;

    const newPatient = {
      id: Date.now(),
      name: randomName,
      position,
      wait: estWait,
      status: position === 1 ? 'Next up' : 'Waiting',
      joinedAt: formatTime(now),
    };

    setQueues(prev => ({
      ...prev,
      [randomService.id]: {
        ...prev[randomService.id],
        patients: [...prev[randomService.id].patients, newPatient],
      },
    }));

    addNotification(`Queue update: ${randomName} joined ${randomService.name}.`, 'update');
  };

  if (view === 'queue') {
    return (
      <QueueManagementPage
        services={services}
        queues={queues}
        setQueues={setQueues}
        onBack={() => setView('dashboard')}
      />
    );
  }

  return (
    <div className={styles.page}>
      <Navbar role="admin" />
      <div className={styles.content}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.heading}>Admin dashboard</h1>
            <p className={styles.sub}>Overview of active services and queues.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={styles.testBtn}
              onClick={() => setView('queue')}
            >
              Manage Queues
            </button>
            <button
              className={styles.testBtn}
              onClick={simulateNewQueue}
            >
              + Simulate New Queue
            </button>
            <button
              className={styles.testBtn}
              onClick={() => addNotification('Queue update: Patient #4 joined General Checkup.', 'update')}
            >
              + Simulate notification
            </button>
          </div>
        </div>

        <div className={styles.grid}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Services</h2>
            <div className={styles.btnRow}>
              <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                + Add Service
              </button>
              <button className={styles.addBtn} onClick={() => setShowFind(true)}>
                Find Service
              </button>
            </div>
            <div className={styles.serviceList}>
              {services.map((s) => {
                const q = queues[s.id];
                return (
                  <div key={s.id} className={styles.serviceCard}>
                    <div className={styles.serviceTop}>
                      <span className={styles.serviceName}>{s.name}</span>
                      <span className={`${styles.statusBadge} ${q.open ? styles.open : styles.closed}`}>
                        {q.open ? 'Queue Open' : 'Queue Closed'}
                      </span>
                    </div>
                    <div className={styles.serviceMeta}>
                      <span>{q.patients.length} in queue</span>
                      <span>Avg wait: {q.open ? s.avgWait : '—'}</span>
                    </div>
                    <button
                      className={`${styles.toggleBtn} ${q.open ? styles.closeBtn : styles.openBtn}`}
                      onClick={() => toggleQueue(s.id)}
                    >
                      {q.open ? 'Close Queue' : 'Open Queue'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Live queue</h2>
            {Object.values(queues).every(q => q.patients.length === 0) ? (
              <p className={styles.emptyMsg}>No patients in queue.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Est. wait</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) =>
                    queues[s.id]?.patients.map((p, idx) => (
                      <tr key={p.id}>
                        <td className={styles.pos}>{idx + 1}</td>
                        <td>{p.name}</td>
                        <td>{s.name}</td>
                        <td>~{(idx + 1) * s.duration} min</td>
                        <td>
                          <span className={`${styles.qBadge} ${idx === 0 ? styles.nextUp : styles.waiting}`}>
                            {idx === 0 ? 'Next up' : 'Waiting'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>

      {showForm && (
        <div className={styles.overlay} onClick={handleCancel}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Add New Service</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="service-name">Service Name *</label>
                <input
                  id="service-name"
                  type="text"
                  maxLength={100}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                {errors.name && <span className={styles.error}>{errors.name}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="service-desc">Description *</label>
                <textarea
                  id="service-desc"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
                {errors.description && <span className={styles.error}>{errors.description}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="service-duration">Expected Duration (minutes) *</label>
                <input
                  id="service-duration"
                  type="number"
                  min="1"
                  value={form.duration}
                  onChange={e => setForm({ ...form, duration: e.target.value })}
                />
                {errors.duration && <span className={styles.error}>{errors.duration}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="service-priority">Priority Level</label>
                <select
                  id="service-priority"
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Add Service</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFind && (
        <div className={styles.overlay} onClick={closeFind}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Find Service</h2>
            <div className={styles.field}>
              <label htmlFor="find-service">Service Name</label>
              <input
                id="find-service"
                type="text"
                placeholder="Enter service name…"
                value={findQuery}
                onChange={e => { setFindQuery(e.target.value); setFindResult(null); }}
              />
              {findQuery.trim().length > 0 && !findResult && (() => {
                const suggestions = services.filter(s =>
                  s.name.toLowerCase().includes(findQuery.trim().toLowerCase())
                );
                return suggestions.length > 0 ? (
                  <ul className={styles.suggestions}>
                    {suggestions.map(s => (
                      <li key={s.id} className={styles.suggestionItem} onClick={() => { setFindResult(s); setFindQuery(s.name); }}>
                        {s.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.findError}>Service not found, please check your input.</p>
                );
              })()}
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={closeFind}>Cancel</button>
              <button type="button" className={styles.submitBtn} onClick={handleFind}>Search</button>
            </div>
            {findResult === 'not_found' && (
              <p className={styles.findError}>Service not found, please check your input.</p>
            )}
            {findResult && findResult !== 'not_found' && (
              <div className={styles.findResult}>
                <div className={styles.serviceCard}>
                  <div className={styles.serviceTop}>
                    <span className={styles.serviceName}>{findResult.name}</span>
                    <span className={`${styles.statusBadge} ${queues[findResult.id]?.open ? styles.open : styles.closed}`}>
                      {queues[findResult.id]?.open ? 'Queue Open' : 'Queue Closed'}
                    </span>
                  </div>
                  <div className={styles.serviceMeta}>
                    <span>{queues[findResult.id]?.patients.length || 0} in queue</span>
                    <span>Avg wait: {findResult.avgWait}</span>
                  </div>
                  <button
                    className={`${styles.toggleBtn} ${queues[findResult.id]?.open ? styles.closeBtn : styles.openBtn}`}
                    onClick={() => toggleQueue(findResult.id)}
                  >
                    {queues[findResult.id]?.open ? 'Close Queue' : 'Open Queue'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
