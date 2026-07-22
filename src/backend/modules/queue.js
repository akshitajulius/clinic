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

  // Create the queue entry
  const newEntry = {
    id: generateId("queue"),
    userId: data.userId,
    serviceId: data.serviceId,
    // Inherit the priority from the service, or allow an override if applicable
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
}

export function serveNext(serviceId) {
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