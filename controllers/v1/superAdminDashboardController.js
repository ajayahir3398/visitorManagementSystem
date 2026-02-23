import prisma from "../../lib/prisma.js";

/**
 * Platform Overview Summary
 * GET /api/v1/super-admin/dashboard/summary
 * Access: SUPER_ADMIN only
 */
export const getSummary = async (req, res) => {
  try {
    const [
      totalSocieties,
      activeSocieties,
      trialSocieties,
      lockedSocieties,
      totalUsers,
      totalVisitors,
    ] = await Promise.all([
      prisma.society.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "TRIAL" } }),
      prisma.subscription.count({ where: { status: "LOCKED" } }),
      prisma.user.count(),
      prisma.visitorLog.count(),
    ]);

    res.json({
      success: true,
      message: "Dashboard summary retrieved successfully",
      data: {
        totalSocieties,
        activeSocieties,
        trialSocieties,
        lockedSocieties,
        totalUsers,
        totalVisitors,
      },
    });
  } catch (error) {
    console.error("Get dashboard summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard summary",
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
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const [totalRevenueResult, thisMonthResult, lastMonthResult] =
      await Promise.all([
        prisma.payment.aggregate({
          where: { status: "SUCCESS" },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: {
            status: "SUCCESS",
            paidAt: { gte: thisMonthStart },
          },
          _sum: { amount: true },
        }),
        prisma.payment.aggregate({
          where: {
            status: "SUCCESS",
            paidAt: { gte: lastMonthStart, lte: lastMonthEnd },
          },
          _sum: { amount: true },
        }),
      ]);

    // MRR = count of active monthly subscriptions × their plan price
    const activeMonthlySubscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    });

    const mrr = activeMonthlySubscriptions.reduce((sum, sub) => {
      // Normalize yearly plans to monthly
      const monthlyValue =
        sub.plan.billingCycle === "YEARLY"
          ? Math.round(sub.plan.price / 12)
          : sub.plan.price;
      return sum + monthlyValue;
    }, 0);

    res.json({
      success: true,
      message: "Revenue summary retrieved successfully",
      data: {
        mrr,
        thisMonth: Number(thisMonthResult._sum.amount || 0),
        lastMonth: Number(lastMonthResult._sum.amount || 0),
        totalRevenue: Number(totalRevenueResult._sum.amount || 0),
      },
    });
  } catch (error) {
    console.error("Get revenue error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve revenue summary",
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
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "TRIAL" } }),
      prisma.subscription.count({ where: { status: "GRACE" } }),
      prisma.subscription.count({ where: { status: "LOCKED" } }),
      prisma.subscription.count({
        where: {
          status: { in: ["ACTIVE", "TRIAL"] },
          expiryDate: { lte: sevenDaysFromNow, gte: now },
        },
      }),
    ]);

    res.json({
      success: true,
      message: "Subscription breakdown retrieved successfully",
      data: {
        active,
        trial,
        grace,
        locked,
        expiringIn7Days,
      },
    });
  } catch (error) {
    console.error("Get subscriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription breakdown",
      error: error.message,
    });
  }
};

/**
 * User Counts by Role
 * GET /api/v1/super-admin/dashboard/users
 * Access: SUPER_ADMIN only
 */
export const getUsers = async (req, res) => {
  try {
    const [societyAdmins, securityGuards, residents] = await Promise.all([
      prisma.user.count({
        where: { role: { name: "SOCIETY_ADMIN" } },
      }),
      prisma.user.count({
        where: { role: { name: "SECURITY" } },
      }),
      prisma.user.count({
        where: { role: { name: "RESIDENT" } },
      }),
    ]);

    res.json({
      success: true,
      message: "User counts retrieved successfully",
      data: {
        societyAdmins,
        securityGuards,
        residents,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user counts",
      error: error.message,
    });
  }
};

/**
 * Visitor Volume (Aggregated)
 * GET /api/v1/super-admin/dashboard/visitors
 * Access: SUPER_ADMIN only
 */
export const getVisitors = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    const [today, thisMonth, lastMonth] = await Promise.all([
      prisma.visitorLog.count({
        where: { entryTime: { gte: todayStart } },
      }),
      prisma.visitorLog.count({
        where: { entryTime: { gte: thisMonthStart } },
      }),
      prisma.visitorLog.count({
        where: { entryTime: { gte: lastMonthStart, lte: lastMonthEnd } },
      }),
    ]);

    res.json({
      success: true,
      message: "Visitor volume retrieved successfully",
      data: {
        today,
        thisMonth,
        lastMonth,
      },
    });
  } catch (error) {
    console.error("Get visitors error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve visitor volume",
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
    const [total, byType] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.groupBy({
        by: ["type"],
        _count: { _all: true },
      }),
    ]);

    // Format type counts into an object
    const typeCounts = {};
    byType.forEach((item) => {
      typeCounts[item.type || "UNKNOWN"] = item._count._all;
    });

    res.json({
      success: true,
      message: "Notification stats retrieved successfully",
      data: {
        total,
        byType: typeCounts,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve notification stats",
      error: error.message,
    });
  }
};
