import { services } from '../data/store.js';
import { validateRequired } from '../data/validators.js';
import { insertNotification, selectHistoryByUser, selectHistoryByService, getUsageSummaryFromDb } from '../data/notificationDb.js';

const VALID_OUTCOMES = ['served', 'left_queue', 'cancelled_by_clinic'];

export async function addHistoryEntry(userId, serviceId, outcome) {
  const validation = validateRequired(['userId', 'serviceId', 'outcome'], { userId, serviceId, outcome });
  if (!validation.valid) {
    return { success: false, errors: [validation.error] };
  }
  if (!VALID_OUTCOMES.includes(outcome)) {
    return { success: false, errors: [`outcome must be one of: ${VALID_OUTCOMES.join(', ')}`] };
  }
  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return { success: false, errors: ['Service not found.'] };
  }
  const message = `${service.name} — ${outcome}`;
  const entry = await insertNotification(userId, message, 'update');
  return { success: true, data: { ...entry, serviceName: service.name, outcome } };
}

export async function getHistoryForUser(userId) {
  if (userId === undefined || userId === null) {
    return { success: false, errors: ['userId is required.'] };
  }
  const entries = await selectHistoryByUser(userId);
  return { success: true, data: entries };
}

export async function getHistoryForService(serviceId) {
  if (serviceId === undefined || serviceId === null) {
    return { success: false, errors: ['serviceId is required.'] };
  }
  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return { success: false, errors: ['Service not found.'] };
  }
  const entries = await selectHistoryByService(service.name);
  return { success: true, data: entries };
}

export async function getUsageSummary() {
  const rows = await getUsageSummaryFromDb();
  return { success: true, data: rows };
}
