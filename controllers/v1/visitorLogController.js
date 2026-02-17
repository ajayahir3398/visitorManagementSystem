import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';
import { sendNotificationToUnitResidents, sendNotificationToUnitResidentsByFlatNo } from '../../utils/notificationHelper.js';
import { normalizeBase64Image } from '../../utils/image.js';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/**
 * Create visitor entry (log)
 * POST /api/v1/visitor-logs
 * Access: SECURITY only
 */
export const createVisitorEntry = async (req, res) => {
  try {
    const { visitorId, gateId, unitId, flatNo, purpose, photoBase64 } = req.body;

    // Validation
    if (!visitorId || !gateId) {
      return res.status(400).json({
        success: false,
        message: 'visitorId and gateId are required',
      });
    }

    // Either unitId or flatNo should be provided
    if (!unitId && !flatNo) {
      return res.status(400).json({
        success: false,
        message: 'Either unitId or flatNo is required',
      });
    }

    // Security guard must have a society
    if (!req.user.society_id) {
      return res.status(403).json({
        success: false,
        message: 'Security guard must be associated with a society',
      });
    }

    // Check if visitor exists
    const visitor = await prisma.visitor.findUnique({
      where: { id: parseInt(visitorId) },
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    // Update visitor photo if base64 is provided
    if (photoBase64 !== undefined) {
      try {
        const normalizedPhoto = photoBase64 === null ? null : normalizeBase64Image(photoBase64, { maxBytes: MAX_PHOTO_BYTES });
        await prisma.visitor.update({
          where: { id: parseInt(visitorId) },
          data: { photoBase64: normalizedPhoto },
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message || 'Invalid photo data',
        });
      }
    }

    // Check if gate exists and belongs to security's society
    const gate = await prisma.gate.findUnique({
      where: { id: parseInt(gateId) },
    });

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'Gate not found',
      });
    }

    if (gate.societyId !== req.user.society_id) {
      return res.status(403).json({
        success: false,
        message: 'Gate does not belong to your society',
      });
    }

    // Validate unit if provided
    let unit = null;
    if (unitId) {
      unit = await prisma.unit.findUnique({
        where: { id: parseInt(unitId) },
      });

      if (!unit) {
        return res.status(404).json({
          success: false,
          message: 'Unit not found',
        });
      }

      if (unit.societyId !== req.user.society_id) {
        return res.status(403).json({
          success: false,
          message: 'Unit does not belong to your society',
        });
      }
    }

    // Check if visitor already has an active entry (not exited)
    const activeEntry = await prisma.visitorLog.findFirst({
      where: {
        visitorId: parseInt(visitorId),
        societyId: req.user.society_id,
        status: {
          not: 'exited',
        },
        exitTime: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (activeEntry) {
      return res.status(400).json({
        success: false,
        message: 'Visitor already has an active entry. Please mark exit first.',
        data: { visitorLog: activeEntry },
      });
    }

    // Fix sequence if out of sync
    await fixSequence('visitor_logs');

    // Create visitor log entry
    const visitorLog = await prisma.visitorLog.create({
      data: {
        societyId: req.user.society_id,
        gateId: parseInt(gateId),
        visitorId: parseInt(visitorId),
        unitId: unitId ? parseInt(unitId) : null,
        flatNo: flatNo || null, // Keep for backward compatibility
        purpose: purpose || null,
        entryTime: null, // Will be set when visitor is approved
        status: 'pending', // Will be approved/rejected by resident
        createdBy: req.user.id,
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
        society: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
          },
        },
      },
    });

    // Log visitor entry action
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.VISITOR_ENTRY,
      entity: AUDIT_ENTITIES.VISITOR_LOG,
      entityId: visitorLog.id,
      description: `Visitor entry created for ${visitorLog.visitor?.name || 'Unknown'} at gate ${visitorLog.gate?.name || 'Unknown'}`,
      req,
    });

    // Send push notification to unit residents
    try {
      const visitorName = visitorLog.visitor?.name || 'A visitor';
      const unitNo = visitorLog.unit?.unitNo || visitorLog.flatNo || 'your unit';
      const gateName = visitorLog.gate?.name || 'the gate';
      const notifData = {
        screen: 'visitor_log_detail',
        visitorLogId: visitorLog.id.toString(),
        type: 'visitor_request',
      };

      if (visitorLog.unitId) {
        // Primary path: send by unitId
        console.log(`🔔 Sending visitor request notification to unit ${visitorLog.unitId}`);
        await sendNotificationToUnitResidents(
          visitorLog.unitId,
          'New Visitor Request',
          `${visitorName} is waiting at ${gateName} for ${unitNo}`,
          notifData
        );
      } else if (visitorLog.flatNo) {
        // Fallback path: resolve flatNo → unitId, then send
        console.log(`🔔 Sending visitor request notification via flatNo "${visitorLog.flatNo}"`);
        await sendNotificationToUnitResidentsByFlatNo(
          visitorLog.societyId,
          visitorLog.flatNo,
          'New Visitor Request',
          `${visitorName} is waiting at ${gateName} for ${unitNo}`,
          notifData
        );
      } else {
        console.log('⚠️ Visitor entry has no unitId or flatNo — skipping resident notification');
      }
    } catch (notificationError) {
      // Don't fail the request if notification fails
      console.error('Error sending notification to residents:', notificationError);
    }

    res.status(201).json({
      success: true,
      message: 'Visitor entry logged successfully',
      data: { visitorLog },
    });
  } catch (error) {
    console.error('Create visitor entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create visitor entry',
      error: error.message,
    });
  }
};

/**
 * Mark visitor exit
 * PUT /api/v1/visitor-logs/:id/exit
 * Access: SECURITY only
 */
export const markVisitorExit = async (req, res) => {
  try {
    const { id } = req.params;
    const { exitTime } = req.body;
    const visitorLogId = parseInt(id);

    if (isNaN(visitorLogId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visitor log ID',
      });
    }

    // Security guard must have a society
    if (!req.user.society_id) {
      return res.status(403).json({
        success: false,
        message: 'Security guard must be associated with a society',
      });
    }

    // Get visitor log
    const visitorLog = await prisma.visitorLog.findUnique({
      where: { id: visitorLogId },
      include: {
        visitor: {
          select: {
            id: true,
            name: true,
            mobile: true,
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

    if (!visitorLog) {
      return res.status(404).json({
        success: false,
        message: 'Visitor log not found',
      });
    }

    // Check if visitor log belongs to security's society
    if (visitorLog.societyId !== req.user.society_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This visitor log does not belong to your society.',
      });
    }

    // Check if already exited
    if (visitorLog.status === 'exited' || visitorLog.exitTime) {
      return res.status(400).json({
        success: false,
        message: 'Visitor has already exited',
        data: { visitorLog },
      });
    }

    // Update exit time and status
    const updated = await prisma.visitorLog.update({
      where: { id: visitorLogId },
      data: {
        exitTime: exitTime ? new Date(exitTime) : new Date(),
        status: 'exited',
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
        gate: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
            floor: true,
            block: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        society: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log visitor exit action
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.VISITOR_EXIT,
      entity: AUDIT_ENTITIES.VISITOR_LOG,
      entityId: updated.id,
      description: `Visitor exit marked for ${updated.visitor?.name || 'Unknown'}`,
      req,
    });

    res.json({
      success: true,
      message: 'Visitor exit marked successfully',
      data: { visitorLog: updated },
    });
  } catch (error) {
    console.error('Mark visitor exit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark visitor exit',
      error: error.message,
    });
  }
};

/**
 * Get all visitor logs
 * GET /api/v1/visitor-logs
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT
 */
export const getVisitorLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, gateId, visitorId, flatNo, date, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    // If user is SECURITY or SOCIETY_ADMIN, only show logs from their society
    if (req.user.role_name === 'SECURITY' || req.user.role_name === 'SOCIETY_ADMIN') {
      if (req.user.society_id) {
        where.societyId = req.user.society_id;
      }
    }

    // If user is RESIDENT, only show logs for their units
    if (req.user.role_name === 'RESIDENT') {
      if (req.user.society_id) {
        where.societyId = req.user.society_id;
      }

      // Get units where user is a member
      const userUnits = await prisma.unitMember.findMany({
        where: {
          userId: req.user.id,
        },
        select: {
          unitId: true,
        },
      });

      const unitIds = userUnits.map(um => um.unitId);

      if (unitIds.length === 0) {
        // User is not a member of any unit, return empty result
        return res.json({
          success: true,
          message: 'Visitor logs retrieved successfully',
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

      // Filter by unit IDs
      where.unitId = { in: unitIds };
    }

    if (status) {
      where.status = status;
    }

    if (gateId) {
      where.gateId = parseInt(gateId);
    }

    if (visitorId) {
      where.visitorId = parseInt(visitorId);
    }

    if (flatNo) {
      // Support both flatNo and unitNo search
      // If there's already an OR clause from search, we need to merge it
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          {
            OR: [
              { flatNo: flatNo },
              {
                unit: {
                  unitNo: flatNo,
                },
              },
            ],
          },
        ];
        delete where.OR;
      } else {
        where.OR = [
          { flatNo: flatNo },
          {
            unit: {
              unitNo: flatNo,
            },
          },
        ];
      }
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (search) {
      where.OR = [
        { flatNo: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
        {
          unit: {
            unitNo: { contains: search, mode: 'insensitive' },
          },
        },
        {
          visitor: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { mobile: { contains: search } },
            ],
          },
        },
      ];
    }

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
          gate: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              unitNo: true,
              unitType: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
            },
          },
          society: {
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
      message: 'Visitor logs retrieved successfully',
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
    console.error('Get visitor logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitor logs',
      error: error.message,
    });
  }
};

/**
 * Get visitor log by ID
 * GET /api/v1/visitor-logs/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT
 */
export const getVisitorLogById = async (req, res) => {
  try {
    const { id } = req.params;
    const visitorLogId = parseInt(id);

    if (isNaN(visitorLogId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visitor log ID',
      });
    }

    const visitorLog = await prisma.visitorLog.findUnique({
      where: { id: visitorLogId },
      include: {
        visitor: {
          select: {
            id: true,
            name: true,
            mobile: true,
            photoBase64: true,
          },
        },
        gate: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
            floor: true,
            block: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
          },
        },
        society: {
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
      },
    });

    if (!visitorLog) {
      return res.status(404).json({
        success: false,
        message: 'Visitor log not found',
      });
    }

    // Check access based on role
    if (req.user.role_name === 'SECURITY' || req.user.role_name === 'SOCIETY_ADMIN') {
      if (req.user.society_id !== visitorLog.societyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This visitor log does not belong to your society.',
        });
      }
    }

    // RESIDENT can only view logs for their units
    if (req.user.role_name === 'RESIDENT') {
      // Check if visitor log belongs to user's society
      if (req.user.society_id !== visitorLog.societyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. This visitor log does not belong to your society.',
        });
      }

      // Check if visitor log is for a unit where user is a member
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
            message: 'Access denied. You can only view visitor logs for your units.',
          });
        }
      } else {
        // If no unitId, check by flatNo (backward compatibility)
        // Only allow if user is a member of a unit with matching flatNo
        if (visitorLog.flatNo) {
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
            um => um.unit.unitNo.toLowerCase() === visitorLog.flatNo?.toLowerCase()
          );

          if (!hasMatchingUnit) {
            return res.status(403).json({
              success: false,
              message: 'Access denied. You can only view visitor logs for your units.',
            });
          }
        } else {
          // No unitId and no flatNo - deny access
          return res.status(403).json({
            success: false,
            message: 'Access denied. Visitor log does not have a valid unit or flat number.',
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Visitor log retrieved successfully',
      data: { visitorLog },
    });
  } catch (error) {
    console.error('Get visitor log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitor log',
      error: error.message,
    });
  }
};

/**
 * Get active entries (visitors currently inside)
 * GET /api/v1/visitor-logs/active
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY
 */
export const getActiveEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, gateId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      status: {
        not: 'exited',
      },
      exitTime: null,
    };

    // If user is SECURITY or SOCIETY_ADMIN, only show logs from their society
    if (req.user.role_name === 'SECURITY' || req.user.role_name === 'SOCIETY_ADMIN') {
      if (req.user.society_id) {
        where.societyId = req.user.society_id;
      }
    }

    if (gateId) {
      where.gateId = parseInt(gateId);
    }

    const [visitorLogs, total] = await Promise.all([
      prisma.visitorLog.findMany({
        where,
        skip,
        take: parseInt(limit),
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
          gate: {
            select: {
              id: true,
              name: true,
            },
          },
          unit: {
            select: {
              id: true,
              unitNo: true,
              unitType: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.visitorLog.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Active entries retrieved successfully',
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
    console.error('Get active entries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active entries',
      error: error.message,
    });
  }
};
