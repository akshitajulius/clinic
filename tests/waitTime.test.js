import { estimateWaitTime, estimateWaitTimeForQueue } from '../src/backend/modules/waitTime.js';
import { queues, services } from '../src/backend/data/store.js';

// Reset queues before each test
beforeEach(() => {
  queues.length = 0;
  queues.push(
    { id: 1, userId: 'patient-1', userName: 'Sarah M.', serviceId: 1, priority: 'high', status: 'waiting', joinedAt: '2026-07-22T15:02:00.000Z' },
    { id: 2, userId: 'patient-2', userName: 'James T.', serviceId: 1, priority: 'high', status: 'waiting', joinedAt: '2026-07-22T15:08:00.000Z' },
    { id: 3, userId: 'patient-3', userName: 'Priya K.', serviceId: 1, priority: 'high', status: 'waiting', joinedAt: '2026-07-22T15:14:00.000Z' },
    { id: 4, userId: 'patient-4', userName: 'Michael B.', serviceId: 2, priority: 'medium', status: 'waiting', joinedAt: '2026-07-22T15:30:00.000Z' }
  );
}); 

describe('estimateWaitTime', () => {
  test('returns correct position and wait time for first patient', () => {
    const result = estimateWaitTime('patient-1', 1);
    expect(result.success).toBe(true);
    expect(result.data.position).toBe(1);
    expect(result.data.estimatedWaitMinutes).toBe(20); // position 1 × 20 min duration
  });

  test('returns correct position for second patient', () => {
    const result = estimateWaitTime('patient-2', 1);
    expect(result.success).toBe(true);
    expect(result.data.position).toBe(2);
    expect(result.data.estimatedWaitMinutes).toBe(40); // position 2 × 20 min duration
  });

  test('returns error if service does not exist', () => {
    const result = estimateWaitTime('patient-1', 999);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('Service not found.');
  });

  test('returns error if user is not in the queue', () => {
    const result = estimateWaitTime('unknown-user', 1);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('User is not in this queue.');
  });

  test('returns correct service name in response', () => {
    const result = estimateWaitTime('patient-1', 1);
    expect(result.data.serviceName).toBe('General Checkup');
  });

  test('returns correct wait label format', () => {
    const result = estimateWaitTime('patient-1', 1);
    expect(result.data.estimatedWaitLabel).toBe('~20 min');
  });
});

describe('estimateWaitTimeForQueue', () => {
  test('returns estimates for all waiting patients in a service', () => {
    const result = estimateWaitTimeForQueue(1);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(3);
  });

  test('returns correct position order', () => {
    const result = estimateWaitTimeForQueue(1);
    expect(result.data[0].position).toBe(1);
    expect(result.data[1].position).toBe(2);
    expect(result.data[2].position).toBe(3);
  });

  test('returns error if service does not exist', () => {
    const result = estimateWaitTimeForQueue(999);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('Service not found.');
  });

  test('returns empty array if no one is waiting', () => {
    queues.length = 0;
    const result = estimateWaitTimeForQueue(1);
    expect(result.success).toBe(true);
    expect(result.data.length).toBe(0);
  });
});
