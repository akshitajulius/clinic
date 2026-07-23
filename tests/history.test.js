import {
  addHistoryEntry,
  getHistoryForUser,
  getHistoryForService,
  getUsageSummary,
  history,
} from '../src/backend/modules/history.js';
import { queues } from '../src/backend/data/store.js';

beforeEach(() => {
  history.length = 0;
  queues.length = 0;
});

describe('addHistoryEntry', () => {
  test('adds a history entry successfully', () => {
    const result = addHistoryEntry('user-1', 1, 'served');
    expect(result.success).toBe(true);
    expect(result.data.userId).toBe('user-1');
    expect(result.data.serviceId).toBe(1);
    expect(result.data.outcome).toBe('served');
    expect(result.data.serviceName).toBe('General Checkup');
  });

  test('returns error if userId is missing', () => {
    const result = addHistoryEntry(null, 1, 'served');
    expect(result.success).toBe(false);
  });

  test('returns error if serviceId is missing', () => {
    const result = addHistoryEntry('user-1', null, 'served');
    expect(result.success).toBe(false);
  });

  test('returns error if outcome is missing', () => {
    const result = addHistoryEntry('user-1', 1, null);
    expect(result.success).toBe(false);
  });

  test('returns error if outcome is invalid', () => {
    const result = addHistoryEntry('user-1', 1, 'invalid-outcome');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('outcome must be one of');
  });

  test('returns error if service does not exist', () => {
    const result = addHistoryEntry('user-1', 999, 'served');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('Service not found.');
  });

  test('includes a timestamp in the entry', () => {
    const result = addHistoryEntry('user-1', 1, 'served');
    expect(result.data.timestamp).toBeDefined();
  });
});

describe('getHistoryForUser', () => {
  test('returns history entries for a specific user', () => {
    addHistoryEntry('user-1', 1, 'served');
    addHistoryEntry('user-1', 2, 'left_queue');
    addHistoryEntry('user-2', 1, 'served');

    const result = getHistoryForUser('user-1');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  test('returns empty array if user has no history', () => {
    const result = getHistoryForUser('user-99');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  test('returns error if userId is missing', () => {
    const result = getHistoryForUser(null);
    expect(result.success).toBe(false);
  });
});

describe('getHistoryForService', () => {
  test('returns history entries for a specific service', () => {
    addHistoryEntry('user-1', 1, 'served');
    addHistoryEntry('user-2', 1, 'left_queue');
    addHistoryEntry('user-3', 2, 'served');

    const result = getHistoryForService(1);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  test('returns empty array if service has no history', () => {
    const result = getHistoryForService(3);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  test('returns error if serviceId is missing', () => {
    const result = getHistoryForService(null);
    expect(result.success).toBe(false);
  });
});

describe('getUsageSummary', () => {
  test('returns correct totals per service', () => {
    addHistoryEntry('user-1', 1, 'served');
    addHistoryEntry('user-2', 1, 'left_queue');
    addHistoryEntry('user-3', 1, 'served');

    const result = getUsageSummary();
    expect(result.success).toBe(true);
    expect(result.data['General Checkup'].total).toBe(3);
    expect(result.data['General Checkup'].served).toBe(2);
    expect(result.data['General Checkup'].left_queue).toBe(1);
  });

  test('returns empty object if no history exists', () => {
    const result = getUsageSummary();
    expect(result.success).toBe(true);
    expect(Object.keys(result.data).length).toBe(0);
  });
});
