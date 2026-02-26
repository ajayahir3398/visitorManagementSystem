import prisma from '../../lib/prisma.js';

/**
 * Platform Overview Summary
 * GET /api/v1/super-admin/dashboard/summary
 * Access: SUPER_ADMIN only
 */
export const getSummary = async (req, res) => {
  try {
    const [totalSocieties, activeSocieties, trialSocieties, lockedSocieties, totalSocietyAdmins] =
      await Promise.all([
        prisma.society.count(),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({ where: { status: 'TRIAL' } }),
        prisma.subscription.count({ where: { status: 'LOCKED' } }),
        prisma.user.count({
          where: {
            role: {
              name: 'SOCIETY_ADMIN',
            },
          },
        }),
      ]);

    res.json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: {
        totalSocieties,
        activeSocieties,
        trialSocieties,
        lockedSocieties,
        totalSocietyAdmins,
      },
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard summary',
      error: error.message,
    });
  }
};

/**
 * Revenue Summary
 * GET /api/v1/super-admin/dashboard/revenue
 * Access: SUPER_ADMIN only
 */
export const getRevenue = async (req, res) => {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [totalRevenueResult, thisMonthResult, lastMonthResult] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: { gte: thisMonthStart },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: { gte: lastMonthStart, lte: lastMonthEnd },
        },
        _sum: { amount: true },
      }),
    ]);

    // MRR = count of active monthly subscriptions × their plan price
    const activeMonthlySubscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true },
    });

    const mrr = activeMonthlySubscriptions.reduce((sum, sub) => {
      // Normalize yearly plans to monthly
      const monthlyValue =
        sub.plan.billingCycle === 'YEARLY' ? Math.round(sub.plan.price / 12) : sub.plan.price;
      return sum + monthlyValue;
    }, 0);

    res.json({
      success: true,
      message: 'Revenue summary retrieved successfully',
      data: {
        mrr,
        thisMonth: Number(thisMonthResult._sum.amount || 0),
        lastMonth: Number(lastMonthResult._sum.amount || 0),
        totalRevenue: Number(totalRevenueResult._sum.amount || 0),
      },
    });
  } catch (error) {
    console.error('Get revenue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue summary',
      error: error.message,
    });
  }
};

/**
 * Subscription Breakdown
 * GET /api/v1/super-admin/dashboard/subscriptions
 * Access: SUPER_ADMIN only
 */
export const getSubscriptions = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [active, trial, grace, locked, expiringIn7Days] = await Promise.all([
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.count({ where: { status: 'GRACE' } }),
      prisma.subscription.count({ where: { status: 'LOCKED' } }),
      prisma.subscription.count({
        where: {
          status: { in: ['ACTIVE', 'TRIAL'] },
          expiryDate: { lte: sevenDaysFromNow, gte: now },
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Subscription breakdown retrieved successfully',
      data: {
        active,
        trial,
        grace,
        locked,
        expiringIn7Days,
      },
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription breakdown',
      error: error.message,
    });
  }
};

/**
 * Notification Stats
 * GET /api/v1/super-admin/dashboard/notifications
 * Access: SUPER_ADMIN only
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const [total, byType] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: { _all: true },
      }),
    ]);

    // Format type counts into an object
    const typeCounts = {};
    byType.forEach((item) => {
      typeCounts[item.type || 'UNKNOWN'] = item._count._all;
    });

    res.json({
      success: true,
      message: 'Notification stats retrieved successfully',
      data: {
        total,
        byType: typeCounts,
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification stats',
      error: error.message,
    });
  }
};
