import pool from './db.js';

export async function initUserTables() {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS UserCredentials (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS UserProfile (
      user_id INT PRIMARY KEY,
      full_name VARCHAR(255),
      email VARCHAR(255),
      contact_info TEXT,
      preferences TEXT,
      FOREIGN KEY (user_id)
      REFERENCES UserCredentials(user_id)
      ON DELETE CASCADE
    )
  `);

  console.log('User tables initialized.');
}
