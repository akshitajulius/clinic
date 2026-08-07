import { jest } from '@jest/globals';

jest.mock('../src/backend/data/serviceDb.js', () => ({
  insertService: jest.fn(),
  selectAllServices: jest.fn(),
  selectServiceById: jest.fn(),
  updateServiceById: jest.fn(),
  deleteServiceById: jest.fn(),
  searchServicesByName: jest.fn(),
}));

import {
  insertService,
  selectAllServices,
  selectServiceById,
  updateServiceById,
  deleteServiceById,
  searchServicesByName,
} from '../src/backend/data/serviceDb.js';

import {
  createService,
  updateService,
  listServices,
  getServiceById,
  deleteService,
  findServiceByName,
} from '../src/backend/modules/services.js';

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// createService
// ---------------------------------------------------------------------------
describe('createService', () => {
  test('creates a service with all valid fields', async () => {
    const mockSaved = { id: 1, name: 'Dental Cleaning', description: 'Teeth cleaning service', duration: 30, priority: 'high', avgWait: '30 min', created_at: '2026-01-01', updated_at: '2026-01-01' };
    insertService.mockResolvedValue(mockSaved);

    const result = await createService({
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
    expect(insertService).toHaveBeenCalledWith({
      name: 'Dental Cleaning',
      description: 'Teeth cleaning service',
      duration: 30,
      priority: 'high',
      avgWait: '30 min',
    });
  });

  test('defaults priority to low when not provided', async () => {
    const mockSaved = { id: 2, name: 'X-Ray', description: 'Diagnostic imaging', duration: 15, priority: 'low', avgWait: '15 min' };
    insertService.mockResolvedValue(mockSaved);

    const result = await createService({
      name: 'X-Ray',
      description: 'Diagnostic imaging',
      duration: 15,
    });
    expect(result.success).toBe(true);
    expect(result.data.priority).toBe('low');
  });

  test('trims whitespace from name and description', async () => {
    const mockSaved = { id: 3, name: 'Therapy', description: 'Physical therapy session', duration: 45, priority: 'low', avgWait: '45 min' };
    insertService.mockResolvedValue(mockSaved);

    const result = await createService({
      name: '  Therapy  ',
      description: '  Physical therapy session  ',
      duration: 45,
    });
    expect(result.success).toBe(true);
    expect(insertService).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Therapy', description: 'Physical therapy session' })
    );
  });

  test('accepts duration as a numeric string', async () => {
    const mockSaved = { id: 4, name: 'Ultrasound', description: 'Imaging scan', duration: 25, priority: 'low', avgWait: '25 min' };
    insertService.mockResolvedValue(mockSaved);

    const result = await createService({
      name: 'Ultrasound',
      description: 'Imaging scan',
      duration: '25',
    });
    expect(result.success).toBe(true);
    expect(result.data.duration).toBe(25);
    expect(result.data.avgWait).toBe('25 min');
  });

  test('calls insertService on the DB layer', async () => {
    const mockSaved = { id: 5, name: 'New', description: 'Desc', duration: 5, priority: 'low', avgWait: '5 min' };
    insertService.mockResolvedValue(mockSaved);

    await createService({ name: 'New', description: 'Desc', duration: 5 });
    expect(insertService).toHaveBeenCalledTimes(1);
  });

  test('fails when name is missing', async () => {
    const result = await createService({ description: 'Desc', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('name');
    expect(insertService).not.toHaveBeenCalled();
  });

  test('fails when description is missing', async () => {
    const result = await createService({ name: 'Svc', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('description');
  });

  test('fails when duration is missing', async () => {
    const result = await createService({ name: 'Svc', description: 'Desc' });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('duration');
  });

  test('fails when all fields are missing', async () => {
    const result = await createService({});
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('fails when name is not a string', async () => {
    const result = await createService({ name: 123, description: 'Desc', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('name must be a string');
  });

  test('fails when description is not a string', async () => {
    const result = await createService({ name: 'Svc', description: 999, duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('description must be a string');
  });

  test('fails when duration is not a valid number', async () => {
    const result = await createService({ name: 'Svc', description: 'D', duration: 'abc' });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('duration must be a number');
  });

  test('fails when name is empty after trim', async () => {
    const result = await createService({ name: '   ', description: 'Desc', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
  });

  test('fails when name exceeds 100 characters', async () => {
    const longName = 'A'.repeat(101);
    const result = await createService({ name: longName, description: 'D', duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('name'))).toBe(true);
  });

  test('fails when description exceeds 500 characters', async () => {
    const longDesc = 'B'.repeat(501);
    const result = await createService({ name: 'Svc', description: longDesc, duration: 10 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('description'))).toBe(true);
  });

  test('fails when duration is zero', async () => {
    const result = await createService({ name: 'Svc', description: 'D', duration: 0 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('duration'))).toBe(true);
  });

  test('fails when duration is negative', async () => {
    const result = await createService({ name: 'Svc', description: 'D', duration: -5 });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('duration'))).toBe(true);
  });

  test('fails when priority is an invalid value', async () => {
    const result = await createService({ name: 'Svc', description: 'D', duration: 10, priority: 'urgent' });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('priority'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// updateService
// ---------------------------------------------------------------------------
describe('updateService', () => {
  const mockService = { id: 1, name: 'General Checkup', description: 'Routine health assessment', duration: 20, priority: 'high', avgWait: '18 min' };

  test('updates the name of an existing service', async () => {
    selectServiceById.mockResolvedValue(mockService);
    updateServiceById.mockResolvedValue({ ...mockService, name: 'Updated Checkup' });

    const result = await updateService(1, { name: 'Updated Checkup' });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Updated Checkup');
  });

  test('updates the description', async () => {
    selectServiceById.mockResolvedValue(mockService);
    updateServiceById.mockResolvedValue({ ...mockService, description: 'New description' });

    const result = await updateService(1, { description: 'New description' });
    expect(result.success).toBe(true);
    expect(result.data.description).toBe('New description');
  });

  test('updates duration and recalculates avgWait', async () => {
    selectServiceById.mockResolvedValue(mockService);
    updateServiceById.mockResolvedValue({ ...mockService, duration: 35, avgWait: '35 min' });

    const result = await updateService(1, { duration: 35 });
    expect(result.success).toBe(true);
    expect(result.data.duration).toBe(35);
    expect(result.data.avgWait).toBe('35 min');
  });

  test('updates priority', async () => {
    selectServiceById.mockResolvedValue(mockService);
    updateServiceById.mockResolvedValue({ ...mockService, priority: 'low' });

    const result = await updateService(1, { priority: 'low' });
    expect(result.success).toBe(true);
    expect(result.data.priority).toBe('low');
  });

  test('can update multiple fields at once', async () => {
    selectServiceById.mockResolvedValue({ id: 2, name: 'Vaccination', description: 'Immunization services', duration: 10, priority: 'medium', avgWait: '5 min' });
    updateServiceById.mockResolvedValue({ id: 2, name: 'Flu Shot', description: 'Immunization services', duration: 5, priority: 'high', avgWait: '5 min' });

    const result = await updateService(2, { name: 'Flu Shot', duration: 5, priority: 'high' });
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Flu Shot');
    expect(result.data.duration).toBe(5);
    expect(result.data.priority).toBe('high');
  });

  test('handles duration provided as a string', async () => {
    selectServiceById.mockResolvedValue(mockService);
    updateServiceById.mockResolvedValue({ ...mockService, duration: 40, avgWait: '40 min' });

    const result = await updateService(1, { duration: '40' });
    expect(result.success).toBe(true);
    expect(result.data.duration).toBe(40);
  });

  test('fails when service id does not exist', async () => {
    selectServiceById.mockResolvedValue(null);

    const result = await updateService(999, { name: 'Nope' });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Service not found');
  });

  test('fails when name is not a string', async () => {
    selectServiceById.mockResolvedValue(mockService);

    const result = await updateService(1, { name: 42 });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('name must be a string');
  });

  test('fails when priority is invalid', async () => {
    selectServiceById.mockResolvedValue(mockService);

    const result = await updateService(1, { priority: 'critical' });
    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.includes('priority'))).toBe(true);
  });

  test('fails when duration is non-numeric string', async () => {
    selectServiceById.mockResolvedValue(mockService);

    const result = await updateService(1, { duration: 'slow' });
    expect(result.success).toBe(false);
    expect(result.errors).toContain('duration must be a number');
  });

  test('returns existing service when no fields provided', async () => {
    selectServiceById.mockResolvedValue(mockService);

    const result = await updateService(1, {});
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockService);
    expect(updateServiceById).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// listServices
// ---------------------------------------------------------------------------
describe('listServices', () => {
  test('returns all services from DB', async () => {
    const mockRows = [
      { id: 1, name: 'General Checkup', description: 'Routine health assessment', duration: 20, priority: 'high', avgWait: '18 min' },
      { id: 2, name: 'Vaccination', description: 'Immunization services', duration: 10, priority: 'medium', avgWait: '5 min' },
      { id: 3, name: 'Lab Draw', description: 'Blood work collection', duration: 15, priority: 'medium', avgWait: '—' },
    ];
    selectAllServices.mockResolvedValue(mockRows);

    const result = await listServices();
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(3);
    expect(selectAllServices).toHaveBeenCalledTimes(1);
  });

  test('returns empty array when no services exist', async () => {
    selectAllServices.mockResolvedValue([]);

    const result = await listServices();
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getServiceById
// ---------------------------------------------------------------------------
describe('getServiceById', () => {
  test('returns the correct service', async () => {
    const mockService = { id: 2, name: 'Vaccination', description: 'Immunization services', duration: 10, priority: 'medium', avgWait: '5 min' };
    selectServiceById.mockResolvedValue(mockService);

    const result = await getServiceById(2);
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Vaccination');
    expect(selectServiceById).toHaveBeenCalledWith(2);
  });

  test('fails for a non-existent id', async () => {
    selectServiceById.mockResolvedValue(null);

    const result = await getServiceById(999);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Service not found');
  });
});

// ---------------------------------------------------------------------------
// deleteService
// ---------------------------------------------------------------------------
describe('deleteService', () => {
  test('removes the service and returns it', async () => {
    const mockService = { id: 3, name: 'Lab Draw', description: 'Blood work collection', duration: 15, priority: 'medium', avgWait: '—' };
    deleteServiceById.mockResolvedValue(mockService);

    const result = await deleteService(3);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(3);
    expect(deleteServiceById).toHaveBeenCalledWith(3);
  });

  test('fails for a non-existent id', async () => {
    deleteServiceById.mockResolvedValue(null);

    const result = await deleteService(999);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Service not found');
  });
});

// ---------------------------------------------------------------------------
// findServiceByName
// ---------------------------------------------------------------------------
describe('findServiceByName', () => {
  test('finds services matching a partial name', async () => {
    const mockResults = [{ id: 1, name: 'General Checkup', description: 'Routine health assessment', duration: 20, priority: 'high', avgWait: '18 min' }];
    searchServicesByName.mockResolvedValue(mockResults);

    const result = await findServiceByName('check');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.data[0].name).toBe('General Checkup');
    expect(searchServicesByName).toHaveBeenCalledWith('check');
  });

  test('search is case-insensitive (delegates to DB)', async () => {
    searchServicesByName.mockResolvedValue([{ id: 3, name: 'Lab Draw' }]);

    const result = await findServiceByName('LAB');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(1);
    expect(searchServicesByName).toHaveBeenCalledWith('LAB');
  });

  test('returns empty array when nothing matches', async () => {
    searchServicesByName.mockResolvedValue([]);

    const result = await findServiceByName('zzzzz');
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });

  test('fails when query is empty', async () => {
    const result = await findServiceByName('');
    expect(result.success).toBe(false);
    expect(searchServicesByName).not.toHaveBeenCalled();
  });

  test('fails when query is null', async () => {
    const result = await findServiceByName(null);
    expect(result.success).toBe(false);
  });

  test('fails when query is only whitespace', async () => {
    const result = await findServiceByName('   ');
    expect(result.success).toBe(false);
  });
});
