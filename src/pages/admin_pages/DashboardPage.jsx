import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNotifications } from '../../context/NotificationContext';
import QueueManagementPage from './QueueManagementPage';
import PATIENT_NAMES from './Patient_Names_Mock_Data';
import { viewAllQueues, joinQueue } from '../../backend/api';
import { syncServices } from '../../backend/data/store.js';
import styles from './DashboardPage.module.css';

const API = 'http://localhost:3001';
const emptyForm = { name: '', description: '', duration: '', priority: 'low' };

export default function DashboardPage() {
  const { addNotification } = useNotifications();
  const [services, setServices] = useState([]);
  const [queues, setQueues] = useState(() => {
    const result = viewAllQueues();
    const data = result.data;
    if (data[3]) data[3].open = false;
    return data;
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findResult, setFindResult] = useState(null);
  const [findSuggestions, setFindSuggestions] = useState([]);
  const [view, setView] = useState('dashboard');
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API}/services`);
      const json = await res.json();
      if (json.success) {
        setServices(json.data);
        syncServices(json.data);
        setQueues(prev => {
          const next = { ...prev };
          for (const s of json.data) {
            if (!next[s.id]) {
              next[s.id] = { open: true, patients: [] };
            }
          }
          return next;
        });
      }
    } catch {
      /* network error */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(); }, []);

  const refreshQueues = () => {
    setQueues(prev => {
      const result = viewAllQueues();
      if (!result.success) return prev;
      const next = {};
      for (const key of Object.keys(result.data)) {
        next[key] = {
          ...result.data[key],
          open: prev[key]?.open !== undefined ? prev[key].open : true,
        };
      }
      return next;
    });
  };

  const toggleQueue = (serviceId) => {
    setQueues(prev => ({
      ...prev,
      [serviceId]: { ...prev[serviceId], open: !prev[serviceId].open },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      duration: form.duration ? Number(form.duration) : undefined,
      priority: form.priority,
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`${API}/services/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const result = await res.json();
      if (!result.success) {
        const errs = {};
        result.errors.forEach(err => {
          if (err.includes('name')) errs.name = err;
          else if (err.includes('description')) errs.description = err;
          else if (err.includes('duration')) errs.duration = err;
          else if (err.includes('priority')) errs.priority = err;
          else errs.general = err;
        });
        setErrors(errs);
        return;
      }

      await fetchServices();
      refreshQueues();
      setForm(emptyForm);
      setErrors({});
      setShowForm(false);
      setEditingId(null);
    } catch {
      setErrors({ general: 'Network error. Please try again.' });
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setErrors({});
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (service) => {
    setForm({
      name: service.name,
      description: service.description,
      duration: String(service.duration),
      priority: service.priority,
    });
    setEditingId(service.id);
    setErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API}/services/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        await fetchServices();
        refreshQueues();
      }
    } catch {
      /* network error */
    }
  };

  const handleFindInput = async (value) => {
    setFindQuery(value);
    setFindResult(null);
    if (value.trim().length === 0) {
      setFindSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`${API}/services/search?q=${encodeURIComponent(value)}`);
      const json = await res.json();
      setFindSuggestions(json.success ? json.data : []);
    } catch {
      setFindSuggestions([]);
    }
  };

  const handleFind = async () => {
    try {
      const res = await fetch(`${API}/services/search?q=${encodeURIComponent(findQuery)}`);
      const result = await res.json();
      if (!result.success || result.data.length === 0) {
        setFindResult('not_found');
        return;
      }
      const exact = result.data.find(s => s.name.toLowerCase() === findQuery.trim().toLowerCase());
      setFindResult(exact || 'not_found');
    } catch {
      setFindResult('not_found');
    }
  };

  const closeFind = () => {
    setShowFind(false);
    setFindQuery('');
    setFindResult(null);
    setFindSuggestions([]);
  };

  const simulateNewQueue = () => {
    const openServices = services.filter(s => queues[s.id]?.open);
    if (openServices.length === 0) {
      addNotification('No open queues available.', 'update');
      return;
    }
    const randomService = openServices[Math.floor(Math.random() * openServices.length)];
    const randomName = PATIENT_NAMES[Math.floor(Math.random() * PATIENT_NAMES.length)];

    const result = joinQueue({
      userId: `sim-${Date.now()}`,
      userName: randomName,
      serviceId: randomService.id,
    });

    if (result.success) {
      refreshQueues();
      addNotification(`Queue update: ${randomName} joined ${randomService.name}.`, 'update');
    }
  };

  if (view === 'queue') {
    return (
      <QueueManagementPage
        services={services}
        queues={queues}
        setQueues={setQueues}
        refreshQueues={refreshQueues}
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
              <button className={styles.addBtn} onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}>
                + Add Service
              </button>
              <button className={styles.addBtn} onClick={() => setShowFind(true)}>
                Find Service
              </button>
            </div>
            {loading ? (
              <p className={styles.emptyMsg}>Loading services…</p>
            ) : (
              <div className={styles.serviceList}>
                {services.map((s) => {
                  const q = queues[s.id];
                  return (
                    <div key={s.id} className={styles.serviceCard}>
                      <div className={styles.serviceTop}>
                        <span className={styles.serviceName}>{s.name}</span>
                        {q && (
                          <span className={`${styles.statusBadge} ${q.open ? styles.open : styles.closed}`}>
                            {q.open ? 'Queue Open' : 'Queue Closed'}
                          </span>
                        )}
                      </div>
                      <div className={styles.serviceMeta}>
                        <span>{q ? q.patients.length : 0} in queue</span>
                        <span>Avg wait: {q?.open ? s.avgWait : '—'}</span>
                        <span>Priority: {s.priority}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        {q && (
                          <button
                            className={`${styles.toggleBtn} ${q.open ? styles.closeBtn : styles.openBtn}`}
                            onClick={() => toggleQueue(s.id)}
                          >
                            {q.open ? 'Close Queue' : 'Open Queue'}
                          </button>
                        )}
                        <button className={styles.toggleBtn} onClick={() => handleEdit(s)} style={{ color: 'var(--blue-600)' }}>
                          Edit
                        </button>
                        <button className={`${styles.toggleBtn} ${styles.closeBtn}`} onClick={() => handleDelete(s.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
            <h2 className={styles.modalTitle}>{editingId ? 'Edit Service' : 'Add New Service'}</h2>
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
              {errors.general && <span className={styles.error}>{errors.general}</span>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>{editingId ? 'Save Changes' : 'Add Service'}</button>
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
                onChange={e => handleFindInput(e.target.value)}
              />
              {findSuggestions.length > 0 && !findResult && (
                <ul className={styles.suggestions}>
                  {findSuggestions.map(s => (
                    <li key={s.id} className={styles.suggestionItem} onClick={() => { setFindResult(s); setFindQuery(s.name); setFindSuggestions([]); }}>
                      {s.name}
                    </li>
                  ))}
                </ul>
              )}
              {findQuery.trim().length > 0 && findSuggestions.length === 0 && !findResult && (
                <p className={styles.findError}>Service not found, please check your input.</p>
              )}
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
