import prisma from '../lib/prisma.js';

export const SecurityService = {
  getDashboardOverview: async ({ reqUser }) => {
    const societyId = reqUser.society_id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const [todayVisitors, pendingApprovals, insideVisitors, exitedToday] = await Promise.all([
      prisma.visitorLog.count({
        where: {
          societyId,
          createdAt: { gte: today, lte: todayEnd },
          status: { in: ['APPROVED', 'EXITED'] },
        },
      }),
      prisma.visitorLog.count({
        where: { societyId, status: 'PENDING' },
      }),
      prisma.visitorLog.count({
        where: { societyId, status: 'APPROVED', exitTime: null },
      }),
      prisma.visitorLog.count({
        where: {
          societyId,
          exitTime: { gte: today, lte: todayEnd },
          status: 'EXITED',
        },
      }),
    ]);

    return {
      todayVisitors,
      pendingApprovals,
      insideVisitors,
      exitedToday,
    };
  },

  getPendingApprovals: async ({ reqUser }) => {
    const societyId = reqUser.society_id;
    const pendingApprovals = await prisma.visitorLog.findMany({
      where: { societyId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: {
        visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
        unit: { select: { id: true, unitNo: true, unitType: true, block: true } },
        gate: { select: { id: true, name: true } },
      },
    });

    const formatted = pendingApprovals.map((log) => {
      const waitTimeMs = new Date() - new Date(log.createdAt);
      const waitTimeMinutes = Math.floor(waitTimeMs / (1000 * 60));

      let waitTimeBadge = '';
      if (waitTimeMinutes < 1) {
        waitTimeBadge = 'Just now';
      } else if (waitTimeMinutes < 60) {
        waitTimeBadge = `${waitTimeMinutes}m ago`;
      } else {
        const hours = Math.floor(waitTimeMinutes / 60);
        waitTimeBadge = `${hours}h ${waitTimeMinutes % 60}m ago`;
      }

      return {
        id: log.id,
        visitorName: log.visitor?.name,
        visitorType: log.purpose,
        unit: log.unit ? `${log.unit.block}-${log.unit.unitNo}` : log.flatNo,
        waitTime: waitTimeMinutes,
        waitTimeBadge,
        visitor: log.visitor,
      };
    });

    return { notices: formatted };
  },

  getInsideVisitors: async ({ reqUser }) => {
    const societyId = reqUser.society_id;
    const visitors = await prisma.visitorLog.findMany({
      where: { societyId, status: 'APPROVED', exitTime: null },
      orderBy: { entryTime: 'desc' },
      include: {
        visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
        unit: { select: { id: true, unitNo: true, unitType: true, block: true } },
        gate: { select: { id: true, name: true } },
      },
    });

    return {
      visitors: visitors.map((v) => ({
        id: v.id,
        visitorName: v.visitor?.name,
        unit: v.unit ? `${v.unit.block}-${v.unit.unitNo}` : v.flatNo,
        entryTime: v.entryTime,
        visitor: v.visitor,
      })),
    };
  },

  getRecentActivity: async ({ reqUser }) => {
    const societyId = reqUser.society_id;
    const logs = await prisma.visitorLog.findMany({
      where: { societyId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        visitor: { select: { name: true } },
        unit: { select: { unitNo: true, block: true } },
      },
    });

    return logs.map((log) => {
      let action = 'Activity';
      if (log.status === 'APPROVED') action = 'Visitor entered';
      if (log.status === 'EXITED') action = 'Visitor exited';
      if (log.status === 'PENDING') action = 'Entry requested';
      if (log.status === 'REJECTED') action = 'Entry denied';

      return {
        id: log.id,
        action,
        subject: log.visitor?.name,
        target: log.unit ? `${log.unit.block}-${log.unit.unitNo}` : log.flatNo,
        time: log.createdAt,
        type: log.status,
      };
    });
  },

  getActiveEmergency: async ({ reqUser }) => {
    const societyId = reqUser.society_id;
    const emergency = await prisma.emergencyRequest.findFirst({
      where: { societyId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
      orderBy: { raisedAt: 'desc' },
      include: {
        user: { select: { name: true } },
        unit: { select: { unitNo: true, block: true } },
      },
    });

    if (!emergency) return { active: false };

    return {
      active: true,
      id: emergency.id,
      type: emergency.emergencyType,
      location: emergency.unit
        ? `${emergency.unit.block}-${emergency.unit.unitNo}`
        : emergency.location,
      raisedBy: emergency.user?.name,
      time: emergency.raisedAt,
      status: emergency.status,
    };
  },
};
