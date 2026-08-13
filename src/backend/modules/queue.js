import { queues, services, generateId } from "../data/store.js";
import { validateRequired } from "../data/validators.js";
import { 
  getOpenQueueByServiceId, 
  createQueue, 
  getWaitingCount, 
  insertQueueEntry, 
  updateQueueEntryStatus,
  getUserQueueEntry,
  getWaitingQueueForService,
  getAllActiveQueues
} from '../data/queueData.js';

// --- Patient/User join and leave functions ---

export async function joinQueue(data) {
  // Validate required inputs
  const validation = validateRequired(["userId", "serviceId"], data);
  if (!validation.valid) {
    return { success: false, errors: [validation.error] };
  }

  try {
    // Find an open queue for this service
    let queue = await getOpenQueueByServiceId(data.serviceId);
    let queueId;

    // If the clinic just opened and no queue exists yet, create one
    if (!queue) {
      queueId = await createQueue(data.serviceId);
    } else {
      queueId = queue.id;
    }

    // Determine their position by checking how many people are already waiting
    const currentWaiters = await getWaitingCount(queueId);
    const position = currentWaiters + 1;

    // Insert the patient into the database
    const entryId = await insertQueueEntry(queueId, data.userId, position, data.userName || '');

    // Return the new database ID and their spot in line
    return { 
      success: true, 
      data: { 
        id: entryId, 
        position: position, 
        status: 'waiting' 
      } 
    };

  } catch (error) {
    console.error("Database Error in joinQueue:", error);
    return { success: false, errors: ['An error occurred while joining the queue.'] };
  }
}

export async function leaveQueue(entryId) {
  if (!entryId) {
    return { success: false, errors: ['Entry ID is required.'] };
  }

  try {
    // Update the row in the MySQL database
    await updateQueueEntryStatus(entryId, 'canceled');
    
    return { success: true };
  } catch (error) {
    console.error("Database Error in leaveQueue:", error);
    return { success: false, errors: ['An error occurred while leaving the queue.'] };
  }
}
// Marker to indicate the end of user/patient functions

export async function viewQueue(serviceId) {
  if (serviceId === undefined || serviceId === null) {
    return { success: false, errors: ["serviceId is required."] };
  }

  try {
    const serviceQueue = await getWaitingQueueForService(serviceId);
    
    if (serviceQueue.length === 0) {
      return { success: true, data: { totalWaiting: 0, queue: [] } };
    }

    return {
      success: true,
      data: {
        serviceName: serviceQueue[0].serviceName,
        totalWaiting: serviceQueue.length,
        queue: serviceQueue.map((entry) => ({
          id: entry.id,
          userId: entry.user_id,
          userName: entry.userName,
          position: entry.position,
          estimatedWaitTime: `${entry.position * entry.duration} min`,
          joinedAt: entry.join_time
        })),
      },
    };
  } catch (error) {
    console.error("Database Error in viewQueue:", error);
    return { success: false, errors: ["Failed to fetch the queue."] };
  }
}

export async function serveNext(serviceId) {
  if (serviceId === undefined || serviceId === null) {
    return { success: false, errors: ["serviceId is required."] };
  }

  try {
    const serviceQueue = await getWaitingQueueForService(serviceId);

    if (serviceQueue.length === 0) {
      return { success: false, errors: ["No patients waiting in this queue."] };
    }

    // Grab the first person in line
    const nextEntry = serviceQueue[0];

    // Update their status in the database to served
    await updateQueueEntryStatus(nextEntry.id, 'served');

    return {
      success: true,
      data: {
        id: nextEntry.id,
        userId: nextEntry.user_id,
        serviceName: nextEntry.serviceName,
        status: 'served'
      },
    };
  } catch (error) {
    console.error("Database Error in serveNext:", error);
    return { success: false, errors: ["Failed to serve the next patient."] };
  }
}

//  getQueuePosition function
export async function getQueuePosition(userId, serviceId) {
  try {
    const userEntry = await getUserQueueEntry(userId, serviceId);
    
    if (!userEntry) {
      return { success: false, errors: ["User is not currently in this queue."] };
    }

    // Calculate estimated wait time (Database Position * Service Duration)
    const estimatedWaitTime = userEntry.position * userEntry.duration;

    return { 
      success: true, 
      data: { position: userEntry.position, estimatedWaitTime: `${estimatedWaitTime} min` } 
    };
  } catch (error) {
    console.error("Database Error in getQueuePosition:", error);
    return { success: false, errors: ["Failed to get queue position."] };
  }
}

function formatQueueTime(dateString) {
  const date = new Date(dateString);
  let h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export async function viewAllQueues() {
  try {
    const allWaiting = await getAllActiveQueues();
    const result = {};

    // Group the raw database rows into the format the UI expects
    for (const entry of allWaiting) {
      if (!result[entry.serviceId]) {
        result[entry.serviceId] = { open: true, patients: [] };
      }

      result[entry.serviceId].patients.push({
        id: entry.id,
        name: entry.userName,
        position: entry.position,
        wait: `~${entry.position * entry.duration} min`,
        status: entry.position === 1 ? "Next up" : "Waiting",
        joinedAt: formatQueueTime(entry.join_time),
      });
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("Database Error in viewAllQueues:", error);
    return { success: false, errors: ["Failed to fetch all queues."] };
  }
}