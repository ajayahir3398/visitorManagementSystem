import prisma from '../lib/prisma.js';

export const SocietyAdminDashboardService = {
  getOverview: async (societyId) => {
    const [totalUnits, totalResidents, activeSecurity, openEmergencies, pendingViolations] =
      await Promise.all([
        prisma.unit.count({ where: { societyId, status: 'ACTIVE' } }),
        prisma.unitMember.count({ where: { unit: { societyId } } }),
        prisma.user.count({ where: { societyId, status: 'ACTIVE', role: { name: 'SECURITY' } } }),
        prisma.emergencyRequest.count({
          where: { societyId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
        }),
        prisma.ruleViolation.count({ where: { societyId, status: 'PENDING' } }),
      ]);

    return { totalUnits, totalResidents, activeSecurity, openEmergencies, pendingViolations };
  },

  getMaintenance: async (societyId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [upcomingBills, unpaidBills, overdueBills, collectedThisMonth, overdueAmount] =
      await Promise.all([
        prisma.tempMaintenanceBill.count({ where: { societyId } }),
        prisma.maintenanceBill.count({ where: { societyId, status: 'UNPAID' } }),
        prisma.maintenanceBill.count({
          where: { societyId, status: { in: ['UNPAID', 'OVERDUE'] }, dueDate: { lt: now } },
        }),
        prisma.maintenancePayment.aggregate({
          _sum: { amount: true },
          where: { status: 'SUCCESS', paidAt: { gte: startOfMonth }, bill: { societyId } },
        }),
        prisma.maintenanceBill.aggregate({
          _sum: { amount: true },
          where: { societyId, status: { in: ['UNPAID', 'OVERDUE'] }, dueDate: { lt: now } },
        }),
      ]);

    return {
      upcomingBills,
      unpaidBills,
      overdueBills,
      collectedThisMonth: collectedThisMonth._sum.amount || 0,
      overdueAmount: overdueAmount._sum.amount || 0,
    };
  },

  getVisitors: async (societyId) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayVisitors, pendingApprovals, insidePremises, preApprovedToday] = await Promise.all([
      prisma.visitorLog.count({ where: { societyId, entryTime: { gte: startOfDay } } }),
      prisma.visitorLog.count({ where: { societyId, status: 'PENDING' } }),
      prisma.visitorLog.count({ where: { societyId, status: 'APPROVED', exitTime: null } }),
      prisma.preApprovedGuest.count({
        where: {
          societyId,
          status: 'ACTIVE',
          validFrom: { lte: new Date() },
          validTill: { gte: startOfDay },
        },
      }),
    ]);

    return { todayVisitors, pendingApprovals, insidePremises, preApprovedToday };
  },

  getEmergencies: async (societyId) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [openEmergencies, resolvedThisMonth, avgResponse] = await Promise.all([
      prisma.emergencyRequest.count({
        where: { societyId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
      }),
      prisma.emergencyRequest.count({
        where: { societyId, status: 'RESOLVED', resolvedAt: { gte: startOfMonth } },
      }),
      prisma.$queryRawUnsafe(
        `SELECT
           COALESCE(
             AVG(EXTRACT(EPOCH FROM (acknowledged_at - raised_at))),
             0
           )::FLOAT AS avg_seconds
         FROM emergency_requests
         WHERE society_id = $1
           AND acknowledged_at IS NOT NULL`,
        societyId
      ),
    ]);

    const avgSeconds = avgResponse[0]?.avg_seconds || 0;
    const avgResponseMinutes = Math.round(avgSeconds / 60);

    return { openEmergencies, resolvedThisMonth, avgResponseMinutes };
  },

  getNotices: async (societyId) => {
    const now = new Date();

    const [activeNotices, totalReads, recentNotice, activeRules] = await Promise.all([
      prisma.notice.count({ where: { societyId, isActive: true, endDate: { gte: now } } }),
      prisma.noticeRead.count({ where: { notice: { societyId } } }),
      prisma.notice.findFirst({
        where: { societyId, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { title: true, createdAt: true, noticeType: true },
      }),
      prisma.rule.count({ where: { societyId, isActive: true } }),
    ]);

    return { activeNotices, totalReads, recentNotice, activeRules };
  },

  getActivity: async (societyId) => {
    const activity = await prisma.auditLog.findMany({
      where: { societyId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        action: true,
        entity: true,
        description: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    });

    return activity;
  },
};
