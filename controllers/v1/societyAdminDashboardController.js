import prisma from '../../lib/prisma.js';

// ═══════════════════════════════════════════════════════════════
// 1️⃣  GET /overview — KPI cards
// ═══════════════════════════════════════════════════════════════
export const getOverview = async (req, res) => {
  try {
    const societyId = req.user.societyId;

    const [
      totalUnits,
      totalResidents,
      activeSecurity,
      openEmergencies,
      pendingViolations,
    ] = await Promise.all([
      prisma.unit.count({
        where: { societyId, status: 'ACTIVE' },
      }),

      prisma.unitMember.count({
        where: { unit: { societyId } },
      }),

      prisma.user.count({
        where: { societyId, status: 'active', role: { name: 'SECURITY' } },
      }),

      prisma.emergencyRequest.count({
        where: { societyId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
      }),

      prisma.ruleViolation.count({
        where: { societyId, status: 'PENDING' },
      }),
    ]);

    res.json({
      success: true,
      message: 'Dashboard overview retrieved successfully',
      data: {
        totalUnits,
        totalResidents,
        activeSecurity,
        openEmergencies,
        pendingViolations,
      },
    });
  } catch (error) {
    console.error('Society dashboard overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard overview' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 2️⃣  GET /maintenance — Financial overview
// ═══════════════════════════════════════════════════════════════
export const getMaintenance = async (req, res) => {
  try {
    const societyId = req.user.societyId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      upcomingBills,
      unpaidBills,
      overdueBills,
      collectedThisMonth,
      overdueAmount,
    ] = await Promise.all([
      // Temp bills (preview/upcoming)
      prisma.tempMaintenanceBill.count({
        where: { societyId },
      }),

      // Unpaid final bills
      prisma.maintenanceBill.count({
        where: { societyId, status: 'UNPAID' },
      }),

      // Overdue final bills (unpaid + past due date)
      prisma.maintenanceBill.count({
        where: { societyId, status: { in: ['UNPAID', 'OVERDUE'] }, dueDate: { lt: now } },
      }),

      // Collected this month
      prisma.maintenancePayment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'SUCCESS',
          paidAt: { gte: startOfMonth },
          bill: { societyId },
        },
      }),

      // Total overdue amount
      prisma.maintenanceBill.aggregate({
        _sum: { amount: true },
        where: { societyId, status: { in: ['UNPAID', 'OVERDUE'] }, dueDate: { lt: now } },
      }),
    ]);

    res.json({
      success: true,
      message: 'Maintenance summary retrieved successfully',
      data: {
        upcomingBills,
        unpaidBills,
        overdueBills,
        collectedThisMonth: collectedThisMonth._sum.amount || 0,
        overdueAmount: overdueAmount._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Society dashboard maintenance error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve maintenance summary' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 3️⃣  GET /visitors — Visitor activity
// ═══════════════════════════════════════════════════════════════
export const getVisitors = async (req, res) => {
  try {
    const societyId = req.user.societyId;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      todayVisitors,
      pendingApprovals,
      insidePremises,
      preApprovedToday,
    ] = await Promise.all([
      // Visitors who entered today
      prisma.visitorLog.count({
        where: { societyId, entryTime: { gte: startOfDay } },
      }),

      // Pending approval requests
      prisma.visitorLog.count({
        where: { societyId, status: 'pending' },
      }),

      // Currently inside (approved, no exit time)
      prisma.visitorLog.count({
        where: { societyId, status: 'approved', exitTime: null },
      }),

      // Pre-approved guests created today
      prisma.preApprovedGuest.count({
        where: {
          societyId,
          status: 'ACTIVE',
          validFrom: { lte: new Date() },
          validTill: { gte: startOfDay },
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'Visitor summary retrieved successfully',
      data: {
        todayVisitors,
        pendingApprovals,
        insidePremises,
        preApprovedToday,
      },
    });
  } catch (error) {
    console.error('Society dashboard visitors error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve visitor summary' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 4️⃣  GET /emergencies — Emergency snapshot
// ═══════════════════════════════════════════════════════════════
export const getEmergencies = async (req, res) => {
  try {
    const societyId = req.user.societyId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [openEmergencies, resolvedThisMonth, avgResponse] = await Promise.all([
      prisma.emergencyRequest.count({
        where: { societyId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
      }),

      prisma.emergencyRequest.count({
        where: { societyId, status: 'RESOLVED', resolvedAt: { gte: startOfMonth } },
      }),

      // Average response time (raised → acknowledged) in seconds
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

    res.json({
      success: true,
      message: 'Emergency summary retrieved successfully',
      data: {
        openEmergencies,
        resolvedThisMonth,
        avgResponseMinutes,
      },
    });
  } catch (error) {
    console.error('Society dashboard emergencies error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve emergency summary' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 5️⃣  GET /notices — Notice & communication summary
// ═══════════════════════════════════════════════════════════════
export const getNotices = async (req, res) => {
  try {
    const societyId = req.user.societyId;
    const now = new Date();

    const [activeNotices, totalReads, recentNotice, activeRules] = await Promise.all([
      prisma.notice.count({
        where: { societyId, isActive: true, endDate: { gte: now } },
      }),

      prisma.noticeRead.count({
        where: { notice: { societyId } },
      }),

      prisma.notice.findFirst({
        where: { societyId, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { title: true, createdAt: true, noticeType: true },
      }),

      // Rules summary included here for the small widget
      prisma.rule.count({
        where: { societyId, isActive: true },
      }),
    ]);

    res.json({
      success: true,
      message: 'Notice summary retrieved successfully',
      data: {
        activeNotices,
        totalReads,
        recentNotice,
        activeRules,
      },
    });
  } catch (error) {
    console.error('Society dashboard notices error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve notice summary' });
  }
};

// ═══════════════════════════════════════════════════════════════
// 6️⃣  GET /activity — Recent activity feed (audit logs)
// ═══════════════════════════════════════════════════════════════
export const getActivity = async (req, res) => {
  try {
    const societyId = req.user.societyId;

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
        user: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      message: 'Recent activity retrieved successfully',
      data: activity,
    });
  } catch (error) {
    console.error('Society dashboard activity error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve recent activity' });
  }
};
