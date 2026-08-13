import pool from './db.js';

export async function initQueueTables() {
  // Created the queues table, linking to services table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS queues (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id INT NOT NULL,
      status ENUM('open', 'closed') DEFAULT 'open',
      created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id)
    )
  `);

  // Created the queue_entries table, linking to the queues table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS queue_entries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      queue_id INT NOT NULL,
      user_id VARCHAR(255) NOT NULL, 
      user_name VARCHAR(255) DEFAULT '',
      position INT NOT NULL,
      join_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status ENUM('waiting', 'served', 'canceled') DEFAULT 'waiting',
      FOREIGN KEY (queue_id) REFERENCES queues(id)
    )
  `);

  // Add user_name column if it doesn't exist (for existing tables)
  try {
    await pool.query(`ALTER TABLE queue_entries ADD COLUMN user_name VARCHAR(255) DEFAULT '' AFTER user_id`);
  } catch {
    // Column already exists
  }
}

// Gets an active queue for a specific service, or returns null if none exists
export async function getOpenQueueByServiceId(serviceId) {
  const [rows] = await pool.query(
    'SELECT * FROM queues WHERE service_id = ? AND status = "open"',
    [serviceId]
  );
  return rows[0] || null;
}

// Creates a brand new queue for a service
export async function createQueue(serviceId) {
  const [result] = await pool.query(
    'INSERT INTO queues (service_id) VALUES (?)',
    [serviceId]
  );
  return result.insertId;
}

// Counts how many people are currently waiting in a specific queue
export async function getWaitingCount(queueId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM queue_entries WHERE queue_id = ? AND status = "waiting"',
    [queueId]
  );
  return rows[0].count;
}

// Inserts a new patient into the queue line
export async function insertQueueEntry(queueId, userId, position, userName = '') {
  const [result] = await pool.query(
    'INSERT INTO queue_entries (queue_id, user_id, user_name, position) VALUES (?, ?, ?, ?)',
    [queueId, userId, userName, position]
  );
  return result.insertId;
}

// Updates a patient's status (e.g., when they leave the queue or get served)
export async function updateQueueEntryStatus(entryId, newStatus) {
  await pool.query(
    'UPDATE queue_entries SET status = ? WHERE id = ?',
    [newStatus, entryId]
  );
}

// Gets a specific user's waiting entry for a service queue
export async function getUserQueueEntry(userId, serviceId) {
  const [rows] = await pool.query(`
    SELECT qe.*, s.duration, s.name as serviceName 
    FROM queue_entries qe
    JOIN queues q ON qe.queue_id = q.id
    JOIN services s ON q.service_id = s.id
    WHERE qe.user_id = ? AND q.service_id = ? AND qe.status = "waiting" AND q.status = "open"
  `, [userId, serviceId]);
  return rows[0] || null;
}

// Gets all waiting patients for a specific service queue, ordered by their position in line
export async function getWaitingQueueForService(serviceId) {
  const [rows] = await pool.query(`
    SELECT qe.*, COALESCE(NULLIF(qe.user_name, ''), qe.user_id) as userName, s.duration, s.name as serviceName
    FROM queue_entries qe
    JOIN queues q ON qe.queue_id = q.id
    JOIN services s ON q.service_id = s.id
    WHERE q.service_id = ? AND qe.status = "waiting" AND q.status = "open"
    ORDER BY qe.position ASC
  `, [serviceId]);
  return rows;
}

// Gets all waiting patients across all open queues
export async function getAllActiveQueues() {
  const [rows] = await pool.query(`
    SELECT qe.*, COALESCE(NULLIF(qe.user_name, ''), qe.user_id) as userName, s.id as serviceId, s.duration, s.name as serviceName
    FROM queue_entries qe
    JOIN queues q ON qe.queue_id = q.id
    JOIN services s ON q.service_id = s.id
    WHERE qe.status = "waiting" AND q.status = "open"
    ORDER BY s.id, qe.position ASC
  `);
  return rows;
}