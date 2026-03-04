import prisma from '../lib/prisma.js';

export const SuperAdminActionService = {
  lockSociety: async (societyId) => {
    if (isNaN(societyId)) throw { status: 400, message: 'Invalid society ID' };

    const society = await prisma.society.findUnique({
      where: { id: societyId },
      include: { subscriptions: true },
    });

    if (!society) throw { status: 404, message: 'Society not found' };

    await prisma.$transaction(async (tx) => {
      await tx.society.update({
        where: { id: societyId },
        data: { status: 'EXPIRED' },
      });

      if (society.subscriptions.length > 0) {
        await tx.subscription.updateMany({
          where: { societyId },
          data: { status: 'LOCKED' },
        });
      }
    });

    return { societyName: society.name };
  },

  unlockSociety: async (societyId) => {
    if (isNaN(societyId)) throw { status: 400, message: 'Invalid society ID' };

    const society = await prisma.society.findUnique({
      where: { id: societyId },
      include: {
        subscriptions: {
          include: { plan: true },
        },
      },
    });

    if (!society) throw { status: 404, message: 'Society not found' };

    let newStatus = 'ACTIVE';
    if (society.subscriptions.length > 0) {
      const currentPlan = society.subscriptions[0].plan;
      if (currentPlan && currentPlan.code === 'TRIAL') {
        newStatus = 'TRIAL';
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.society.update({
        where: { id: societyId },
        data: { status: 'ACTIVE' },
      });

      if (society.subscriptions.length > 0) {
        await tx.subscription.updateMany({
          where: { societyId },
          data: { status: newStatus },
        });
      }
    });

    return { societyName: society.name, newStatus };
  },

  extendSubscription: async (societyId, days) => {
    if (isNaN(societyId)) throw { status: 400, message: 'Invalid society ID' };

    if (!days || days <= 0 || days > 365) {
      throw { status: 400, message: 'Days must be a positive number between 1 and 365' };
    }

    const subscription = await prisma.subscription.findFirst({
      where: { societyId },
      include: { society: true, plan: true },
    });

    if (!subscription) throw { status: 404, message: 'No subscription found for this society' };

    const currentExpiry = subscription.expiryDate || new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + parseInt(days));

    const newStatus = subscription.plan?.code === 'TRIAL' ? 'TRIAL' : 'ACTIVE';

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { expiryDate: newExpiry, status: newStatus },
    });

    if (subscription.society.status !== 'ACTIVE') {
      await prisma.society.update({
        where: { id: societyId },
        data: { status: 'ACTIVE' },
      });
    }

    return {
      subscriptionId: updated.id,
      societyName: subscription.society.name,
      planCode: subscription.plan?.code,
      newExpiry,
      newStatus: updated.status,
    };
  },
};
