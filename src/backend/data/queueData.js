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
      position INT NOT NULL,
      join_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status ENUM('waiting', 'served', 'canceled') DEFAULT 'waiting',
      FOREIGN KEY (queue_id) REFERENCES queues(id)
    )
  `);
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
export async function insertQueueEntry(queueId, userId, position) {
  const [result] = await pool.query(
    'INSERT INTO queue_entries (queue_id, user_id, position) VALUES (?, ?, ?)',
    [queueId, userId, position]
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