import prisma from '../../lib/prisma.js';

/**
 * Get audit logs (Super Admin - All logs, Society Admin - Own society only)
 * GET /api/v1/audit-logs
 * Access: SUPER_ADMIN, SOCIETY_ADMIN
 */
export const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      entity,
      userId,
      societyId,
      role,
      startDate,
      endDate,
    } = req.query;

    // Build where clause
    const where = {};

    // Super Admin can see all logs
    // Society Admin can only see their society's logs
    if (req.user.role_name === 'SOCIETY_ADMIN') {
      if (!req.user.society_id) {
        return res.status(403).json({
          success: false,
          message: 'Society Admin must be associated with a society',
        });
      }
      where.societyId = req.user.society_id;
    } else if (req.user.role_name !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Super Admin and Society Admin can view audit logs.',
      });
    }

    // Apply filters
    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (societyId && req.user.role_name === 'SUPER_ADMIN') {
      // Only Super Admin can filter by any society
      where.societyId = parseInt(societyId);
    }

    if (role) {
      where.role = role;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await prisma.auditLog.count({ where });

    // Fetch audit logs
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
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

    // Format response
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || null,
      userMobile: log.user?.mobile || null,
      societyId: log.societyId,
      societyName: log.society?.name || null,
      role: log.role,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      description: log.description,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));

    return res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs: formattedLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get audit log by ID
 * GET /api/v1/audit-logs/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN
 */
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.auditLog.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
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

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found',
      });
    }

    // Check access: Society Admin can only view their society's logs
    if (req.user.role_name === 'SOCIETY_ADMIN') {
      if (log.societyId !== req.user.society_id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your society\'s audit logs.',
        });
      }
    } else if (req.user.role_name !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Super Admin and Society Admin can view audit logs.',
      });
    }

    const formattedLog = {
      id: log.id,
      userId: log.userId,
      userName: log.user?.name || null,
      userMobile: log.user?.mobile || null,
      societyId: log.societyId,
      societyName: log.society?.name || null,
      role: log.role,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      description: log.description,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: 'Audit log retrieved successfully',
      data: formattedLog,
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get audit log statistics
 * GET /api/v1/audit-logs/stats
 * Access: SUPER_ADMIN, SOCIETY_ADMIN
 */
export const getAuditLogStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build where clause
    const where = {};

    // Society Admin can only see their society's stats
    if (req.user.role_name === 'SOCIETY_ADMIN') {
      if (!req.user.society_id) {
        return res.status(403).json({
          success: false,
          message: 'Society Admin must be associated with a society',
        });
      }
      where.societyId = req.user.society_id;
    } else if (req.user.role_name !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Super Admin and Society Admin can view audit log statistics.',
      });
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get total count
    const totalLogs = await prisma.auditLog.count({ where });

    // Get action counts
    const actionCounts = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
      take: 10, // Top 10 actions
    });

    // Get role counts
    const roleCounts = await prisma.auditLog.groupBy({
      by: ['role'],
      where,
      _count: {
        role: true,
      },
    });

    // Get entity counts
    const entityCounts = await prisma.auditLog.groupBy({
      by: ['entity'],
      where,
      _count: {
        entity: true,
      },
      orderBy: {
        _count: {
          entity: 'desc',
        },
      },
      take: 10, // Top 10 entities
    });

    return res.status(200).json({
      success: true,
      message: 'Audit log statistics retrieved successfully',
      data: {
        totalLogs,
        topActions: actionCounts.map((item) => ({
          action: item.action,
          count: item._count.action,
        })),
        roleDistribution: roleCounts.map((item) => ({
          role: item.role,
          count: item._count.role,
        })),
        topEntities: entityCounts.map((item) => ({
          entity: item.entity,
          count: item._count.entity,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching audit log statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};


