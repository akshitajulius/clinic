import express from 'express';
import cors from 'cors';

// Auth
import { registerUser, loginUser } from './src/backend/modules/auth.js';

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

const app = express();
app.use(cors());
app.use(express.json());

//  Health check 
app.get('/', (req, res) => {
  res.json({ message: 'QueueSmart API is running.' });
});

//  Auth 
app.post('/auth/register', (req, res) => {
  const { email, password } = req.body;
  try {
    const user = registerUser(email, password);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, errors: [err.message] });
  }
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  try {
    const user = loginUser(email, password);
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(401).json({ success: false, errors: [err.message] });
  }
});

// Services
app.get('/services', (req, res) => {
  const result = listServices();
  res.json(result);
});

app.get('/services/search', (req, res) => {
  const { q } = req.query;
  const result = findServiceByName(q);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.get('/services/:id', (req, res) => {
  const result = getServiceById(Number(req.params.id));
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

app.post('/services', (req, res) => {
  const result = createService(req.body);
  if (!result.success) return res.status(400).json(result);
  res.status(201).json(result);
});

app.put('/services/:id', (req, res) => {
  const result = updateService(Number(req.params.id), req.body);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.delete('/services/:id', (req, res) => {
  const result = deleteService(Number(req.params.id));
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

// Queue 
app.get('/queue', (req, res) => {
  const result = viewAllQueues();
  res.json(result);
});

app.get('/queue/:serviceId', (req, res) => {
  const result = viewQueue(Number(req.params.serviceId));
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

app.post('/queue/join', (req, res) => {
  const result = joinQueue(req.body);
  if (!result.success) return res.status(400).json(result);

  //Auto-notify the user they joined
  const { userId, serviceId } = req.body;
  const queueData = viewQueue(serviceId);
  if (queueData.success) {
    const position = queueData.data.queue.find(e => e.userId === userId)?.position || 1;
    const serviceName = queueData.data.serviceName;
    notifyQueueJoined(userId, serviceName, position);

    //Notify if almost ready (position 1 or 2)
    if (position <= 2) {
      notifyAlmostReady(userId, serviceName);
    }
  }

  res.status(201).json(result);
});

app.post('/queue/leave', (req, res) => {
  const { queueId } = req.body;
  const result = leaveQueue(queueId);
  if (!result.success) return res.status(404).json(result);
  res.json(result);
});

app.post('/queue/:serviceId/serve', (req, res) => {
  const result = serveNext(Number(req.params.serviceId));
  if (!result.success) return res.status(400).json(result);

  //Add to history
  addHistoryEntry(result.data.userId, result.data.serviceId, 'served');

  res.json(result);
});

app.get('/queue/:serviceId/position/:userId', (req, res) => {
  const result = getQueuePosition(req.params.userId, Number(req.params.serviceId));
  if (!result.success) return res.status(404).json(result);
  res.json(result);
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

//Start server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`QueueSmart API running at http://localhost:${PORT}`);
});

export default app;
