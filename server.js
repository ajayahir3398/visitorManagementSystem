import 'dotenv/config';
import app from './app.js';
import { scheduleSubscriptionUpdates } from './utils/subscriptionCron.js';

const PORT = process.env.PORT || 1111;

// Start subscription status update scheduler
scheduleSubscriptionUpdates();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
