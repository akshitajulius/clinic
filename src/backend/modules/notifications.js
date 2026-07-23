import { validateRequired } from "../data/validators.js";


export const notifications = [];

let nextNotifId = 1;

const VALID_TYPES = ["info", "update", "alert"];


export function createNotification(userId, message, type = "info") {
  const validation = validateRequired(["userId", "message"], { userId, message });
  if (!validation.valid) {
    return { success: false, errors: [validation.error] };
  }

  if (!VALID_TYPES.includes(type)) {
    return { success: false, errors: [`type must be one of: ${VALID_TYPES.join(", ")}`] };
  }

  const notification = {
    id: nextNotifId++,
    userId,
    message,
    type,
    status: "sent",
    timestamp: new Date().toISOString(),
  };

  notifications.push(notification);
  return { success: true, data: notification };
}


export function getNotificationsForUser(userId) {
  if (userId === undefined || userId === null) {
    return { success: false, errors: ["userId is required."] };
  }

  const userNotifs = notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return { success: true, data: userNotifs };
}

export function markNotificationRead(notificationId) {
  const notif = notifications.find((n) => n.id === notificationId);
  if (!notif) {
    return { success: false, errors: ["Notification not found."] };
  }

  notif.status = "viewed";
  return { success: true, data: notif };
}

export function markAllNotificationsRead(userId) {
  if (userId === undefined || userId === null) {
    return { success: false, errors: ["userId is required."] };
  }

  const updated = notifications.filter((n) => n.userId === userId);
  updated.forEach((n) => (n.status = "viewed"));

  return { success: true, data: updated };
}

export function notifyQueueJoined(userId, serviceName, position) {
  return createNotification(
    userId,
    `You joined the ${serviceName} queue. Your position is #${position}.`,
    "info"
  );
}

export function notifyAlmostReady(userId, serviceName) {
  return createNotification(
    userId,
    `Your turn is approaching — please head to the front desk for ${serviceName}.`,
    "alert"
  );
}
