import { jest } from '@jest/globals';

// Mock your database helpers
jest.mock('../src/backend/data/queueData.js', () => ({
  getOpenQueueByServiceId: jest.fn(),
  createQueue: jest.fn(),
  getWaitingCount: jest.fn(),
  insertQueueEntry: jest.fn(),
  updateQueueEntryStatus: jest.fn(),
  getUserQueueEntry: jest.fn(),
  getAllActiveQueues: jest.fn(),
}));

// Mock the services module used by the Smart Feature
jest.mock('../src/backend/modules/services.js', () => ({
  listServices: jest.fn()
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

import { listServices } from '../src/backend/modules/services.js';

import { 
  joinQueue, 
  leaveQueue, 
  getQueuePosition, 
  getAlternativeServiceRecommendation
} from '../src/backend/modules/queue.js';

// Clear the database mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Queue Management - Patient Logic', () => {
  
  test('should successfully add a user to the queue', async () => {
    getOpenQueueByServiceId.mockResolvedValue({ id: 10 }); 
    getWaitingCount.mockResolvedValue(0); 
    insertQueueEntry.mockResolvedValue(100); 

    const result = await joinQueue({ userId: 'patient-1', serviceId: 1 });
    
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('waiting');
    expect(result.data.id).toBe(100);
    expect(result.data.position).toBe(1);
    
    // Expect the 4th argument (empty string for userName)
    expect(insertQueueEntry).toHaveBeenCalledWith(10, 'patient-1', 1, '');
  });

  test('should fail validation if required fields are missing', async () => {
    const result = await joinQueue({ serviceId: 1 }); 
    expect(result.success).toBe(false);
  });

  test('should return error if database fails during join', async () => {
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
    getUserQueueEntry.mockResolvedValue(null);

    const result = await getQueuePosition('patient-unknown', 1);
    expect(result.success).toBe(false);
    expect(result.errors[0]).toBe('User is not currently in this queue.');
  });
  
});

// Smart Feature Tests
describe('Smart Feature: getAlternativeServiceRecommendation', () => {
  
  test('should recommend the alternative service with the absolute shortest wait time', async () => {
    // Mock the new listServices function to return dummy wait times
    listServices.mockResolvedValue({
      success: true,
      data: [
        { id: 1, name: 'General Checkup', avgWait: '30 min' }, // Target: 30 min
        { id: 2, name: 'Lab Test', avgWait: '5 min' },         // Alternative 1: 5 min (Winner)
        { id: 3, name: 'X-Ray', avgWait: '75 min' }            // Alternative 2: 75 min
      ]
    });

    const result = await getAlternativeServiceRecommendation(1);

    expect(result).not.toBeNull();
    expect(result.success).toBe(true);
    expect(result.data.serviceId).toBe(2);
    expect(result.data.estimatedWaitTime).toBe('5 min');
    expect(result.data.message).toContain('shorter line');
  });

  test('should return null if there are no other alternative services active', async () => {
    // Mock the database so all alternatives are slower than the target
    listServices.mockResolvedValue({
      success: true,
      data: [
        { id: 1, name: 'General Checkup', avgWait: '10 min' },
        { id: 2, name: 'X-Ray', avgWait: '40 min' } 
      ]
    });

    const result = await getAlternativeServiceRecommendation(1);

    // CHANGED: Expect the structured response instead of a raw null
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  test('should fail silently and return an error object if the database crashes', async () => {
    // Force the listServices mock to throw an error
    listServices.mockRejectedValue(new Error('MySQL Connection Lost'));

    const result = await getAlternativeServiceRecommendation(1);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Failed to fetch recommendation');
  });
  
});