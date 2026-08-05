import pool from './db.js';

export async function initServiceTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(500) NOT NULL,
      duration INT NOT NULL CHECK (duration > 0),
      priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'low',
      avgWait VARCHAR(20) NOT NULL
    )
  `);
}

export async function insertService(service) {
  const [result] = await pool.query(
    'INSERT INTO services (name, description, duration, priority, avgWait) VALUES (?, ?, ?, ?, ?)',
    [service.name, service.description, service.duration, service.priority, service.avgWait]
  );
  return { ...service, id: result.insertId };
}

export async function selectAllServices() {
  const [rows] = await pool.query('SELECT * FROM services');
  return rows;
}

export async function selectServiceById(id) {
  const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function updateServiceById(id, fields) {
  const sets = [];
  const values = [];

  for (const [key, val] of Object.entries(fields)) {
    sets.push(`${key} = ?`);
    values.push(val);
  }

  values.push(id);
  await pool.query(`UPDATE services SET ${sets.join(', ')} WHERE id = ?`, values);
  return selectServiceById(id);
}

export async function deleteServiceById(id) {
  const service = await selectServiceById(id);
  if (!service) return null;
  await pool.query('DELETE FROM services WHERE id = ?', [id]);
  return service;
}

export async function searchServicesByName(query) {
  const [rows] = await pool.query(
    'SELECT * FROM services WHERE LOWER(name) LIKE ?',
    [`%${query.toLowerCase()}%`]
  );
  return rows;
}
