import prisma from '../../lib/prisma.js';
import { getSubscription, updateSubscriptionStatus } from '../../services/subscriptionService.js';

/**
 * Get security dashboard data
 * GET /api/v1/security/dashboard
 * Access: SECURITY only
 * 
 * Returns:
 * - System status (active/grace/locked)
 * - Society information
 * - Gate information
 * - Today's statistics (visitors count, pending approvals, inside premises)
 * - Pending approvals list
 * - Active visitors list
 */
export const getSecurityDashboard = async (req, res) => {
  try {
    // Security guard must have a society
    if (!req.user.society_id) {
      return res.status(403).json({
        success: false,
        message: 'Security guard must be associated with a society',
      });
    }

    const societyId = req.user.society_id;

    // Get society information
    const society = await prisma.society.findUnique({
      where: { id: societyId },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        city: true,
        state: true,
      },
    });

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found',
      });
    }

    // Get all gates for this society
    const gates = await prisma.gate.findMany({
      where: { societyId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get subscription status
    let subscription = await getSubscription(societyId);
    let systemStatus = 'LOCKED';
    let systemStatusMessage = null;

    if (subscription) {
      subscription = await updateSubscriptionStatus(subscription);
      
      if (subscription.status === 'TRIAL' || subscription.status === 'ACTIVE') {
        systemStatus = 'ACTIVE';
      } else if (subscription.status === 'GRACE') {
        systemStatus = 'GRACE';
        systemStatusMessage = 'Subscription expired. Please inform society admin.';
      } else if (subscription.status === 'LOCKED') {
        systemStatus = 'LOCKED';
        systemStatusMessage = 'Entry locked. Contact society admin.';
      } else if (subscription.status === 'SUSPENDED') {
        systemStatus = 'LOCKED';
        systemStatusMessage = 'System suspended. Contact society admin.';
      }
    }

    // Calculate today's date range (start and end of today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Get today's visitor count (all visitor logs created today)
    const todayVisitorsCount = await prisma.visitorLog.count({
      where: {
        societyId,
        createdAt: {
          gte: today,
          lte: todayEnd,
        },
        status: {
          in: ['approved', 'exited'],
        },
      },
    });

    // Get pending approvals count (status = 'pending')
    const pendingApprovalsCount = await prisma.visitorLog.count({
      where: {
        societyId,
        status: 'pending',
      },
    });

    // Get inside premises count (only approved visitors who haven't exited)
    const insidePremisesCount = await prisma.visitorLog.count({
      where: {
        societyId,
        status: 'approved',
        exitTime: null,
      },
    });

    // Get pending approvals list (top 10, most recent first)
    const pendingApprovals = await prisma.visitorLog.findMany({
      where: {
        societyId,
        status: 'pending',
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        visitor: {
          select: {
            id: true,
            name: true,
            mobile: true,
            photoBase64: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
          },
        },
        gate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Calculate waiting time for each pending approval
    const pendingApprovalsWithWaitTime = pendingApprovals.map((log) => {
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
        ...log,
        waitTime: waitTimeMinutes,
        waitTimeBadge,
      };
    });

    // Get active visitors list (inside premises, top 10, most recent entry first)
    const activeVisitors = await prisma.visitorLog.findMany({
      where: {
        societyId,
        status: 'approved',
        exitTime: null,
      },
      take: 10,
      orderBy: { entryTime: 'desc' },
      include: {
        visitor: {
          select: {
            id: true,
            name: true,
            mobile: true,
            photoBase64: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
          },
        },
        gate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Response data
    const dashboardData = {
      systemStatus,
      systemStatusMessage,
      society: {
        id: society.id,
        name: society.name,
        type: society.type,
        address: society.address,
        city: society.city,
        state: society.state,
      },
      gates,
      guard: {
        id: req.user.id,
        name: req.user.name,
      },
      stats: {
        todayVisitors: todayVisitorsCount,
        pendingApprovals: pendingApprovalsCount,
        insidePremises: insidePremisesCount,
      },
      pendingApprovals: pendingApprovalsWithWaitTime,
      activeVisitors,
    };

    res.json({
      success: true,
      message: 'Security dashboard data retrieved successfully',
      data: dashboardData,
    });
  } catch (error) {
    console.error('Get security dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve security dashboard data',
      error: error.message,
    });
  }
};

