import { validateRequired } from '../data/validators.js';
import {
  insertNotification,
  selectNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  selectNotificationById,
} from '../data/notificationDb.js';

const VALID_TYPES = ['info', 'update', 'alert'];

export async function createNotification(userId, message, type = 'info') {
  const validation = validateRequired(['userId', 'message'], { userId, message });
  if (!validation.valid) {
    return { success: false, errors: [validation.error] };
  }
  if (!VALID_TYPES.includes(type)) {
    return { success: false, errors: [`type must be one of: ${VALID_TYPES.join(', ')}`] };
  }
  const notification = await insertNotification(userId, message, type);
  return { success: true, data: notification };
}

export async function getNotificationsForUser(userId) {
  if (userId === undefined || userId === null) {
    return { success: false, errors: ['userId is required.'] };
  }
  const notifications = await selectNotificationsByUser(userId);
  return { success: true, data: notifications };
}

export async function markNotificationRead(notificationId) {
  const existing = await selectNotificationById(notificationId);
  if (!existing) {
    return { success: false, errors: ['Notification not found.'] };
  }
  const updated = await markNotificationAsRead(notificationId);
  return { success: true, data: updated };
}

export async function markAllNotificationsRead(userId) {
  if (userId === undefined || userId === null) {
    return { success: false, errors: ['userId is required.'] };
  }
  const updated = await markAllNotificationsAsRead(userId);
  return { success: true, data: updated };
}

export async function notifyQueueJoined(userId, serviceName, position) {
  return createNotification(
    userId,
    `You joined the ${serviceName} queue. Your position is #${position}.`,
    'info'
  );
}

export async function notifyAlmostReady(userId, serviceName) {
  return createNotification(
    userId,
    `Your turn is approaching — please head to the front desk for ${serviceName}.`,
    'alert'
  );
}
