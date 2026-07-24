import {
  viewQueue,
  serveNext,
  viewAllQueues,
} from '../src/backend/modules/queue.js';
import { queues, services } from '../src/backend/data/store.js';

const SEED_SERVICES = [
  { id: 1, name: 'General Checkup', description: 'Routine health assessment', duration: 20, priority: 'high', avgWait: '18 min' },
  { id: 2, name: 'Vaccination', description: 'Immunization services', duration: 10, priority: 'medium', avgWait: '5 min' },
  { id: 3, name: 'Lab Draw', description: 'Blood work collection', duration: 15, priority: 'medium', avgWait: '—' },
];

const SEED_QUEUES = [
  { id: 1, userId: 'patient-1', userName: 'Sarah M.', serviceId: 1, priority: 'high', status: 'waiting', joinedAt: '2026-07-22T15:02:00.000Z' },
  { id: 2, userId: 'patient-2', userName: 'James T.', serviceId: 1, priority: 'high', status: 'waiting', joinedAt: '2026-07-22T15:08:00.000Z' },
  { id: 3, userId: 'patient-3', userName: 'Priya K.', serviceId: 1, priority: 'high', status: 'waiting', joinedAt: '2026-07-22T15:14:00.000Z' },
  { id: 4, userId: 'patient-4', userName: 'Michael B.', serviceId: 2, priority: 'medium', status: 'waiting', joinedAt: '2026-07-22T15:30:00.000Z' },
];

function resetStore() {
  services.length = 0;
  SEED_SERVICES.forEach((s) => services.push({ ...s }));
  queues.length = 0;
  SEED_QUEUES.forEach((q) => queues.push({ ...q }));
}

beforeEach(() => {
  resetStore();
});

describe('viewQueue', () => {
  test('returns sorted queue for a service', () => {
    const result = viewQueue(1);
    expect(result.success).toBe(true);
    expect(result.data.serviceName).toBe('General Checkup');
    expect(result.data.totalWaiting).toBe(3);
    expect(result.data.queue.length).toBe(3);
  });

  test('each entry includes a position starting at 1', () => {
    const result = viewQueue(1);
    const positions = result.data.queue.map((e) => e.position);
    expect(positions).toEqual([1, 2, 3]);
  });

  test('each entry includes an estimated wait time', () => {
    const result = viewQueue(1);
    result.data.queue.forEach((entry) => {
      expect(entry.estimatedWaitTime).toMatch(/\d+ min/);
    });
  });

  test('estimated wait time equals position * service duration', () => {
    const result = viewQueue(1);
    result.data.queue.forEach((entry) => {
      const expected = `${entry.position * 20} min`;
      expect(entry.estimatedWaitTime).toBe(expected);
    });
  });

  test('excludes entries with status other than waiting', () => {
    queues[0].status = 'served';
    const result = viewQueue(1);
    expect(result.data.totalWaiting).toBe(2);
  });

  test('sorts by priority first, then by arrival time', () => {
    queues.push({
      id: 10,
      userId: 'patient-10',
      userName: 'VIP',
      serviceId: 2,
      priority: 'high',
      status: 'waiting',
      joinedAt: '2026-07-22T15:35:00.000Z',
    });
    const result = viewQueue(2);
    expect(result.data.queue[0].userName).toBe('VIP');
    expect(result.data.queue[1].userName).toBe('Michael B.');
  });

  test('patients with same priority are sorted by arrival time', () => {
    const result = viewQueue(1);
    const names = result.data.queue.map((e) => e.userName);
    expect(names).toEqual(['Sarah M.', 'James T.', 'Priya K.']);
  });

  test('returns empty queue array when no one is waiting', () => {
    queues.length = 0;
    const result = viewQueue(1);
    expect(result.success).toBe(true);
    expect(result.data.totalWaiting).toBe(0);
    expect(result.data.queue.length).toBe(0);
  });

  test('fails when serviceId is missing', () => {
    const result = viewQueue(undefined);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('serviceId');
  });

  test('fails when serviceId is null', () => {
    const result = viewQueue(null);
    expect(result.success).toBe(false);
  });

  test('fails when service does not exist', () => {
    const result = viewQueue(999);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Service not found');
  });
});

describe('serveNext', () => {
  test('serves the first patient in the queue', () => {
    const result = serveNext(1);
    expect(result.success).toBe(true);
    expect(result.data.userName).toBe('Sarah M.');
    expect(result.data.status).toBe('served');
    expect(result.data.servedAt).toBeDefined();
  });

  test('includes the service name in the response', () => {
    const result = serveNext(1);
    expect(result.data.serviceName).toBe('General Checkup');
  });

  test('marks the served entry in the store', () => {
    serveNext(1);
    const entry = queues.find((q) => q.id === 1);
    expect(entry.status).toBe('served');
  });

  test('subsequent call serves the next patient', () => {
    serveNext(1);
    const result = serveNext(1);
    expect(result.success).toBe(true);
    expect(result.data.userName).toBe('James T.');
  });

  test('serves highest priority patient first', () => {
    queues.push({
      id: 20,
      userId: 'patient-20',
      userName: 'Low Priority',
      serviceId: 1,
      priority: 'low',
      status: 'waiting',
      joinedAt: '2026-07-22T14:00:00.000Z',
    });
    const result = serveNext(1);
    expect(result.data.userName).toBe('Sarah M.');
  });

  test('when priorities are equal, serves earliest arrival first', () => {
    const first = serveNext(1);
    const second = serveNext(1);
    const third = serveNext(1);
    expect(first.data.userName).toBe('Sarah M.');
    expect(second.data.userName).toBe('James T.');
    expect(third.data.userName).toBe('Priya K.');
  });

  test('fails when no patients are waiting', () => {
    queues.length = 0;
    const result = serveNext(1);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('No patients waiting');
  });

  test('fails when serviceId is missing', () => {
    const result = serveNext(undefined);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('serviceId');
  });

  test('fails when serviceId is null', () => {
    const result = serveNext(null);
    expect(result.success).toBe(false);
  });

  test('fails when service does not exist', () => {
    const result = serveNext(999);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Service not found');
  });

  test('does not serve already-served entries', () => {
    queues.forEach((q) => { if (q.serviceId === 1) q.status = 'served'; });
    const result = serveNext(1);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('No patients waiting');
  });
});

describe('viewAllQueues', () => {
  test('returns data keyed by service id', () => {
    const result = viewAllQueues();
    expect(result.success).toBe(true);
    expect(result.data[1]).toBeDefined();
    expect(result.data[2]).toBeDefined();
    expect(result.data[3]).toBeDefined();
  });

  test('each service entry has an open flag', () => {
    const result = viewAllQueues();
    Object.values(result.data).forEach((svc) => {
      expect(svc.open).toBe(true);
    });
  });

  test('patients array length matches waiting entries', () => {
    const result = viewAllQueues();
    expect(result.data[1].patients.length).toBe(3);
    expect(result.data[2].patients.length).toBe(1);
    expect(result.data[3].patients.length).toBe(0);
  });

  test('patient entries include position, name, wait, and status', () => {
    const result = viewAllQueues();
    const patient = result.data[1].patients[0];
    expect(patient.position).toBeDefined();
    expect(patient.name).toBeDefined();
    expect(patient.wait).toBeDefined();
    expect(patient.status).toBeDefined();
  });

  test('first patient has status "Next up"', () => {
    const result = viewAllQueues();
    expect(result.data[1].patients[0].status).toBe('Next up');
  });

  test('non-first patients have status "Waiting"', () => {
    const result = viewAllQueues();
    expect(result.data[1].patients[1].status).toBe('Waiting');
    expect(result.data[1].patients[2].status).toBe('Waiting');
  });

  test('patients are sorted by priority then arrival time', () => {
    queues.push({
      id: 30,
      userId: 'patient-30',
      userName: 'Low Guy',
      serviceId: 1,
      priority: 'low',
      status: 'waiting',
      joinedAt: '2026-07-22T14:50:00.000Z',
    });
    const result = viewAllQueues();
    const names = result.data[1].patients.map((p) => p.name);
    expect(names[names.length - 1]).toBe('Low Guy');
  });

  test('wait field contains estimated time string', () => {
    const result = viewAllQueues();
    result.data[1].patients.forEach((p) => {
      expect(p.wait).toMatch(/~\d+ min/);
    });
  });

  test('joinedAt is formatted as human-readable time', () => {
    const result = viewAllQueues();
    result.data[1].patients.forEach((p) => {
      expect(p.joinedAt).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });
  });
});
