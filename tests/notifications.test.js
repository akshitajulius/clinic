import { jest } from '@jest/globals';

jest.mock('../src/backend/data/notificationDb.js', () => ({
  insertNotification: jest.fn(),
  selectNotificationsByUser: jest.fn(),
  markNotificationAsRead: jest.fn(),
  markAllNotificationsAsRead: jest.fn(),
  selectNotificationById: jest.fn(),
}));

import {
  insertNotification,
  selectNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  selectNotificationById,
} from '../src/backend/data/notificationDb.js';

import {
  createNotification,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  notifyQueueJoined,
  notifyAlmostReady,
} from '../src/backend/modules/notifications.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createNotification', () => {
  test('creates a notification successfully', async () => {
    const mockNotif = { id: 1, userId: 'user-1', message: 'You joined the queue.', type: 'info', status: 'sent', timestamp: new Date().toISOString() };
    insertNotification.mockResolvedValue(mockNotif);

    const result = await createNotification('user-1', 'You joined the queue.', 'info');
    expect(result.success).toBe(true);
    expect(result.data.userId).toBe('user-1');
    expect(insertNotification).toHaveBeenCalledWith('user-1', 'You joined the queue.', 'info');
  });

  test('returns error if userId is missing', async () => {
    const result = await createNotification(null, 'Hello');
    expect(result.success).toBe(false);
  });

  test('returns error if message is missing', async () => {
    const result = await createNotification('user-1', '');
    expect(result.success).toBe(false);
  });

  test('returns error if type is invalid', async () => {
    const result = await createNotification('user-1', 'Hello', 'invalid-type');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('type must be one of');
  });

  test('defaults to info type if not provided', async () => {
    const mockNotif = { id: 1, userId: 'user-1', message: 'Hello', type: 'info', status: 'sent', timestamp: new Date().toISOString() };
    insertNotification.mockResolvedValue(mockNotif);

    const result = await createNotification('user-1', 'Hello');
    expect(insertNotification).toHaveBeenCalledWith('user-1', 'Hello', 'info');
    expect(result.success).toBe(true);
  });
});

describe('getNotificationsForUser', () => {
  test('returns notifications for a specific user', async () => {
    selectNotificationsByUser.mockResolvedValue([
      { id: 1, userId: 'user-1', message: 'First' },
      { id: 2, userId: 'user-1', message: 'Second' },
    ]);

    const result = await getNotificationsForUser('user-1');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  test('returns empty array if user has no notifications', async () => {
    selectNotificationsByUser.mockResolvedValue([]);
    const result = await getNotificationsForUser('user-99');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  test('returns error if userId is missing', async () => {
    const result = await getNotificationsForUser(null);
    expect(result.success).toBe(false);
  });
});

describe('markNotificationRead', () => {
  test('marks a notification as viewed', async () => {
    selectNotificationById.mockResolvedValue({ id: 1, status: 'sent' });
    markNotificationAsRead.mockResolvedValue({ id: 1, status: 'viewed' });

    const result = await markNotificationRead(1);
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('viewed');
  });

  test('returns error if notification not found', async () => {
    selectNotificationById.mockResolvedValue(null);
    const result = await markNotificationRead(999);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('Notification not found.');
  });
});

describe('markAllNotificationsRead', () => {
  test('marks all notifications for a user as viewed', async () => {
    markAllNotificationsAsRead.mockResolvedValue([
      { id: 1, status: 'viewed' },
      { id: 2, status: 'viewed' },
    ]);

    const result = await markAllNotificationsRead('user-1');
    expect(result.success).toBe(true);
    result.data.forEach(n => expect(n.status).toBe('viewed'));
  });

  test('returns error if userId is missing', async () => {
    const result = await markAllNotificationsRead(null);
    expect(result.success).toBe(false);
  });
});

describe('notifyQueueJoined', () => {
  test('creates a queue joined notification', async () => {
    const mockNotif = { id: 1, userId: 'user-1', message: 'You joined the General Checkup queue. Your position is #3.', type: 'info', status: 'sent', timestamp: new Date().toISOString() };
    insertNotification.mockResolvedValue(mockNotif);

    const result = await notifyQueueJoined('user-1', 'General Checkup', 3);
    expect(result.success).toBe(true);
    expect(result.data.message).toContain('General Checkup');
    expect(result.data.message).toContain('#3');
  });
});

describe('notifyAlmostReady', () => {
  test('creates an almost ready notification', async () => {
    const mockNotif = { id: 1, userId: 'user-1', message: 'Your turn is approaching — please head to the front desk for General Checkup.', type: 'alert', status: 'sent', timestamp: new Date().toISOString() };
    insertNotification.mockResolvedValue(mockNotif);

    const result = await notifyAlmostReady('user-1', 'General Checkup');
    expect(result.success).toBe(true);
    expect(result.data.message).toContain('General Checkup');
  });
});
