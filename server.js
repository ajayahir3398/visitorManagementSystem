import 'dotenv/config';
import app from './app.js';
import { scheduleSubscriptionUpdates } from './utils/subscriptionCron.js';
import { initCronJobs } from './scripts/cronJobs.js';

const PORT = process.env.PORT || 1111;

// Start cron jobs
scheduleSubscriptionUpdates();
initCronJobs();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
