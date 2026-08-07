import {
  insertService,
  selectAllServices,
  selectServiceById,
  updateServiceById,
  deleteServiceById,
  searchServicesByName,
} from '../data/serviceDb.js';
import {
  validateRequired,
  validateStringLength,
  validatePositiveNumber,
  validateEnum,
} from '../data/validators.js';

const PRIORITY_LEVELS = ['low', 'medium', 'high'];

function validateServiceData(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate) {
    const req = validateRequired(['name', 'description', 'duration'], data);
    if (!req.valid) return { valid: false, errors: [req.error] };
  }

  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      errors.push('name must be a string');
    } else {
      const len = validateStringLength('name', data.name.trim(), 1, 100);
      if (!len.valid) errors.push(len.error);
    }
  }

  if (data.description !== undefined) {
    if (typeof data.description !== 'string') {
      errors.push('description must be a string');
    } else {
      const len = validateStringLength('description', data.description.trim(), 1, 500);
      if (!len.valid) errors.push(len.error);
    }
  }

  if (data.duration !== undefined) {
    const dur = typeof data.duration === 'string' ? Number(data.duration) : data.duration;
    if (isNaN(dur)) {
      errors.push('duration must be a number');
    } else {
      const pos = validatePositiveNumber('duration', dur);
      if (!pos.valid) errors.push(pos.error);
    }
  }

  if (data.priority !== undefined) {
    const e = validateEnum('priority', data.priority, PRIORITY_LEVELS);
    if (!e.valid) errors.push(e.error);
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}

export async function createService(data) {
  const validation = validateServiceData(data);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const duration = typeof data.duration === 'string' ? Number(data.duration) : data.duration;

  const newService = {
    name: data.name.trim(),
    description: data.description.trim(),
    duration,
    priority: data.priority || 'low',
    avgWait: `${duration} min`,
  };

  const saved = await insertService(newService);
  return { success: true, data: saved };
}

export async function updateService(id, data) {
  const existing = await selectServiceById(id);
  if (!existing) {
    return { success: false, errors: ['Service not found'] };
  }

  const validation = validateServiceData(data, true);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const fields = {};

  if (data.name !== undefined) fields.name = data.name.trim();
  if (data.description !== undefined) fields.description = data.description.trim();
  if (data.duration !== undefined) {
    fields.duration = typeof data.duration === 'string' ? Number(data.duration) : data.duration;
    fields.avgWait = `${fields.duration} min`;
  }
  if (data.priority !== undefined) fields.priority = data.priority;

  if (Object.keys(fields).length === 0) {
    return { success: true, data: existing };
  }

  const updated = await updateServiceById(id, fields);
  return { success: true, data: updated };
}

export async function listServices() {
  const rows = await selectAllServices();
  return { success: true, data: rows };
}

export async function getServiceById(id) {
  const service = await selectServiceById(id);
  if (!service) {
    return { success: false, errors: ['Service not found'] };
  }
  return { success: true, data: service };
}

export async function deleteService(id) {
  const removed = await deleteServiceById(id);
  if (!removed) {
    return { success: false, errors: ['Service not found'] };
  }
  return { success: true, data: removed };
}

export async function findServiceByName(query) {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return { success: false, errors: ['Search query is required'] };
  }
  const results = await searchServicesByName(query.trim());
  return { success: true, data: results };
}
