import { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import styles from './ReportPage.module.css';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);

const API = 'http://localhost:3001';

function getOutcomeClass(status) {
  if (status === 'served') return styles.served;
  if (status === 'canceled') return styles.cancelled;
  return styles.leftQueue;
}

function formatOutcome(status) {
  if (status === 'served') return 'Served';
  if (status === 'canceled') return 'Cancelled';
  if (status === 'waiting') return 'Waiting';
  return status;
}

function downloadPDF(services, history, stats) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235);
  doc.text('Clinic Report', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });

  let y = 38;

  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Overall Statistics', 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Total Services: ${services.length}`, 14, y); y += 5;
  doc.text(`Total Users Served: ${stats?.totalServed || 0}`, 14, y); y += 5;
  doc.text(`Total Queue Entries: ${stats?.totalEntries || 0}`, 14, y); y += 5;
  const avgDur = services.length > 0 ? Math.round(services.reduce((s, sv) => s + sv.duration, 0) / services.length) : 0;
  doc.text(`Average Service Duration: ${avgDur} min`, 14, y); y += 10;

  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Service Summary', 14, y);
  y += 2;

  const byService = stats?.byService || [];
  doc.autoTable({
    startY: y,
    head: [['Service', 'Duration', 'Priority', 'Entries', 'Served', 'Waiting']],
    body: byService.map(s => [
      s.name,
      `${s.duration} min`,
      s.priority,
      String(s.totalEntries || 0),
      String(s.servedCount || 0),
      String(s.waitingCount || 0),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text('Queue Participation History', 14, y);
  y += 2;

  doc.autoTable({
    startY: y,
    head: [['User', 'Service', 'Status', 'Joined At']],
    body: history.map(h => [
      h.userName || h.user_id || '—',
      h.serviceName || '—',
      formatOutcome(h.status || 'waiting'),
      h.join_time ? new Date(h.join_time).toLocaleString() : '—',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  doc.save(`queuesmart_report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function ReportPage({ services, onBack, refreshQueues }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState('all');
  const [clearing, setClearing] = useState(false);

  const loadData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch(`${API}/reports/stats`).then(r => r.json()),
        fetch(`${API}/reports/history`).then(r => r.json()),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (historyRes.success) setHistory(historyRes.data || []);
    } catch {
      /* network error */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [services]);

  const clearReportData = async () => {
    if (!confirm('Are you sure you want to clear all report data? This cannot be undone.')) return;
    setClearing(true);
    try {
      const res = await fetch(`${API}/reports/data`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setStats(null);
        setHistory([]);
        await loadData();
        if (refreshQueues) await refreshQueues();
      }
    } catch {
      /* network error */
    } finally {
      setClearing(false);
    }
  };

  const filteredHistory = useMemo(() => {
    if (serviceFilter === 'all') return history;
    return history.filter(h => h.serviceId === Number(serviceFilter));
  }, [history, serviceFilter]);

  const totalServed = stats?.totalServed || 0;
  const totalEntries = stats?.totalEntries || 0;

  const avgDuration = services.length > 0
    ? Math.round(services.reduce((sum, s) => sum + s.duration, 0) / services.length)
    : 0;

  const byService = stats?.byService || [];
  const maxActivity = Math.max(1, ...byService.map(s => Number(s.totalEntries) || 0));

  return (
    <div className={styles.reportPage}>
      <Navbar role="admin" />
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Reports</h1>
            <p>Queue usage statistics and service activity.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.backBtn} onClick={onBack}>
              ← Back to Dashboard
            </button>
            <button
              className={styles.exportBtn}
              onClick={() => downloadPDF(services, filteredHistory, stats)}
            >
              ↓ Download PDF
            </button>
            <button
              className={styles.clearBtn}
              onClick={clearReportData}
              disabled={clearing}
            >
              {clearing ? 'Clearing…' : '✕ Clear Report Data'}
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{services.length}</div>
            <div className={styles.statLabel}>Total Services</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalServed}</div>
            <div className={styles.statLabel}>Users Served</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{avgDuration} min</div>
            <div className={styles.statLabel}>Avg Duration</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalEntries}</div>
            <div className={styles.statLabel}>Queue Entries</div>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Service Activity Breakdown</h2>
          </div>
          <div className={styles.serviceBreakdown}>
            {byService.map(s => {
              const count = Number(s.totalEntries) || 0;
              const pct = (count / maxActivity) * 100;
              return (
                <div key={s.id} className={styles.serviceRow}>
                  <div className={styles.serviceInfo}>
                    <div className={styles.serviceRowName}>{s.name}</div>
                    <div className={styles.serviceRowMeta}>
                      {s.duration} min · {s.priority} priority · {Number(s.servedCount) || 0} served
                    </div>
                  </div>
                  <div className={styles.serviceBar}>
                    <div className={styles.serviceBarFill} style={{ width: `${pct}%` }} />
                  </div>
                  <div className={styles.serviceCount}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Queue Participation History</h2>
            <div className={styles.filterRow}>
              <select
                className={styles.filterSelect}
                value={serviceFilter}
                onChange={e => setServiceFilter(e.target.value)}
              >
                <option value="all">All Services</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className={styles.emptyMsg}>Loading report data…</p>
          ) : filteredHistory.length === 0 ? (
            <p className={styles.emptyMsg}>No queue history data available.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((h, i) => (
                  <tr key={i}>
                    <td>{h.userName || h.user_id || '—'}</td>
                    <td>{h.serviceName || '—'}</td>
                    <td>
                      <span className={`${styles.outcomeBadge} ${getOutcomeClass(h.status)}`}>
                        {formatOutcome(h.status || 'waiting')}
                      </span>
                    </td>
                    <td>{h.join_time ? new Date(h.join_time).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
