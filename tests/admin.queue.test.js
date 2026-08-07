import { jest } from '@jest/globals';

jest.mock('../src/backend/data/queueData.js', () => ({
  getWaitingQueueForService: jest.fn(),
  updateQueueEntryStatus: jest.fn(),
  getAllActiveQueues: jest.fn(),
}));

import {
  getWaitingQueueForService,
  updateQueueEntryStatus,
  getAllActiveQueues,
} from '../src/backend/data/queueData.js';

import {
  viewQueue,
  serveNext,
  viewAllQueues,
} from '../src/backend/modules/queue.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('viewQueue', () => {
  const mockQueueData = [
    { id: 1, user_id: 'patient-1', userName: 'Sarah M.', position: 1, duration: 20, serviceName: 'General Checkup', join_time: '2026-07-22T15:02:00.000Z' },
    { id: 2, user_id: 'patient-2', userName: 'James T.', position: 2, duration: 20, serviceName: 'General Checkup', join_time: '2026-07-22T15:08:00.000Z' },
    { id: 3, user_id: 'patient-3', userName: 'Priya K.', position: 3, duration: 20, serviceName: 'General Checkup', join_time: '2026-07-22T15:14:00.000Z' }
  ];

  test('returns sorted queue for a service', async () => {
    getWaitingQueueForService.mockResolvedValue(mockQueueData);

    const result = await viewQueue(1);
    expect(result.success).toBe(true);
    expect(result.data.serviceName).toBe('General Checkup');
    expect(result.data.totalWaiting).toBe(3);
    expect(result.data.queue.length).toBe(3);
  });

  test('each entry includes a position starting at 1', async () => {
    getWaitingQueueForService.mockResolvedValue(mockQueueData);
    
    const result = await viewQueue(1);
    const positions = result.data.queue.map((e) => e.position);
    expect(positions).toEqual([1, 2, 3]);
  });

  test('estimated wait time equals position * service duration', async () => {
    getWaitingQueueForService.mockResolvedValue(mockQueueData);

    const result = await viewQueue(1);
    result.data.queue.forEach((entry) => {
      const expected = `${entry.position * 20} min`;
      expect(entry.estimatedWaitTime).toBe(expected);
    });
  });

  test('returns empty queue array when no one is waiting', async () => {
    getWaitingQueueForService.mockResolvedValue([]);

    const result = await viewQueue(1);
    expect(result.success).toBe(true);
    expect(result.data.totalWaiting).toBe(0);
    expect(result.data.queue.length).toBe(0);
  });

  test('fails when serviceId is missing', async () => {
    const result = await viewQueue(undefined);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('serviceId is required.');
  });
});

describe('serveNext', () => {
  const mockQueueData = [
    { id: 1, user_id: 'patient-1', serviceName: 'General Checkup' },
    { id: 2, user_id: 'patient-2', serviceName: 'General Checkup' }
  ];

  test('serves the first patient in the queue', async () => {
    getWaitingQueueForService.mockResolvedValue(mockQueueData);
    updateQueueEntryStatus.mockResolvedValue(true);

    const result = await serveNext(1);
    expect(result.success).toBe(true);
    expect(result.data.userId).toBe('patient-1');
    expect(result.data.status).toBe('served');
    
    // Verify it asked the database to update the correct patient
    expect(updateQueueEntryStatus).toHaveBeenCalledWith(1, 'served');
  });

  test('includes the service name in the response', async () => {
    getWaitingQueueForService.mockResolvedValue(mockQueueData);
    updateQueueEntryStatus.mockResolvedValue(true);

    const result = await serveNext(1);
    expect(result.data.serviceName).toBe('General Checkup');
  });

  test('fails when no patients are waiting', async () => {
    getWaitingQueueForService.mockResolvedValue([]);
    
    const result = await serveNext(1);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('No patients waiting');
  });

  test('fails when serviceId is missing', async () => {
    const result = await serveNext(undefined);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('serviceId is required.');
  });
});

describe('viewAllQueues', () => {
  const mockAllQueues = [
    { id: 1, serviceId: 1, user_id: 'patient-1', userName: 'Sarah M.', position: 1, duration: 20, serviceName: 'General Checkup', join_time: '2026-07-22T15:02:00.000Z' },
    { id: 2, serviceId: 1, user_id: 'patient-2', userName: 'James T.', position: 2, duration: 20, serviceName: 'General Checkup', join_time: '2026-07-22T15:08:00.000Z' },
    { id: 4, serviceId: 2, user_id: 'patient-4', userName: 'Michael B.', position: 1, duration: 10, serviceName: 'Vaccination', join_time: '2026-07-22T15:30:00.000Z' }
  ];

  test('returns data keyed by service id', async () => {
    getAllActiveQueues.mockResolvedValue(mockAllQueues);

    const result = await viewAllQueues();
    expect(result.success).toBe(true);
    expect(result.data[1]).toBeDefined();
    expect(result.data[2]).toBeDefined();
  });

  test('each service entry has an open flag', async () => {
    getAllActiveQueues.mockResolvedValue(mockAllQueues);

    const result = await viewAllQueues();
    Object.values(result.data).forEach((svc) => {
      expect(svc.open).toBe(true);
    });
  });

  test('patients array length matches waiting entries', async () => {
    getAllActiveQueues.mockResolvedValue(mockAllQueues);

    const result = await viewAllQueues();
    expect(result.data[1].patients.length).toBe(2);
    expect(result.data[2].patients.length).toBe(1);
  });

  test('first patient has status "Next up"', async () => {
    getAllActiveQueues.mockResolvedValue(mockAllQueues);

    const result = await viewAllQueues();
    expect(result.data[1].patients[0].status).toBe('Next up');
  });

  test('non-first patients have status "Waiting"', async () => {
    getAllActiveQueues.mockResolvedValue(mockAllQueues);

    const result = await viewAllQueues();
    expect(result.data[1].patients[1].status).toBe('Waiting');
  });

  test('wait field contains estimated time string', async () => {
    getAllActiveQueues.mockResolvedValue(mockAllQueues);

    const result = await viewAllQueues();
    result.data[1].patients.forEach((p) => {
      expect(p.wait).toMatch(/~\d+ min/);
    });
  });
});