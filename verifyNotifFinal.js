import prisma from './lib/prisma.js';
import { sendNotificationToUser } from './utils/notificationHelper.js';
import dotenv from 'dotenv';
dotenv.config();

async function verifyNotifications() {
  try {
    const user = await prisma.user.findFirst({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
    });

    if (!user) {
      console.log('No active user found for testing.');
      return;
    }

    console.log(`Testing with user: ${user.name} (ID: ${user.id})`);

    const testTypes = [
      { type: 'visitor_request', title: 'Visitor Request Test' },
      { type: 'emergency', title: 'Emergency Alert Test' },
      { type: 'rule', title: 'New Rule Test' },
      { type: 'notice', title: 'New Notice Test' },
      { type: 'NEW_SOCIETY_REGISTRATION', title: 'Registration Test' },
    ];

    for (const test of testTypes) {
      console.log(`\n--- Testing type: ${test.type} ---`);
      const result = await sendNotificationToUser(
        user.id,
        test.title,
        `Testing ${test.type} storage`,
        { type: test.type, screen: 'test_screen' }
      );
      console.log('Send Result:', result);

      if (result.notificationId) {
        const stored = await prisma.notification.findUnique({
          where: { id: result.notificationId },
        });
        console.log('Stored in DB with type:', stored.type);
      }
    }

    // Check if notifications are stored
    const count = await prisma.notification.count({
      where: { userId: user.id },
    });
    console.log(`\nTotal notifications for user ${user.id}: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verifyNotifications();
