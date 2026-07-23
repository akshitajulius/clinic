import { queues, services, generateId } from "../data/store.js";
import { validateRequired } from "../data/validators.js";

// --- Patient/User join and leave functions ---

export function joinQueue(data) {
  // Validate required inputs
  const validation = validateRequired(["userId", "serviceId"], data);
  if (!validation.valid) {
    return { success: false, errors: [validation.error] };
  }

  // Check if the service actually exists
  const service = services.find((s) => s.id === data.serviceId);
  if (!service) {
    return { success: false, errors: ["Service not found."] };
  }

  // Prevent user from joining the same service queue twice
  const alreadyInQueue = queues.find(
    (q) => q.userId === data.userId && q.serviceId === data.serviceId && q.status === "waiting"
  );
  if (alreadyInQueue) {
    return { success: false, errors: ["You are already in this queue."] };
  }

  const newEntry = {
    id: generateId("queue"),
    userId: data.userId,
    userName: data.userName || "Patient",
    serviceId: data.serviceId,
    priority: data.priority || service.priority || "low",
    status: "waiting",
    joinedAt: new Date().toISOString(),
  };

  queues.push(newEntry);
  return { success: true, data: newEntry };
}

export function leaveQueue(queueId) {
  // Find the exact queue ticket and remove it
  const index = queues.findIndex((q) => q.id === queueId);
  if (index === -1) {
    return { success: false, errors: ["Queue entry not found."] };
  }

  const removed = queues.splice(index, 1)[0];
  return { success: true, data: removed };
}
// Marker to indicate the end of user/patient functions

export function viewQueue(serviceId) {
  if (serviceId === undefined || serviceId === null) {
    return { success: false, errors: ["serviceId is required."] };
  }

  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return { success: false, errors: ["Service not found."] };
  }

  const serviceQueue = queues.filter(
    (q) => q.serviceId === serviceId && q.status === "waiting"
  );

  const priorityWeight = { high: 3, medium: 2, low: 1 };

  serviceQueue.sort((a, b) => {
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  return {
    success: true,
    data: {
      serviceName: service.name,
      totalWaiting: serviceQueue.length,
      queue: serviceQueue.map((entry, idx) => ({
        ...entry,
        position: idx + 1,
        estimatedWaitTime: `${(idx + 1) * service.duration} min`,
      })),
    },
  };
}

export function serveNext(serviceId) {
  if (serviceId === undefined || serviceId === null) {
    return { success: false, errors: ["serviceId is required."] };
  }

  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return { success: false, errors: ["Service not found."] };
  }

  const serviceQueue = queues.filter(
    (q) => q.serviceId === serviceId && q.status === "waiting"
  );

  if (serviceQueue.length === 0) {
    return { success: false, errors: ["No patients waiting in this queue."] };
  }

  const priorityWeight = { high: 3, medium: 2, low: 1 };

  serviceQueue.sort((a, b) => {
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  const nextEntry = serviceQueue[0];

  const idx = queues.findIndex((q) => q.id === nextEntry.id);
  queues[idx].status = "served";
  queues[idx].servedAt = new Date().toISOString();

  return {
    success: true,
    data: {
      ...queues[idx],
      serviceName: service.name,
    },
  };
}

//  getQueuePosition function
export function getQueuePosition(userId, serviceId) {
  // Find the specific user's ticket
  const userEntry = queues.find(
    (q) => q.userId === userId && q.serviceId === serviceId && q.status === "waiting"
  );
  if (!userEntry) {
    return { success: false, errors: ["User is not currently in this queue."] };
  }

  // Filter the queue to only show waiting patients for THIS service
  const serviceQueue = queues.filter((q) => q.serviceId === serviceId && q.status === "waiting");

  // Sorting Logic: Priority first, then Arrival Time
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  
  serviceQueue.sort((a, b) => {
    // Check priority weights
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority]; // Higher priority goes first
    }
    // If priorities are equal, sort by arrival time (older goes first)
    return new Date(a.joinedAt) - new Date(b.joinedAt);
  });

  // Find the user's index in this sorted list (Add 1 because arrays start at 0)
  const position = serviceQueue.findIndex((q) => q.id === userEntry.id) + 1;
  
  // Calculate estimated wait time (Position * Service Duration)
  const service = services.find((s) => s.id === serviceId);
  const estimatedWaitTime = position * service.duration;

  return { 
    success: true, 
    data: { position, estimatedWaitTime: `${estimatedWaitTime} min` } 
  };
}

function formatQueueTime(isoString) {
  const date = new Date(isoString);
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function viewAllQueues() {
  const result = {};

  for (const service of services) {
    const serviceQueue = queues.filter(
      (q) => q.serviceId === service.id && q.status === "waiting"
    );

    const priorityWeight = { high: 3, medium: 2, low: 1 };
    serviceQueue.sort((a, b) => {
      if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    });

    result[service.id] = {
      open: true,
      patients: serviceQueue.map((entry, idx) => ({
        id: entry.id,
        name: entry.userName,
        position: idx + 1,
        wait: `~${(idx + 1) * service.duration} min`,
        status: idx === 0 ? "Next up" : "Waiting",
        joinedAt: formatQueueTime(entry.joinedAt),
      })),
    };
  }

  return { success: true, data: result };
}