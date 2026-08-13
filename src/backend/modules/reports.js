import PDFDocument from 'pdfkit';
import fs from 'fs';

import {
  selectHistoryByUser,
  selectHistoryByService,
  getUsageSummaryFromDb
} from '../data/notificationDb.js';

export async function generateUserParticipationReport(userId) {

  if (!userId) {
    return {
      success: false,
      errors: ['userId is required.']
    };
  }

  const history =
    await selectHistoryByUser(userId);

  return {
    success: true,
    data: {
      userId,
      totalActivities: history.length,
      history
    }
  };
}

export async function generateServiceActivityReport(serviceName) {

  if (!serviceName) {
    return {
      success: false,
      errors: ['serviceName is required.']
    };
  }

  const activity =
    await selectHistoryByService(serviceName);

  return {
    success: true,
    data: {
      serviceName,
      totalActivities: activity.length,
      activity
    }
  };
}

export async function generateQueueStatisticsReport() {

  const summary =
    await getUsageSummaryFromDb();

  return {
    success: true,
    data: summary
  };
}
export async function generatePDFReport(
  title,
  reportData,
  filePath = './report.pdf'
) {

  return new Promise((resolve, reject) => {

    try {

      const doc = new PDFDocument();

      const stream =
        fs.createWriteStream(filePath);

      doc.pipe(stream);

      doc
        .fontSize(20)
        .text('QueueSmart Report');

      doc.moveDown();

      doc
        .fontSize(16)
        .text(title);

      doc.moveDown();

      doc
        .fontSize(12)
        .text(
          JSON.stringify(
            reportData,
            null,
            2
          )
        );

      doc.moveDown();

      doc.text(
        `Generated: ${new Date().toLocaleString()}`
      );

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

    } catch (error) {

      reject(error);

    }

  });

}
export function exportReportCSV(reportData) {

  if (!reportData || reportData.length === 0) {
    return '';
  }

  const headers = Object.keys(reportData[0]);

  const csvRows = [
    headers.join(',')
  ];

  for (const row of reportData) {
    csvRows.push(
      headers.map(h => row[h]).join(',')
    );
  }

  return csvRows.join('\n');
}