import { jest } from '@jest/globals';

jest.mock('../src/backend/data/db.js', () => ({
  __esModule: true,
  default: {
    query: jest.fn()
  }
}));

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(),
    compare: jest.fn()
  }
}));

import pool from '../src/backend/data/db.js';
import bcrypt from 'bcryptjs';

import {
  registerUser,
  loginUser,
  requireAdmin
} from '../src/backend/modules/auth.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Authentication Module', () => {

  test('registers a patient', async () => {

    pool.query
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 1 }])
      .mockResolvedValueOnce([{}]);

    bcrypt.hash.mockResolvedValue('hashedPassword');

    const result = await registerUser(
      'test@test.com',
      '12345678'
    );

    expect(result.role).toBe('patient');
    expect(result.userId).toBe(1);

  });

  test('rejects duplicate email', async () => {

    pool.query.mockResolvedValueOnce([
      [{ user_id: 1 }]
    ]);

    await expect(
      registerUser(
        'test@test.com',
        '12345678'
      )
    ).rejects.toThrow('User already exists');

  });

  test('email is required', async () => {

    await expect(
      registerUser('', '12345678')
    ).rejects.toThrow('Email is required');

  });

  test('password is required', async () => {

    await expect(
      registerUser('test@test.com', '')
    ).rejects.toThrow('Password is required');

  });

  test('logs in valid user', async () => {

    pool.query.mockResolvedValueOnce([
      [{
        user_id: 1,
        email: 'admin@gmail.com',
        password_hash: 'hash',
        role: 'admin'
      }]
    ]);

    bcrypt.compare.mockResolvedValue(true);

    const result = await loginUser(
      'admin@gmail.com',
      '12345678'
    );

    expect(result.role).toBe('admin');

  });

  test('rejects unknown login', async () => {

    pool.query.mockResolvedValueOnce([[]]);

    await expect(
      loginUser(
        'fake@test.com',
        '12345678'
      )
    ).rejects.toThrow('Invalid credentials');

  });

  test('rejects invalid password', async () => {

    pool.query.mockResolvedValueOnce([
      [{
        user_id: 1,
        email: 'admin@gmail.com',
        password_hash: 'hash',
        role: 'admin'
      }]
    ]);

    bcrypt.compare.mockResolvedValue(false);

    await expect(
      loginUser(
        'admin@gmail.com',
        'wrongPassword'
      )
    ).rejects.toThrow('Invalid credentials');

  });

  test('patient cannot access admin actions', () => {

    expect(() =>
      requireAdmin({
        role: 'patient'
      })
    ).toThrow(
      'Administrator access required.'
    );

  });

  test('admin is allowed', () => {

    expect(
      requireAdmin({
        role: 'admin'
      })
    ).toBe(true);

  });

});