import 'dotenv/config';
import { initNotificationTable } from './src/backend/data/notificationDb.js';

await initNotificationTable();
console.log('notifications table created!');
process.exit(0);