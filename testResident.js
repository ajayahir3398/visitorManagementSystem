import * as dotenv from 'dotenv';
dotenv.config();

import prisma from './lib/prisma.js';
import { sendNotificationToUnitResidents } from './utils/notificationHelper.js';

async function testNotif() {
  try {
    const unitMember = await prisma.unitMember.findFirst();
    if (!unitMember) {
      console.log('No unit members found in database.');
      process.exit(0);
    }

    console.log(`Testing notification for unit ID: ${unitMember.unitId}`);

    const result = await sendNotificationToUnitResidents(
      unitMember.unitId,
      'New Visitor Request Test',
      'Test is waiting at gate',
      { type: 'visitor_request', data: 'test', screen: 'visitor_log_detail' }
    );

    console.log('Notification helper result:', result);

    const latests = await prisma.notification.findMany({
      where: { userId: unitMember.userId },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    console.log('Latest DB notifications for user:', latests);

    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testNotif();
