import 'dotenv/config';
import { initServiceTable } from './src/backend/data/serviceDb.js';
import { initNotificationTable } from './src/backend/data/notificationDb.js';
import { initQueueTables } from './src/backend/data/queueData.js';

await initServiceTable();
console.log('services table created!');

await initNotificationTable();
console.log('notifications table created!');

await initQueueTables();
console.log('queue tables created!');

console.log('All tables initialized successfully.');
process.exit(0);