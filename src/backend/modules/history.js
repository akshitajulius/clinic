import { services } from "../data/store.js";
import { validateRequired } from "../data/validators.js";

export const history = [];

let nextHistoryId = 1;

const VALID_OUTCOMES = ["served", "left_queue", "cancelled_by_clinic"];


export function addHistoryEntry(userId, serviceId, outcome) {
  const validation = validateRequired(["userId", "serviceId", "outcome"], {
    userId,
    serviceId,
    outcome,
  });
  if (!validation.valid) {
    return { success: false, errors: [validation.error] };
  }

  if (!VALID_OUTCOMES.includes(outcome)) {
    return {
      success: false,
      errors: [`outcome must be one of: ${VALID_OUTCOMES.join(", ")}`],
    };
  }

  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return { success: false, errors: ["Service not found."] };
  }

  const entry = {
    id: nextHistoryId++,
    userId,
    serviceId,
    serviceName: service.name,
    outcome,
    timestamp: new Date().toISOString(),
  };

  history.push(entry);
  return { success: true, data: entry };
}

export function getHistoryForUser(userId) {
  if (userId === undefined || userId === null) {
    return { success: false, errors: ["userId is required."] };
  }

  const userHistory = history
    .filter((h) => h.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return { success: true, data: userHistory };
}

export function getHistoryForService(serviceId) {
  if (serviceId === undefined || serviceId === null) {
    return { success: false, errors: ["serviceId is required."] };
  }

  const serviceHistory = history
    .filter((h) => h.serviceId === serviceId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return { success: true, data: serviceHistory };
}

export function getUsageSummary() {
  const summary = {};

  history.forEach((h) => {
    if (!summary[h.serviceName]) {
      summary[h.serviceName] = { total: 0, served: 0, left_queue: 0, cancelled_by_clinic: 0 };
    }
    summary[h.serviceName].total++;
    summary[h.serviceName][h.outcome]++;
  });

  return { success: true, data: summary };
}
