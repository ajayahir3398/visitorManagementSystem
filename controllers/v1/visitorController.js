import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Create a new visitor
 * POST /api/v1/visitors
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY
 */
export const createVisitor = async (req, res) => {
  try {
    const { name, mobile, photoUrl } = req.body;

    // Validation
    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name and mobile are required',
      });
    }

    // Validate mobile format
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile must be 10 digits',
      });
    }

    // Check if visitor with same mobile already exists
    const existingVisitor = await prisma.visitor.findFirst({
      where: { mobile },
    });

    if (existingVisitor) {
      // Return existing visitor instead of creating duplicate
      return res.status(200).json({
        success: true,
        message: 'Visitor already exists',
        data: { visitor: existingVisitor },
      });
    }

    // Fix sequence if out of sync
    await fixSequence('visitors');

    // Create visitor
    const visitor = await prisma.visitor.create({
      data: {
        name: name.trim(),
        mobile,
        photoUrl: photoUrl || null,
      },
    });

    // Log visitor creation
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.CREATE_VISITOR,
      entity: AUDIT_ENTITIES.VISITOR,
      entityId: visitor.id,
      description: `Visitor "${visitor.name}" (${visitor.mobile}) created`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Visitor created successfully',
      data: { visitor },
    });
  } catch (error) {
    console.error('Create visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create visitor',
      error: error.message,
    });
  }
};

/**
 * Search/Get all visitors
 * GET /api/v1/visitors
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT
 */
export const getVisitors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, mobile } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
      ];
    }

    if (mobile) {
      where.mobile = mobile;
    }

    // RESIDENT can only see visitors who have visited their society
    if (req.user.role_name === 'RESIDENT') {
      // Get visitor logs for this resident's society
      const visitorLogs = await prisma.visitorLog.findMany({
        where: {
          societyId: req.user.society_id,
        },
        select: {
          visitorId: true,
        },
        distinct: ['visitorId'],
      });

      const visitorIds = visitorLogs.map(log => log.visitorId);

      if (visitorIds.length === 0) {
        return res.json({
          success: true,
          message: 'Visitors retrieved successfully',
          data: {
            visitors: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0,
            },
          },
        });
      }

      where.id = { in: visitorIds };
    }

    const [visitors, total] = await Promise.all([
      prisma.visitor.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { visitorLogs: true },
          },
        },
      }),
      prisma.visitor.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Visitors retrieved successfully',
      data: {
        visitors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get visitors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitors',
      error: error.message,
    });
  }
};

/**
 * Get visitor by ID
 * GET /api/v1/visitors/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT
 */
export const getVisitorById = async (req, res) => {
  try {
    const { id } = req.params;
    const visitorId = parseInt(id);

    if (isNaN(visitorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visitor ID',
      });
    }

    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
      include: {
        _count: {
          select: { visitorLogs: true },
        },
      },
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    // RESIDENT can only view visitors who have visited their society
    if (req.user.role_name === 'RESIDENT') {
      const hasVisitedSociety = await prisma.visitorLog.findFirst({
        where: {
          visitorId: visitorId,
          societyId: req.user.society_id,
        },
      });

      if (!hasVisitedSociety) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view visitors who have visited your society.',
        });
      }
    }

    res.json({
      success: true,
      message: 'Visitor retrieved successfully',
      data: { visitor },
    });
  } catch (error) {
    console.error('Get visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve visitor',
      error: error.message,
    });
  }
};

/**
 * Update visitor
 * PUT /api/v1/visitors/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY
 */
export const updateVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitorId = parseInt(id);
    const { name, mobile, photoUrl } = req.body;

    if (isNaN(visitorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visitor ID',
      });
    }

    // Check if visitor exists
    const existingVisitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
    });

    if (!existingVisitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    // Validate mobile if provided
    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile must be 10 digits',
      });
    }

    // Check if mobile already exists (if changed)
    if (mobile && mobile !== existingVisitor.mobile) {
      const mobileExists = await prisma.visitor.findFirst({
        where: { mobile },
      });

      if (mobileExists) {
        return res.status(400).json({
          success: false,
          message: 'Visitor with this mobile number already exists',
        });
      }
    }

    // Update visitor
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (mobile) updateData.mobile = mobile;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    const visitor = await prisma.visitor.update({
      where: { id: visitorId },
      data: updateData,
    });

    // Build description of what changed
    const changes = [];
    if (name && name.trim() !== existingVisitor.name) changes.push(`name: "${existingVisitor.name}" → "${name.trim()}"`);
    if (mobile && mobile !== existingVisitor.mobile) changes.push(`mobile: "${existingVisitor.mobile}" → "${mobile}"`);
    if (photoUrl !== undefined && photoUrl !== existingVisitor.photoUrl) changes.push('photo updated');

    const description = changes.length > 0
      ? `Visitor "${visitor.name}" updated: ${changes.join(', ')}`
      : `Visitor "${visitor.name}" updated`;

    // Log visitor update
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.UPDATE_VISITOR,
      entity: AUDIT_ENTITIES.VISITOR,
      entityId: visitor.id,
      description,
      req,
    });

    res.json({
      success: true,
      message: 'Visitor updated successfully',
      data: { visitor },
    });
  } catch (error) {
    console.error('Update visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update visitor',
      error: error.message,
    });
  }
};

/**
 * Delete visitor
 * DELETE /api/v1/visitors/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN only
 */
export const deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitorId = parseInt(id);

    if (isNaN(visitorId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid visitor ID',
      });
    }

    // Check if visitor exists
    const visitor = await prisma.visitor.findUnique({
      where: { id: visitorId },
      include: {
        _count: {
          select: { visitorLogs: true },
        },
      },
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor not found',
      });
    }

    // Check if visitor has logs
    if (visitor._count.visitorLogs > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete visitor with existing visitor logs. Please remove visitor logs first.',
      });
    }

    // Log visitor deletion before deleting
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.DELETE_VISITOR,
      entity: AUDIT_ENTITIES.VISITOR,
      entityId: visitor.id,
      description: `Visitor "${visitor.name}" (${visitor.mobile}) deleted`,
      req,
    });

    // Delete visitor
    await prisma.visitor.delete({
      where: { id: visitorId },
    });

    res.json({
      success: true,
      message: 'Visitor deleted successfully',
    });
  } catch (error) {
    console.error('Delete visitor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete visitor',
      error: error.message,
    });
  }
};

/**
 * Search visitors by mobile or name
 * GET /api/v1/visitors/search
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT
 */
export const searchVisitors = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters',
      });
    }

    const searchQuery = q.trim();

    // Build where clause
    const where = {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { mobile: { contains: searchQuery } },
      ],
    };

    // RESIDENT can only see visitors who have visited their society
    if (req.user.role_name === 'RESIDENT') {
      const visitorLogs = await prisma.visitorLog.findMany({
        where: {
          societyId: req.user.society_id,
        },
        select: {
          visitorId: true,
        },
        distinct: ['visitorId'],
      });

      const visitorIds = visitorLogs.map(log => log.visitorId);

      if (visitorIds.length === 0) {
        return res.json({
          success: true,
          message: 'No visitors found',
          data: { visitors: [] },
        });
      }

      where.id = { in: visitorIds };
    }

    const visitors = await prisma.visitor.findMany({
      where,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        mobile: true,
        photoUrl: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      message: 'Visitors found',
      data: { visitors },
    });
  } catch (error) {
    console.error('Search visitors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search visitors',
      error: error.message,
    });
  }
};

