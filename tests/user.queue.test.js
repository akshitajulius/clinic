import { jest } from '@jest/globals';

// Mock your new database helper
jest.mock('../src/backend/data/queueData.js', () => ({
  getOpenQueueByServiceId: jest.fn(),
  createQueue: jest.fn(),
  getWaitingCount: jest.fn(),
  insertQueueEntry: jest.fn(),
  updateQueueEntryStatus: jest.fn(),
  getUserQueueEntry: jest.fn(),
  getAllActiveQueues: jest.fn(),
}));

import {
  getOpenQueueByServiceId,
  createQueue,
  getWaitingCount,
  insertQueueEntry,
  updateQueueEntryStatus,
  getUserQueueEntry,
  getAllActiveQueues
} from '../src/backend/data/queueData.js';

import { 
  joinQueue, 
  leaveQueue, 
  getQueuePosition, 
  getAlternativeServiceRecommendation
} from '../src/backend/modules/queue.js';

// Clear the database mocks before each test instead of clearing the old array
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Queue Management - Patient Logic', () => {
  
  test('should successfully add a user to the queue', async () => {
    // Tell the mock database exactly what to return when asked
    getOpenQueueByServiceId.mockResolvedValue({ id: 10 }); 
    getWaitingCount.mockResolvedValue(0); 
    insertQueueEntry.mockResolvedValue(100); // Returns a mock ticket ID of 100

    const result = await joinQueue({ userId: 'patient-1', serviceId: 1 });
    
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('waiting');
    expect(result.data.id).toBe(100);
    expect(result.data.position).toBe(1);
    
    // Verify your backend actually sent the correct data to the database
    expect(insertQueueEntry).toHaveBeenCalledWith(10, 'patient-1', 1);
  });

  test('should fail validation if required fields are missing', async () => {
    const result = await joinQueue({ serviceId: 1 }); // Missing userId
    expect(result.success).toBe(false);
  });

  test('should return error if database fails during join', async () => {
    // Simulate a database crash to test your new try/catch blocks
    getOpenQueueByServiceId.mockRejectedValue(new Error('DB Connection Failed'));
    
    const result = await joinQueue({ userId: 'patient-1', serviceId: 1 });
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('An error occurred while joining the queue.');
  });

  test('should successfully remove a user when leaving the queue', async () => {
    updateQueueEntryStatus.mockResolvedValue(true);
    
    const result = await leaveQueue(100);
    expect(result.success).toBe(true);
    expect(updateQueueEntryStatus).toHaveBeenCalledWith(100, 'canceled');
  });

  test('should accurately calculate estimated wait time based on queue position', async () => {
    // Mock the database returning a user at position 2 for a 20-minute service
    getUserQueueEntry.mockResolvedValue({
      position: 2,
      duration: 20
    });

    const result = await getQueuePosition('patient-2', 1);
    expect(result.success).toBe(true);
    expect(result.data.position).toBe(2);
    expect(result.data.estimatedWaitTime).toBe('40 min');
  });

  test('should return error if user is not in the queue', async () => {
    // Mock the database finding no record of the patient
    getUserQueueEntry.mockResolvedValue(null);

    const result = await getQueuePosition('patient-unknown', 1);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('User is not currently in this queue.');
  });
  
});

// Smart Feature Tests
describe('Smart Feature: getAlternativeServiceRecommendation', () => {
  
  test('should recommend the alternative service with the absolute shortest wait time', async () => {
    // 1. Mock the database response to simulate 3 different active queues
    const mockActiveQueues = [
      { serviceId: 1, serviceName: 'General Checkup', position: 3, duration: 10 }, // Target: 30 min wait
      { serviceId: 2, serviceName: 'Lab Test', position: 1, duration: 5 },         // Alternative 1: 5 min wait (Winner)
      { serviceId: 3, serviceName: 'X-Ray', position: 5, duration: 15 }            // Alternative 2: 75 min wait
    ];
    
    getAllActiveQueues.mockResolvedValue(mockActiveQueues);

    // 2. Run the function, pretending the user is looking at serviceId 1
    const result = await getAlternativeServiceRecommendation(1);

    // 3. Verify it picked Service 2
    expect(result).not.toBeNull();
    expect(result.success).toBe(true);
    expect(result.data.serviceId).toBe(2);
    expect(result.data.estimatedWaitTime).toBe('5 min');
    expect(result.data.message).toContain('shorter line');
  });

  test('should return null if there are no other alternative services active', async () => {
    // 1. Mock the database so only the target service is active
    getAllActiveQueues.mockResolvedValue([
      { serviceId: 1, serviceName: 'General Checkup', position: 3, duration: 10 }
    ]);

    // 2. Run the function
    const result = await getAlternativeServiceRecommendation(1);

    // 3. Verify it gracefully returns null instead of crashing
    expect(result).toBeNull();
  });

  test('should fail silently and return an error object if the database crashes', async () => {
    // 1. Force the database mock to throw an error
    getAllActiveQueues.mockRejectedValue(new Error('MySQL Connection Lost'));

    // 2. Run the function
    const result = await getAlternativeServiceRecommendation(1);

    // 3. Verify it caught the error
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Failed to fetch recommendation');
  });
  
});