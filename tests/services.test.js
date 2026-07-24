import {
  createService,
  updateService,
  listServices,
  getServiceById,
  deleteService,
  findServiceByName,
} from '../src/backend/modules/services.js';
import { services } from '../src/backend/data/store.js';

const SEED_SERVICES = [
  { id: 1, name: 'General Checkup', description: 'Routine health assessment', duration: 20, priority: 'high', avgWait: '18 min' },
  { id: 2, name: 'Vaccination', description: 'Immunization services', duration: 10, priority: 'medium', avgWait: '5 min' },
  { id: 3, name: 'Lab Draw', description: 'Blood work collection', duration: 15, priority: 'medium', avgWait: '—' },
];

beforeEach(() => {
  services.length = 0;
  SEED_SERVICES.forEach((s) => services.push({ ...s }));
});

// ---------------------------------------------------------------------------
// createService
// ---------------------------------------------------------------------------
describe('createService', () => {
  test('creates a service with all valid fields', () => {
    const result = createService({
      name: 'Dental Cleaning',
      description: 'Teeth cleaning service',
      duration: 30,
      priority: 'high',
    });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Dental Cleaning');
    expect(result.data.description).toBe('Teeth cleaning service');
    expect(result.data.duration).toBe(30);
    expect(result.data.priority).toBe('high');
    expect(result.data.avgWait).toBe('30 min');
    expect(result.data.id).toBeDefined();
  });

  test('defaults priority to low when not provided', () => {
    const result = createService({
      name: 'X-Ray',
      description: 'Diagnostic imaging',
      duration: 15,
    });
    expect(result.success).toBe(true);
    expect(result.data.priority).toBe('low');
  });

  test('trims whitespace from name and description', () => {
    const result = createService({
      name: '  Therapy  ',
      description: '  Physical therapy session  ',
      duration: 45,
    });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Therapy');
    expect(result.data.description).toBe('Physical therapy session');
  });

  test('accepts duration as a numeric string', () => {
    const result = createService({
      name: 'Ultrasound',
      description: 'Imaging scan',
      duration: '25',
    });
    expect(result.success).toBe(true);
    expect(result.data.duration).toBe(25);
    expect(result.data.avgWait).toBe('25 min');
  });

  test('adds the service to the in-memory store', () => {
    const before = services.length;
    createService({ name: 'New', description: 'Desc', duration: 5 });
    expect(services.length).toBe(before + 1);
  });

  // --- validation: missing fields ---
  test('fails when name is missing', () => {
    const result = createService({ description: 'Desc', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('name');
  });

  test('fails when description is missing', () => {
    const result = createService({ name: 'Svc', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('description');
  });

  test('fails when duration is missing', () => {
    const result = createService({ name: 'Svc', description: 'Desc' });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('duration');
  });

  test('fails when all fields are missing', () => {
    const result = createService({});
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  // --- validation: field types ---
  test('fails when name is not a string', () => {
    const result = createService({ name: 123, description: 'Desc', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('name must be a string');
  });

  test('fails when description is not a string', () => {
    const result = createService({ name: 'Svc', description: 999, duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('description must be a string');
  });

  test('fails when duration is not a valid number', () => {
    const result = createService({ name: 'Svc', description: 'D', duration: 'abc' });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('duration must be a number');
  });

  // --- validation: field length ---
  test('fails when name is empty after trim', () => {
    const result = createService({ name: '   ', description: 'Desc', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
  });

  test('fails when name exceeds 100 characters', () => {
    const longName = 'A'.repeat(101);
    const result = createService({ name: longName, description: 'D', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
  });

  test('fails when description exceeds 500 characters', () => {
    const longDesc = 'B'.repeat(501);
    const result = createService({ name: 'Svc', description: longDesc, duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('description'))).toBe(true);
  });

  // --- validation: duration ---
  test('fails when duration is zero', () => {
    const result = createService({ name: 'Svc', description: 'D', duration: 0 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('duration'))).toBe(true);
  });

  test('fails when duration is negative', () => {
    const result = createService({ name: 'Svc', description: 'D', duration: -5 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('duration'))).toBe(true);
  });

  // --- validation: priority enum ---
  test('fails when priority is an invalid value', () => {
    const result = createService({ name: 'Svc', description: 'D', duration: 10, priority: 'urgent' });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('priority'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateService
// ---------------------------------------------------------------------------
describe('updateService', () => {
  test('updates the name of an existing service', () => {
    const result = updateService(1, { name: 'Updated Checkup' });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Updated Checkup');
  });

  test('updates the description', () => {
    const result = updateService(1, { description: 'New description' });
    expect(result.success).toBe(true);
    expect(result.data.description).toBe('New description');
  });

  test('updates duration and recalculates avgWait', () => {
    const result = updateService(1, { duration: 35 });
    expect(result.success).toBe(true);
    expect(result.data.duration).toBe(35);
    expect(result.data.avgWait).toBe('35 min');
  });

  test('updates priority', () => {
    const result = updateService(1, { priority: 'low' });
    expect(result.success).toBe(true);
    expect(result.data.priority).toBe('low');
  });

  test('can update multiple fields at once', () => {
    const result = updateService(2, { name: 'Flu Shot', duration: 5, priority: 'high' });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Flu Shot');
    expect(result.data.duration).toBe(5);
    expect(result.data.priority).toBe('high');
  });

  test('handles duration provided as a string', () => {
    const result = updateService(1, { duration: '40' });
    expect(result.success).toBe(true);
    expect(result.data.duration).toBe(40);
  });

  test('fails when service id does not exist', () => {
    const result = updateService(999, { name: 'Nope' });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Service not found');
  });

  test('fails when name is not a string', () => {
    const result = updateService(1, { name: 42 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('name must be a string');
  });

  test('fails when priority is invalid', () => {
    const result = updateService(1, { priority: 'critical' });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('priority'))).toBe(true);
  });

  test('fails when duration is non-numeric string', () => {
    const result = updateService(1, { duration: 'slow' });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('duration must be a number');
  });

  test('persists update in the store', () => {
    updateService(2, { name: 'Updated Vax' });
    const stored = services.find((s) => s.id === 2);
    expect(stored.name).toBe('Updated Vax');
  });
});

// ---------------------------------------------------------------------------
// listServices
// ---------------------------------------------------------------------------
describe('listServices', () => {
  test('returns all seeded services', () => {
    const result = listServices();
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(3);
  });

  test('returns a copy, not the original array', () => {
    const result = listServices();
    result.data.push({ id: 99, name: 'Extra' });
    expect(services.length).toBe(3);
  });

  test('reflects newly added services', () => {
    createService({ name: 'New Svc', description: 'D', duration: 5 });
    const result = listServices();
    expect(result.data.length).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// getServiceById
// ---------------------------------------------------------------------------
describe('getServiceById', () => {
  test('returns the correct service', () => {
    const result = getServiceById(2);
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Vaccination');
  });

  test('fails for a non-existent id', () => {
    const result = getServiceById(999);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Service not found');
  });
});

// ---------------------------------------------------------------------------
// deleteService
// ---------------------------------------------------------------------------
describe('deleteService', () => {
  test('removes the service and returns it', () => {
    const result = deleteService(3);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(3);
    expect(services.length).toBe(2);
  });

  test('fails for a non-existent id', () => {
    const result = deleteService(999);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Service not found');
  });

  test('service no longer listed after deletion', () => {
    deleteService(1);
    const result = getServiceById(1);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// findServiceByName
// ---------------------------------------------------------------------------
describe('findServiceByName', () => {
  test('finds services matching a partial name', () => {
    const result = findServiceByName('check');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].name).toBe('General Checkup');
  });

  test('search is case-insensitive', () => {
    const result = findServiceByName('LAB');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
  });

  test('returns empty array when nothing matches', () => {
    const result = findServiceByName('zzzzz');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  test('fails when query is empty', () => {
    const result = findServiceByName('');
    expect(result.success).toBe(false);
  });

  test('fails when query is null', () => {
    const result = findServiceByName(null);
    expect(result.success).toBe(false);
  });

  test('fails when query is only whitespace', () => {
    const result = findServiceByName('   ');
    expect(result.success).toBe(false);
  });
});
