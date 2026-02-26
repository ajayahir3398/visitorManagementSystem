import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';
import { sendNotificationToUser } from '../../utils/notificationHelper.js';

/**
 * Approve visitor entry
 * POST /api/v1/visitor-logs/:id/approve
 * Access: RESIDENT only
 */
export const approveVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitorLogId = parseInt(id);

    if (isNaN(visitorLogId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visitor log ID',
      });
    }

    // Get visitor log
    const visitorLog = await prisma.visitorLog.findUnique({
      where: { id: visitorLogId },
      include: {
        unit: {
          select: {
            id: true,
            unitNo: true,
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    });

    if (!visitorLog) {
      return res.status(404).json({
        success: false,
        message: 'Visitor log not found',
      });
    }

    // Check if visitor log belongs to user's society
    if (req.user.society_id !== visitorLog.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This visitor log does not belong to your society.',
      });
    }

    // Check if resident is a member of the unit
    if (visitorLog.unitId) {
      const isMember = await prisma.unitMember.findFirst({
        where: {
          unitId: visitorLog.unitId,
          userId: req.user.id,
        },
      });

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only approve visitors for your units.',
        });
      }
    } else if (visitorLog.flatNo) {
      // Backward compatibility: check by flatNo
      const userUnits = await prisma.unitMember.findMany({
        where: {
          userId: req.user.id,
        },
        include: {
          unit: {
            select: {
              unitNo: true,
            },
          },
        },
      });

      const hasMatchingUnit = userUnits.some(
        (um) => um.unit.unitNo.toLowerCase() === visitorLog.flatNo?.toLowerCase()
      );

      if (!hasMatchingUnit) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only approve visitors for your units.',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Visitor log does not have a valid unit or flat number.',
      });
    }

    // Check if already approved/rejected
    if (visitorLog.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Visitor entry is already approved',
        data: { visitorLog },
      });
    }

    if (visitorLog.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Visitor entry is already rejected',
        data: { visitorLog },
      });
    }

    if (visitorLog.status === 'exited') {
      return res.status(400).json({
        success: false,
        message: 'Visitor has already exited. Cannot approve/reject.',
        data: { visitorLog },
      });
    }

    // Check if resident already approved/rejected this visitor log
    const existingApproval = await prisma.approval.findFirst({
      where: {
        visitorLogId: visitorLogId,
        residentId: req.user.id,
      },
    });

    if (existingApproval) {
      // Update existing approval
      const approval = await prisma.approval.update({
        where: { id: existingApproval.id },
        data: {
          decision: 'approved',
          decisionTime: new Date(),
        },
        include: {
          resident: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },
        },
      });

      // Update visitor log status and set entry time (if not already set)
      const updatedLog = await prisma.visitorLog.update({
        where: { id: visitorLogId },
        data: {
          status: 'approved',
          entryTime: visitorLog.entryTime || new Date(), // Set entry time if not already set
        },
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

      // Log visitor approval action
      await logAction({
        user: req.user,
        action: AUDIT_ACTIONS.VISITOR_APPROVED,
        entity: AUDIT_ENTITIES.VISITOR_LOG,
        entityId: visitorLogId,
        description: `Visitor ${visitorLog.visitor?.name || 'Unknown'} approved for unit ${visitorLog.unit?.unitNo || 'Unknown'}`,
        req,
      });

      // Send push notification to security user who created the entry
      try {
        const visitorName = updatedLog.visitor?.name || 'Visitor';
        const unitNo = updatedLog.unit?.unitNo || 'unit';
        const residentName = req.user.name || 'Resident';
        const securityUserId = updatedLog.createdBy;

        console.log(
          `🔔 [Approval] Sending approval notification to security userId: ${securityUserId} (visitor: ${visitorName})`
        );
        const notifResult = await sendNotificationToUser(
          securityUserId,
          'Visitor Approved',
          `${residentName} approved ${visitorName} for ${unitNo}`,
          {
            screen: 'visitor_log_detail',
            visitorLogId: visitorLogId.toString(),
            type: 'visitor_approved',
          }
        );
        console.log(
          `📨 [Approval] Notification result for security userId ${securityUserId}:`,
          JSON.stringify(notifResult)
        );
      } catch (notificationError) {
        // Don't fail the request if notification fails
        console.error('❌ [Approval] Error sending notification to security:', notificationError);
      }

      return res.json({
        success: true,
        message: 'Visitor entry approved successfully',
        data: {
          visitorLog: updatedLog,
          approval,
        },
      });
    }

    // Fix sequence if out of sync
    await fixSequence('approvals');

    // Create new approval
    const approval = await prisma.approval.create({
      data: {
        visitorLogId: visitorLogId,
        residentId: req.user.id,
        decision: 'approved',
        decisionTime: new Date(),
      },
      include: {
        resident: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    });

    // Update visitor log status and set entry time
    const updatedLog = await prisma.visitorLog.update({
      where: { id: visitorLogId },
      data: {
        status: 'approved',
        entryTime: new Date(), // Set entry time when approved
      },
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
        approvals: {
          include: {
            resident: {
              select: {
                id: true,
                name: true,
                mobile: true,
              },
            },
          },
          orderBy: {
            decisionTime: 'desc',
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log visitor approval action
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.VISITOR_APPROVED,
      entity: AUDIT_ENTITIES.VISITOR_LOG,
      entityId: visitorLogId,
      description: `Visitor ${visitorLog.visitor?.name || 'Unknown'} approved for unit ${visitorLog.unit?.unitNo || 'Unknown'}`,
      req,
    });

    // Send push notification to security user who created the entry
    try {
      const visitorName = updatedLog.visitor?.name || 'Visitor';
      const unitNo = updatedLog.unit?.unitNo || 'unit';
      const residentName = req.user.name || 'Resident';
      const securityUserId = updatedLog.createdBy;

      console.log(
        `🔔 [Approval] Sending approval notification to security userId: ${securityUserId} (visitor: ${visitorName})`
      );
      const notifResult = await sendNotificationToUser(
        securityUserId,
        'Visitor Approved',
        `${residentName} approved ${visitorName} for ${unitNo}`,
        {
          screen: 'visitor_log_detail',
          visitorLogId: visitorLogId.toString(),
          type: 'visitor_approved',
        }
      );
      console.log(
        `📨 [Approval] Notification result for security userId ${securityUserId}:`,
        JSON.stringify(notifResult)
      );
    } catch (notificationError) {
      // Don't fail the request if notification fails
      console.error('❌ [Approval] Error sending notification to security:', notificationError);
    }

    res.json({
      success: true,
      message: 'Visitor entry approved successfully',
      data: {
        visitorLog: updatedLog,
        approval,
      },
    });
  } catch (error) {
    console.error('Approve visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve visitor entry',
      error: error.message,
    });
  }
};

/**
 * Reject visitor entry
 * POST /api/v1/visitor-logs/:id/reject
 * Access: RESIDENT only
 */
export const rejectVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitorLogId = parseInt(id);

    if (isNaN(visitorLogId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visitor log ID',
      });
    }

    // Get visitor log
    const visitorLog = await prisma.visitorLog.findUnique({
      where: { id: visitorLogId },
      include: {
        unit: {
          select: {
            id: true,
            unitNo: true,
          },
        },
        visitor: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    });

    if (!visitorLog) {
      return res.status(404).json({
        success: false,
        message: 'Visitor log not found',
      });
    }

    // Check if visitor log belongs to user's society
    if (req.user.society_id !== visitorLog.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This visitor log does not belong to your society.',
      });
    }

    // Check if resident is a member of the unit
    if (visitorLog.unitId) {
      const isMember = await prisma.unitMember.findFirst({
        where: {
          unitId: visitorLog.unitId,
          userId: req.user.id,
        },
      });

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only reject visitors for your units.',
        });
      }
    } else if (visitorLog.flatNo) {
      // Backward compatibility: check by flatNo
      const userUnits = await prisma.unitMember.findMany({
        where: {
          userId: req.user.id,
        },
        include: {
          unit: {
            select: {
              unitNo: true,
            },
          },
        },
      });

      const hasMatchingUnit = userUnits.some(
        (um) => um.unit.unitNo.toLowerCase() === visitorLog.flatNo?.toLowerCase()
      );

      if (!hasMatchingUnit) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only reject visitors for your units.',
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Visitor log does not have a valid unit or flat number.',
      });
    }

    // Check if already approved/rejected
    if (visitorLog.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Visitor entry is already approved',
        data: { visitorLog },
      });
    }

    if (visitorLog.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Visitor entry is already rejected',
        data: { visitorLog },
      });
    }

    if (visitorLog.status === 'exited') {
      return res.status(400).json({
        success: false,
        message: 'Visitor has already exited. Cannot approve/reject.',
        data: { visitorLog },
      });
    }

    // Check if resident already approved/rejected this visitor log
    const existingApproval = await prisma.approval.findFirst({
      where: {
        visitorLogId: visitorLogId,
        residentId: req.user.id,
      },
    });

    if (existingApproval) {
      // Update existing approval
      const approval = await prisma.approval.update({
        where: { id: existingApproval.id },
        data: {
          decision: 'rejected',
          decisionTime: new Date(),
        },
        include: {
          resident: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },
        },
      });

      // Update visitor log status
      const updatedLog = await prisma.visitorLog.update({
        where: { id: visitorLogId },
        data: { status: 'rejected' },
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
          createdByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Log visitor rejection action
      await logAction({
        user: req.user,
        action: AUDIT_ACTIONS.VISITOR_REJECTED,
        entity: AUDIT_ENTITIES.VISITOR_LOG,
        entityId: visitorLogId,
        description: `Visitor ${visitorLog.visitor?.name || 'Unknown'} rejected for unit ${visitorLog.unit?.unitNo || 'Unknown'}`,
        req,
      });

      // Send push notification to security user who created the entry
      try {
        const visitorName = updatedLog.visitor?.name || 'Visitor';
        const unitNo = updatedLog.unit?.unitNo || 'unit';
        const residentName = req.user.name || 'Resident';
        const securityUserId = updatedLog.createdBy;

        console.log(
          `🔔 [Rejection] Sending rejection notification to security userId: ${securityUserId} (visitor: ${visitorName})`
        );
        const notifResult = await sendNotificationToUser(
          securityUserId,
          'Visitor Rejected',
          `${residentName} rejected ${visitorName} for ${unitNo}`,
          {
            screen: 'visitor_log_detail',
            visitorLogId: visitorLogId.toString(),
            type: 'visitor_rejected',
          }
        );
        console.log(
          `📨 [Rejection] Notification result for security userId ${securityUserId}:`,
          JSON.stringify(notifResult)
        );
      } catch (notificationError) {
        // Don't fail the request if notification fails
        console.error('❌ [Rejection] Error sending notification to security:', notificationError);
      }

      return res.json({
        success: true,
        message: 'Visitor entry rejected successfully',
        data: {
          visitorLog: updatedLog,
          approval,
        },
      });
    }

    // Fix sequence if out of sync
    await fixSequence('approvals');

    // Create new rejection
    const approval = await prisma.approval.create({
      data: {
        visitorLogId: visitorLogId,
        residentId: req.user.id,
        decision: 'rejected',
        decisionTime: new Date(),
      },
      include: {
        resident: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    });

    // Update visitor log status
    const updatedLog = await prisma.visitorLog.update({
      where: { id: visitorLogId },
      data: { status: 'rejected' },
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
        approvals: {
          include: {
            resident: {
              select: {
                id: true,
                name: true,
                mobile: true,
              },
            },
          },
          orderBy: {
            decisionTime: 'desc',
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log visitor rejection action
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.VISITOR_REJECTED,
      entity: AUDIT_ENTITIES.VISITOR_LOG,
      entityId: visitorLogId,
      description: `Visitor ${visitorLog.visitor?.name || 'Unknown'} rejected for unit ${visitorLog.unit?.unitNo || 'Unknown'}`,
      req,
    });

    // Send push notification to security user who created the entry
    try {
      const visitorName = updatedLog.visitor?.name || 'Visitor';
      const unitNo = updatedLog.unit?.unitNo || 'unit';
      const residentName = req.user.name || 'Resident';
      const securityUserId = updatedLog.createdBy;

      console.log(
        `🔔 [Rejection] Sending rejection notification to security userId: ${securityUserId} (visitor: ${visitorName})`
      );
      const notifResult = await sendNotificationToUser(
        securityUserId,
        'Visitor Rejected',
        `${residentName} rejected ${visitorName} for ${unitNo}`,
        {
          screen: 'visitor_log_detail',
          visitorLogId: visitorLogId.toString(),
          type: 'visitor_rejected',
        }
      );
      console.log(
        `📨 [Rejection] Notification result for security userId ${securityUserId}:`,
        JSON.stringify(notifResult)
      );
    } catch (notificationError) {
      // Don't fail the request if notification fails
      console.error('❌ [Rejection] Error sending notification to security:', notificationError);
    }

    res.json({
      success: true,
      message: 'Visitor entry rejected successfully',
      data: {
        visitorLog: updatedLog,
        approval,
      },
    });
  } catch (error) {
    console.error('Reject visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject visitor entry',
      error: error.message,
    });
  }
};

/**
 * Get pending approvals for resident
 * GET /api/v1/approvals/pending
 * Access: RESIDENT only
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get units where user is a member
    const userUnits = await prisma.unitMember.findMany({
      where: {
        userId: req.user.id,
      },
      select: {
        unitId: true,
        unit: {
          select: {
            unitNo: true,
          },
        },
      },
    });

    const unitIds = userUnits.map((um) => um.unitId);

    if (unitIds.length === 0) {
      return res.json({
        success: true,
        message: 'Pending approvals retrieved successfully',
        data: {
          visitorLogs: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        },
      });
    }

    // Get pending visitor logs for user's units
    const where = {
      societyId: req.user.society_id,
      status: 'pending',
      unitId: { in: unitIds },
    };

    const [visitorLogs, total] = await Promise.all([
      prisma.visitorLog.findMany({
        where,
        skip,
        take: parseInt(limit),
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
          createdByUser: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { approvals: true },
          },
        },
      }),
      prisma.visitorLog.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Pending approvals retrieved successfully',
      data: {
        visitorLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending approvals',
      error: error.message,
    });
  }
};
