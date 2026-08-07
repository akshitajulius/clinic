import { jest } from '@jest/globals';

jest.mock('../src/backend/data/notificationDb.js', () => ({
  insertNotification: jest.fn(),
  selectHistoryByUser: jest.fn(),
  selectHistoryByService: jest.fn(),
  getUsageSummaryFromDb: jest.fn(),
}));

import {
  insertNotification,
  selectHistoryByUser,
  selectHistoryByService,
  getUsageSummaryFromDb,
} from '../src/backend/data/notificationDb.js';

import {
  addHistoryEntry,
  getHistoryForUser,
  getHistoryForService,
  getUsageSummary,
} from '../src/backend/modules/history.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('addHistoryEntry', () => {
  test('adds a history entry successfully', async () => {
    const mockEntry = { id: 1, userId: 'user-1', message: 'General Checkup — served', type: 'update', status: 'sent', timestamp: new Date().toISOString() };
    insertNotification.mockResolvedValue(mockEntry);

    const result = await addHistoryEntry('user-1', 1, 'served');
    expect(result.success).toBe(true);
    expect(result.data.serviceName).toBe('General Checkup');
    expect(result.data.outcome).toBe('served');
  });

  test('returns error if userId is missing', async () => {
    const result = await addHistoryEntry(null, 1, 'served');
    expect(result.success).toBe(false);
  });

  test('returns error if serviceId is missing', async () => {
    const result = await addHistoryEntry('user-1', null, 'served');
    expect(result.success).toBe(false);
  });

  test('returns error if outcome is missing', async () => {
    const result = await addHistoryEntry('user-1', 1, null);
    expect(result.success).toBe(false);
  });

  test('returns error if outcome is invalid', async () => {
    const result = await addHistoryEntry('user-1', 1, 'invalid-outcome');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('outcome must be one of');
  });

  test('returns error if service does not exist', async () => {
    const result = await addHistoryEntry('user-1', 999, 'served');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('Service not found.');
  });
});

describe('getHistoryForUser', () => {
  test('returns history entries for a specific user', async () => {
    selectHistoryByUser.mockResolvedValue([
      { id: 1, userId: 'user-1', message: 'General Checkup — served' },
      { id: 2, userId: 'user-1', message: 'Vaccination — left_queue' },
    ]);

    const result = await getHistoryForUser('user-1');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  test('returns empty array if user has no history', async () => {
    selectHistoryByUser.mockResolvedValue([]);
    const result = await getHistoryForUser('user-99');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  test('returns error if userId is missing', async () => {
    const result = await getHistoryForUser(null);
    expect(result.success).toBe(false);
  });
});

describe('getHistoryForService', () => {
  test('returns history entries for a specific service', async () => {
    selectHistoryByService.mockResolvedValue([
      { id: 1, message: 'General Checkup — served' },
      { id: 2, message: 'General Checkup — left_queue' },
    ]);

    const result = await getHistoryForService(1);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  test('returns error if serviceId is missing', async () => {
    const result = await getHistoryForService(null);
    expect(result.success).toBe(false);
  });

  test('returns error if service does not exist', async () => {
    const result = await getHistoryForService(999);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('Service not found.');
  });
});

describe('getUsageSummary', () => {
  test('returns usage summary from database', async () => {
    getUsageSummaryFromDb.mockResolvedValue([
      { type: 'update', status: 'sent', count: 3 },
      { type: 'info', status: 'viewed', count: 2 },
    ]);

    const result = await getUsageSummary();
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  test('returns empty array if no history exists', async () => {
    getUsageSummaryFromDb.mockResolvedValue([]);
    const result = await getUsageSummary();
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });
});
