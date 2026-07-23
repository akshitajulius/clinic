export const services = [
  { id: 1, name: "General Checkup", description: "Routine health assessment", duration: 20, priority: "high", avgWait: "18 min" },
  { id: 2, name: "Vaccination", description: "Immunization services", duration: 10, priority: "medium", avgWait: "5 min" },
  { id: 3, name: "Lab Draw", description: "Blood work collection", duration: 15, priority: "medium", avgWait: "—" },
];

export const queues = [
  { id: 1, userId: 'patient-1', userName: 'Sarah M.', serviceId: 1, priority: 'high', status: 'waiting', joinedAt: '2026-07-22T15:02:00.000Z' },
  { id: 2, userId: 'patient-2', userName: 'James T.', serviceId: 1, priority: 'high', status: 'waiting', joinedAt: '2026-07-22T15:08:00.000Z' },
  { id: 3, userId: 'patient-3', userName: 'Priya K.', serviceId: 1, priority: 'high', status: 'waiting', joinedAt: '2026-07-22T15:14:00.000Z' },
  { id: 4, userId: 'patient-4', userName: 'Michael B.', serviceId: 2, priority: 'medium', status: 'waiting', joinedAt: '2026-07-22T15:30:00.000Z' },
];

let nextId = { service: 4, queue: 5 };

export function generateId(type) {
  return nextId[type]++;
}
