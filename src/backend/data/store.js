export const services = [
  { id: 1, name: "General Checkup", description: "Routine health assessment", duration: 20, priority: "high", avgWait: "18 min" },
  { id: 2, name: "Vaccination", description: "Immunization services", duration: 10, priority: "medium", avgWait: "5 min" },
  { id: 3, name: "Lab Draw", description: "Blood work collection", duration: 15, priority: "medium", avgWait: "—" },
];

export const queues = [];

let nextId = { service: 4, queue: 1 };

export function generateId(type) {
  return nextId[type]++;
}
