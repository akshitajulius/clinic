import { services, generateId } from "../data/store.js";
import {
  validateRequired,
  validateStringLength,
  validatePositiveNumber,
  validateEnum,
} from "../data/validators.js";

const PRIORITY_LEVELS = ["low", "medium", "high"];

function validateServiceData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate) {
    const req = validateRequired(["name", "description", "duration"], data);
    if (!req.valid) return { valid: false, errors: [req.error] };
  }

  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      errors.push("name must be a string");
    } else {
      const len = validateStringLength("name", data.name.trim(), 1, 100);
      if (!len.valid) errors.push(len.error);
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== "string") {
      errors.push("description must be a string");
    } else {
      const len = validateStringLength("description", data.description.trim(), 1, 500);
      if (!len.valid) errors.push(len.error);
    }
  }

  if (data.duration !== undefined) {
    const dur = typeof data.duration === "string" ? Number(data.duration) : data.duration;
    if (isNaN(dur)) {
      errors.push("duration must be a number");
    } else {
      const pos = validatePositiveNumber("duration", dur);
      if (!pos.valid) errors.push(pos.error);
    }
  }

  if (data.priority !== undefined) {
    const e = validateEnum("priority", data.priority, PRIORITY_LEVELS);
    if (!e.valid) errors.push(e.error);
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export function createService(data) {
  const validation = validateServiceData(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const newService = {
    id: generateId("service"),
    name: data.name.trim(),
    description: data.description.trim(),
    duration: typeof data.duration === "string" ? Number(data.duration) : data.duration,
    priority: data.priority || "low",
    avgWait: `${typeof data.duration === "string" ? Number(data.duration) : data.duration} min`,
  };

  services.push(newService);
  return { success: true, data: newService };
}

export function updateService(id, data) {
  const index = services.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, errors: ["Service not found"] };
  }

  const validation = validateServiceData(data, true);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const existing = services[index];

  if (data.name !== undefined) existing.name = data.name.trim();
  if (data.description !== undefined) existing.description = data.description.trim();
  if (data.duration !== undefined) {
    existing.duration = typeof data.duration === "string" ? Number(data.duration) : data.duration;
    existing.avgWait = `${existing.duration} min`;
  }
  if (data.priority !== undefined) existing.priority = data.priority;

  return { success: true, data: existing };
}

export function listServices() {
  return { success: true, data: [...services] };
}

export function getServiceById(id) {
  const service = services.find((s) => s.id === id);
  if (!service) {
    return { success: false, errors: ["Service not found"] };
  }
  return { success: true, data: service };
}

export function deleteService(id) {
  const index = services.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, errors: ["Service not found"] };
  }
  const removed = services.splice(index, 1)[0];
  return { success: true, data: removed };
}

export function findServiceByName(query) {
  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return { success: false, errors: ["Search query is required"] };
  }
  const results = services.filter((s) =>
    s.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  return { success: true, data: results };
}
