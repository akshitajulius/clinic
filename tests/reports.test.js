import { jest } from '@jest/globals';

jest.mock('../src/backend/data/notificationDb.js', () => ({
  selectHistoryByUser: jest.fn(),
  selectHistoryByService: jest.fn(),
  getUsageSummaryFromDb: jest.fn()
}));

import {
  selectHistoryByUser,
  selectHistoryByService,
  getUsageSummaryFromDb
} from '../src/backend/data/notificationDb.js';

import {
  generateUserParticipationReport,
  generateServiceActivityReport,
  generateQueueStatisticsReport,
  exportReportCSV,
  generatePDFReport
} from '../src/backend/modules/reports.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Reporting Module', () => {

  test('generates user participation report', async () => {

    selectHistoryByUser.mockResolvedValue([
      { id: 1 },
      { id: 2 }
    ]);

    const result =
      await generateUserParticipationReport(
        'user1'
      );

    expect(result.success).toBe(true);
    expect(result.data.totalActivities)
      .toBe(2);

  });

  test('requires userId', async () => {

    const result =
      await generateUserParticipationReport();

    expect(result.success)
      .toBe(false);

  });

  test('generates service activity report', async () => {

    selectHistoryByService.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 }
    ]);

    const result =
      await generateServiceActivityReport(
        'Dental'
      );

    expect(result.success)
      .toBe(true);

    expect(result.data.totalActivities)
      .toBe(3);

  });

  test('requires serviceName', async () => {

    const result =
      await generateServiceActivityReport();

    expect(result.success)
      .toBe(false);

  });

  test('generates queue statistics report', async () => {

    getUsageSummaryFromDb.mockResolvedValue([
      {
        type: 'update',
        count: 5
      }
    ]);

    const result =
      await generateQueueStatisticsReport();

    expect(result.success)
      .toBe(true);

  });

  test('exports csv', () => {

    const csv = exportReportCSV([
      {
        userId: 1,
        totalActivities: 2
      }
    ]);

    expect(csv)
      .toContain('userId');

    expect(csv)
      .toContain('totalActivities');

  });

  test('generates pdf report', async () => {

    const filePath =
      await generatePDFReport(
        'Test Report',
        { totalUsers: 5 },
        './test-report.pdf'
      );

    expect(filePath)
      .toBe('./test-report.pdf');

  });

});