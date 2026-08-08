import bcrypt from 'bcryptjs';
import pool from '../data/db.js';

export async function registerUser(
  email,
  password,
  role = 'patient'
) {
  
  if (!email) {
    throw new Error('Email is required');
  }

  if (!password) {
    throw new Error('Password is required');
  }

  const [existingUsers] = await pool.query(
    `
    SELECT user_id
    FROM UserCredentials
    WHERE email = ?
    `,
    [email]
  );

  if (existingUsers.length > 0) {
    throw new Error('User already exists');
  }

  const passwordHash =
    await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    `
    INSERT INTO UserCredentials
    (email, password_hash, role)
    VALUES (?, ?, ?)
    `,
    [email, passwordHash, role]
  );

  const userId = result.insertId;

  await pool.query(
    `
    INSERT INTO UserProfile
    (
      user_id,
      full_name,
      email,
      contact_info,
      preferences
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      userId,
      '',
      email,
      '',
      ''
    ]
  );

  return {
    userId,
    email,
    role
  };
}

export async function loginUser(
  email,
  password
) {

  const [users] = await pool.query(
    `
    SELECT *
    FROM UserCredentials
    WHERE email = ?
    `,
    [email]
  );

  const user = users[0];

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const validPassword =
    await bcrypt.compare(
      password,
      user.password_hash
    );

  if (!validPassword) {
    throw new Error(
      'Invalid credentials'
    );
  }

  return {
    userId: user.user_id,
    email: user.email,
    role: user.role
  };
}

export function requireAdmin(user) {

  if (
    !user ||
    user.role !== 'admin'
  ) {
    throw new Error(
      'Administrator access required.'
    );
  }

  return true;
}
