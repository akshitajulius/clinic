import {
  createNotification,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  notifyQueueJoined,
  notifyAlmostReady,
  notifications,
} from '../src/backend/modules/notifications.js';

beforeEach(() => {
  notifications.length = 0;
});

describe('createNotification', () => {
  test('creates a notification successfully', () => {
    const result = createNotification('user-1', 'You joined the queue.', 'info');
    expect(result.success).toBe(true);
    expect(result.data.userId).toBe('user-1');
    expect(result.data.message).toBe('You joined the queue.');
    expect(result.data.type).toBe('info');
    expect(result.data.status).toBe('sent');
  });

  test('returns error if userId is missing', () => {
    const result = createNotification(null, 'Hello');
    expect(result.success).toBe(false);
  });

  test('returns error if message is missing', () => {
    const result = createNotification('user-1', '');
    expect(result.success).toBe(false);
  });

  test('returns error if type is invalid', () => {
    const result = createNotification('user-1', 'Hello', 'invalid-type');
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('type must be one of');
  });

  test('defaults to info type if not provided', () => {
    const result = createNotification('user-1', 'Hello');
    expect(result.data.type).toBe('info');
  });
});

describe('getNotificationsForUser', () => {
  test('returns notifications for a specific user', () => {
    createNotification('user-1', 'First notification');
    createNotification('user-1', 'Second notification');
    createNotification('user-2', 'Other user notification');

    const result = getNotificationsForUser('user-1');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(2);
  });

  test('returns empty array if user has no notifications', () => {
    const result = getNotificationsForUser('user-99');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  test('returns error if userId is missing', () => {
    const result = getNotificationsForUser(null);
    expect(result.success).toBe(false);
  });
});

describe('markNotificationRead', () => {
  test('marks a notification as viewed', () => {
    const created = createNotification('user-1', 'Test');
    const result = markNotificationRead(created.data.id);
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('viewed');
  });

  test('returns error if notification not found', () => {
    const result = markNotificationRead(999);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('Notification not found.');
  });
});

describe('markAllNotificationsRead', () => {
  test('marks all notifications for a user as viewed', () => {
    createNotification('user-1', 'First');
    createNotification('user-1', 'Second');

    const result = markAllNotificationsRead('user-1');
    expect(result.success).toBe(true);
    result.data.forEach(n => expect(n.status).toBe('viewed'));
  });

  test('returns error if userId is missing', () => {
    const result = markAllNotificationsRead(null);
    expect(result.success).toBe(false);
  });
});

describe('notifyQueueJoined', () => {
  test('creates a queue joined notification', () => {
    const result = notifyQueueJoined('user-1', 'General Checkup', 3);
    expect(result.success).toBe(true);
    expect(result.data.message).toContain('General Checkup');
    expect(result.data.message).toContain('#3');
    expect(result.data.type).toBe('info');
  });
});

describe('notifyAlmostReady', () => {
  test('creates an almost ready notification', () => {
    const result = notifyAlmostReady('user-1', 'General Checkup');
    expect(result.success).toBe(true);
    expect(result.data.message).toContain('General Checkup');
    expect(result.data.type).toBe('alert');
  });
});
