import pool from './db.js';

export async function initNotificationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('info', 'update', 'alert') NOT NULL DEFAULT 'info',
      status ENUM('sent', 'viewed') NOT NULL DEFAULT 'sent',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function insertNotification(userId, message, type = 'info') {
  const [result] = await pool.query(
    'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
    [userId, message, type]
  );
  return {
    id: result.insertId,
    userId,
    message,
    type,
    status: 'sent',
    timestamp: new Date().toISOString(),
  };
}

export async function selectNotificationsByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC',
    [userId]
  );
  return rows;
}

export async function markNotificationAsRead(notificationId) {
  await pool.query(
    'UPDATE notifications SET status = "viewed" WHERE id = ?',
    [notificationId]
  );
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE id = ?',
    [notificationId]
  );
  return rows[0] || null;
}

export async function markAllNotificationsAsRead(userId) {
  await pool.query(
    'UPDATE notifications SET status = "viewed" WHERE user_id = ?',
    [userId]
  );
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ?',
    [userId]
  );
  return rows;
}

export async function selectNotificationById(id) {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

export async function selectHistoryByUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY timestamp DESC',
    [userId]
  );
  return rows;
}

export async function selectHistoryByService(serviceName) {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE message LIKE ? ORDER BY timestamp DESC',
    [`%${serviceName}%`]
  );
  return rows;
}

export async function getUsageSummaryFromDb() {
  const [rows] = await pool.query(
    `SELECT type, status, COUNT(*) as count 
     FROM notifications 
     GROUP BY type, status`
  );
  return rows;
}
