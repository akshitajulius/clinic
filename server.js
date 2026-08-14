import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Auth
import {
  registerUser,
  loginUser,
  requireAdmin
} from './src/backend/modules/auth.js';

import {
  generateUserParticipationReport,
  generateServiceActivityReport,
  generateQueueStatisticsReport,
  generatePDFReport
} from './src/backend/modules/reports.js';

// Services
import {
  createService,
  updateService,
  listServices,
  getServiceById,
  deleteService,
  findServiceByName,
} from './src/backend/modules/services.js';

// Queue
import {
  joinQueue,
  leaveQueue,
  viewQueue,
  serveNext,
  viewAllQueues,
  getQueuePosition,
  getAlternativeServiceRecommendation
} from './src/backend/modules/queue.js';

// Wait-time
import {
  estimateWaitTime,
  estimateWaitTimeForQueue,
} from './src/backend/modules/waitTime.js';

// Notifications
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  notifyQueueJoined,
  notifyAlmostReady,
} from './src/backend/modules/notifications.js';

// History
import {
  addHistoryEntry,
  getHistoryForUser,
  getHistoryForService,
  getUsageSummary,
} from './src/backend/modules/history.js';

// DB init
import { initServiceTable } from './src/backend/data/serviceDb.js';
import { initNotificationTable } from './src/backend/data/notificationDb.js';
import { initQueueTables } from './src/backend/data/queueData.js';
import { initUserTables } from './src/backend/data/userDb.js';

const app = express();
app.use(cors());
app.use(express.json());

//  Health check 
app.get('/', (req, res) => {
  res.json({ message: 'QueueSmart API is running.' });
});

//  Auth 
app.post('/auth/register', async (req, res) => {

  const { email, password } = req.body;

  try {

    const user =
      await registerUser(
        email,
        password
      );

    res.status(201).json({
      success: true,
      data: user
    });

  } catch (err) {

    res.status(400).json({
      success: false,
      errors: [err.message]
    });

  }

});

app.post('/auth/login', async (req, res) => {

  const { email, password } = req.body;

  try {

    const user =
      await loginUser(
        email,
        password
      );

    res.json({
      success: true,
      data: user
    });

  } catch (err) {

    res.status(401).json({
      success: false,
      errors: [err.message]
    });

  }

});

// Services
app.get('/services', async (req, res) => {
  try {
    const result = await listServices();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

app.get('/services/search', async (req, res) => {
  try {
    const { q } = req.query;
    const result = await findServiceByName(q);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

app.get('/services/:id', async (req, res) => {
  try {
    const result = await getServiceById(Number(req.params.id));
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

app.post('/services', async (req, res) => {
  try {
    const result = await createService(req.body);
    if (!result.success) return res.status(400).json(result);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

app.put('/services/:id', async (req, res) => {
  try {
    const result = await updateService(Number(req.params.id), req.body);
    if (!result.success) return res.status(400).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

app.delete('/services/:id', async (req, res) => {
  try {
    const result = await deleteService(Number(req.params.id));
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

// Queue 
app.get('/queue', async (req, res) => {
  try {
    const result = await viewAllQueues();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: ['Failed to fetch all queues.'] });
  }
});

app.get('/queue/:serviceId', async (req, res) => {
  try {
    const result = await viewQueue(Number(req.params.serviceId));
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: ['Failed to fetch queue.'] });
  }
});

app.post('/queue/join', async (req, res) => {
  try {
    const result = await joinQueue(req.body);
    if (!result.success) return res.status(400).json(result);

    // Auto-notify the user they joined
    const { userId, serviceId } = req.body;
    const queueData = await viewQueue(serviceId);
    
    if (queueData.success) {
      const position = queueData.data.queue.find(e => e.userId === userId)?.position || 1;
      const serviceName = queueData.data.serviceName;
      notifyQueueJoined(userId, serviceName, position);

      // Notify if almost ready (position 1 or 2)
      if (position <= 2) {
        notifyAlmostReady(userId, serviceName);
      }
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: ['Internal server error while joining queue.'] });
  }
});

app.post('/queue/leave', async (req, res) => {
  try {
    const { queueId, entryId } = req.body; 
    const idToLeave = entryId || queueId;
    
    const result = await leaveQueue(idToLeave);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: ['Internal server error while leaving queue.'] });
  }
});

app.post('/queue/:serviceId/serve', async (req, res) => {
  try {
    const { role } = req.body;
    requireAdmin({ role });

    const result = await serveNext(Number(req.params.serviceId));

    if (!result.success) {
      return res.status(400).json(result);
    }

    await addHistoryEntry(
      result.data.userId,
      result.data.serviceId,
      'served'
    );

    res.json(result);
  } catch (err) {
    res.status(403).json({ success: false, errors: [err.message] });
  }
});

app.get('/queue/:serviceId/position/:userId', async (req, res) => {
  try {
    const result = await getQueuePosition(req.params.userId, Number(req.params.serviceId));
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, errors: ['Internal server error.'] });
  }
});

// Smart Feature Route
app.get('/smart-recommendation/:serviceId', async (req, res) => {
  try {
    const result = await getAlternativeServiceRecommendation(Number(req.params.serviceId));
    res.json(result || { success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, errors: ['Failed to fetch recommendation.'] });
  }
});

//Wait-time
app.get('/waittime/:serviceId/:userId', (req, res) => {
  const result = estimateWaitTime(req.params.userId, Number(req.params.serviceId));
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

app.get('/waittime/:serviceId', (req, res) => {
  const result = estimateWaitTimeForQueue(Number(req.params.serviceId));
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

//Notifications
app.get('/notifications/:userId', (req, res) => {
  const result = getNotificationsForUser(req.params.userId);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.put('/notifications/:id/read', (req, res) => {
  const result = markNotificationRead(Number(req.params.id));
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

app.put('/notifications/:userId/read-all', (req, res) => {
  const result = markAllNotificationsRead(req.params.userId);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

//History
app.get('/history/:userId', (req, res) => {
  const result = getHistoryForUser(req.params.userId);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.post('/history', (req, res) => {
  const { userId, serviceId, outcome } = req.body;
  const result = addHistoryEntry(userId, serviceId, outcome);
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

app.get('/history/service/:serviceId', (req, res) => {
  const result = getHistoryForService(Number(req.params.serviceId));
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.get('/history/summary', (req, res) => {
  const result = getUsageSummary();
  res.json(result);
});

// user report route
app.get('/reports/user/:userId', async (req, res) => {

  try {

    requireAdmin({
      role: req.query.role
    });

    const result =
      await generateUserParticipationReport(
        req.params.userId
      );

    res.json(result);

  } catch (err) {

    res.status(403).json({
      success: false,
      errors: [err.message]
    });

  }

});

// service activity report route
app.get('/reports/service/:serviceName', async (req, res) => {

  try {

    requireAdmin({
      role: req.query.role
    });

    const result =
      await generateServiceActivityReport(
        req.params.serviceName
      );

    res.json(result);

  } catch (err) {

    res.status(403).json({
      success: false,
      errors: [err.message]
    });

  }

});

// queue statistics route
app.get('/reports/statistics', async (req, res) => {

  try {

    requireAdmin({
      role: req.query.role
    });

    const result =
      await generateQueueStatisticsReport();

    res.json(result);

  } catch (err) {

    res.status(403).json({
      success: false,
      errors: [err.message]
    });

  }

});

// PDF Report Route
app.get('/reports/pdf', async (req, res) => {

  try {

    requireAdmin({
      role: req.query.role
    });

    const report =
      await generateQueueStatisticsReport();

    const path =
      await generatePDFReport(
        'Queue Statistics Report',
        report.data,
        './report.pdf'
      );

    res.json({
      success: true,
      file: path
    });

  } catch (err) {

    res.status(403).json({
      success: false,
      errors: [err.message]
    });

  }

});

// Reports - Stats & History (used by ReportPage UI)
import pool from './src/backend/data/db.js';

app.get('/reports/stats', async (req, res) => {
  try {
    const [served] = await pool.query(
      `SELECT COUNT(*) as count FROM queue_entries WHERE status = 'served'`
    );
    const [totalEntries] = await pool.query(
      `SELECT COUNT(*) as count FROM queue_entries`
    );
    const [byService] = await pool.query(`
      SELECT s.id, s.name, s.duration, s.priority,
        COUNT(qe.id) as totalEntries,
        SUM(CASE WHEN qe.status = 'served' THEN 1 ELSE 0 END) as servedCount,
        SUM(CASE WHEN qe.status = 'waiting' THEN 1 ELSE 0 END) as waitingCount
      FROM services s
      LEFT JOIN queues q ON q.service_id = s.id
      LEFT JOIN queue_entries qe ON qe.queue_id = q.id
      GROUP BY s.id
      ORDER BY s.id ASC
    `);
    res.json({
      success: true,
      data: {
        totalServed: served[0].count,
        totalEntries: totalEntries[0].count,
        byService,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

app.get('/reports/history', async (req, res) => {
  try {
    const serviceId = req.query.serviceId;
    let query = `
      SELECT qe.id, qe.user_id, COALESCE(NULLIF(qe.user_name, ''), qe.user_id) as userName,
        qe.status, qe.position, qe.join_time,
        s.name as serviceName, s.id as serviceId
      FROM queue_entries qe
      JOIN queues q ON qe.queue_id = q.id
      JOIN services s ON q.service_id = s.id
    `;
    const params = [];
    if (serviceId && serviceId !== 'all') {
      query += ' WHERE s.id = ?';
      params.push(Number(serviceId));
    }
    query += ' ORDER BY qe.join_time DESC';

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

app.delete('/reports/data', async (req, res) => {
  try {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE queue_entries');
    await pool.query('TRUNCATE TABLE queues');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

//Start server
const PORT = 3001;

async function startServer() {
  await initServiceTable();
  await initNotificationTable();
  await initQueueTables();
  await initUserTables(); 

  console.log('Database tables initialized.');

  app.listen(PORT, () => {
    console.log(`QueueSmart API running at http://localhost:${PORT}`);
  });
}

startServer();

export default app;