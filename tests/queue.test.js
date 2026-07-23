import { joinQueue, leaveQueue, getQueuePosition } from '../src/backend/modules/queue.js';
import { queues } from '../src/backend/data/store.js';

beforeEach(() => {
  queues.length = 0;
});

describe('Queue Management - Patient Logic', () => {
  test('should successfully add a user to the queue', () => {
    const result = joinQueue({ userId: 'patient-1', serviceId: 1 });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('waiting');
    expect(queues.length).toBe(1);
  });

  test('should fail validation if required fields are missing', () => {
    const result = joinQueue({ serviceId: 1 }); // Missing userId
    expect(result.success).toBe(false);
    expect(result.errors[0]).toMatch(/Missing required fields/i);
  });

  test('should prevent a user from joining the same service queue twice', () => {
    joinQueue({ userId: 'patient-1', serviceId: 1 });
    const duplicateResult = joinQueue({ userId: 'patient-1', serviceId: 1 });
    expect(duplicateResult.success).toBe(false);
    expect(duplicateResult.errors[0]).toBe('You are already in this queue.');
  });

  test('should successfully remove a user when leaving the queue', () => {
    const joinResult = joinQueue({ userId: 'patient-2', serviceId: 2 });
    const ticketId = joinResult.data.id;

    const leaveResult = leaveQueue(ticketId);
    expect(leaveResult.success).toBe(true);
    expect(queues.length).toBe(0);
  });

  test('should correctly sort queue position by priority over arrival order', () => {
    // 1. A low-priority patient joins first
    joinQueue({ userId: 'patient-low', serviceId: 1, priority: 'low' });

    // 2. A high-priority patient joins second
    joinQueue({ userId: 'patient-high', serviceId: 1, priority: 'high' });

    // The high-priority patient should jump to position #1 despite arriving later
    const posResult = getQueuePosition('patient-high', 1);
    expect(posResult.success).toBe(true);
    expect(posResult.data.position).toBe(1);
  });

  test('should accurately calculate estimated wait time based on queue position', () => {
    joinQueue({ userId: 'patient-1', serviceId: 1, priority: 'medium' });
    joinQueue({ userId: 'patient-2', serviceId: 1, priority: 'medium' });

    // Patient 2 is #2 in line. General Checkup (serviceId: 1) duration is 20 mins.
    // Est wait should be 2 * 20 = 40 min.
    const posResult = getQueuePosition('patient-2', 1);
    expect(posResult.data.position).toBe(2);
    expect(posResult.data.estimatedWaitTime).toBe('40 min');
  });
});