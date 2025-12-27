import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';

/**
 * Create a new gate
 * POST /api/v1/gates
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const createGate = async (req, res) => {
  try {
    const { name, societyId } = req.body;

    // Validation
    if (!name || !societyId) {
      return res.status(400).json({
        success: false,
        message: 'Name and societyId are required',
      });
    }

    // If user is SOCIETY_ADMIN, only allow creating gates for their own society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== parseInt(societyId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create gates for your own society.',
      });
    }

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id: parseInt(societyId) },
    });

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found',
      });
    }

    // Check if gate with same name already exists for this society
    const existingGate = await prisma.gate.findFirst({
      where: {
        societyId: parseInt(societyId),
        name: name.trim(),
      },
    });

    if (existingGate) {
      return res.status(400).json({
        success: false,
        message: 'Gate with this name already exists for this society',
      });
    }

    // Create gate
    const gate = await prisma.gate.create({
      data: {
        name: name.trim(),
        societyId: parseInt(societyId),
      },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Log gate creation
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.CREATE_GATE,
      entity: AUDIT_ENTITIES.GATE,
      entityId: gate.id,
      description: `Gate "${gate.name}" created for society "${gate.society.name}"`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Gate created successfully',
      data: { gate },
    });
  } catch (error) {
    console.error('Create gate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gate',
      error: error.message,
    });
  }
};

/**
 * Get all gates
 * GET /api/v1/gates
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY
 */
export const getGates = async (req, res) => {
  try {
    const { page = 1, limit = 10, societyId, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    
    if (societyId) {
      where.societyId = parseInt(societyId);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If user is SOCIETY_ADMIN or SECURITY, only show gates from their society
    if ((req.user.role_name === 'SOCIETY_ADMIN' || req.user.role_name === 'SECURITY') && req.user.society_id) {
      where.societyId = req.user.society_id;
    }

    const [gates, total] = await Promise.all([
      prisma.gate.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          society: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: { visitorLogs: true },
          },
        },
      }),
      prisma.gate.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Gates retrieved successfully',
      data: {
        gates,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get gates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve gates',
      error: error.message,
    });
  }
};

/**
 * Get gate by ID
 * GET /api/v1/gates/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY (own society only)
 */
export const getGateById = async (req, res) => {
  try {
    const { id } = req.params;
    const gateId = parseInt(id);

    if (isNaN(gateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gate ID',
      });
    }

    const gate = await prisma.gate.findUnique({
      where: { id: gateId },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: { visitorLogs: true },
        },
      },
    });

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'Gate not found',
      });
    }

    // If user is SOCIETY_ADMIN or SECURITY, only allow access to gates from their society
    if ((req.user.role_name === 'SOCIETY_ADMIN' || req.user.role_name === 'SECURITY') && req.user.society_id !== gate.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view gates from your own society.',
      });
    }

    res.json({
      success: true,
      message: 'Gate retrieved successfully',
      data: { gate },
    });
  } catch (error) {
    console.error('Get gate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve gate',
      error: error.message,
    });
  }
};

/**
 * Update gate
 * PUT /api/v1/gates/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const updateGate = async (req, res) => {
  try {
    const { id } = req.params;
    const gateId = parseInt(id);
    const { name } = req.body;

    if (isNaN(gateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gate ID',
      });
    }

    // Check if gate exists
    const existingGate = await prisma.gate.findUnique({
      where: { id: gateId },
    });

    if (!existingGate) {
      return res.status(404).json({
        success: false,
        message: 'Gate not found',
      });
    }

    // If user is SOCIETY_ADMIN, only allow updating gates from their society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== existingGate.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update gates from your own society.',
      });
    }

    // Check if gate with same name already exists for this society (if name is being changed)
    if (name && name.trim() !== existingGate.name) {
      const duplicateGate = await prisma.gate.findFirst({
        where: {
          societyId: existingGate.societyId,
          name: name.trim(),
          id: { not: gateId },
        },
      });

      if (duplicateGate) {
        return res.status(400).json({
          success: false,
          message: 'Gate with this name already exists for this society',
        });
      }
    }

    // Update gate
    const updateData = {};
    if (name) updateData.name = name.trim();

    const gate = await prisma.gate.update({
      where: { id: gateId },
      data: updateData,
      include: {
        society: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Build description of what changed
    const changes = [];
    if (name && name.trim() !== existingGate.name) {
      changes.push(`name: "${existingGate.name}" → "${name.trim()}"`);
    }

    const description = changes.length > 0
      ? `Gate "${gate.name}" updated: ${changes.join(', ')}`
      : `Gate "${gate.name}" updated`;

    // Log gate update
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.UPDATE_GATE,
      entity: AUDIT_ENTITIES.GATE,
      entityId: gate.id,
      description,
      req,
    });

    res.json({
      success: true,
      message: 'Gate updated successfully',
      data: { gate },
    });
  } catch (error) {
    console.error('Update gate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gate',
      error: error.message,
    });
  }
};

/**
 * Delete gate
 * DELETE /api/v1/gates/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const deleteGate = async (req, res) => {
  try {
    const { id } = req.params;
    const gateId = parseInt(id);

    if (isNaN(gateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gate ID',
      });
    }

    // Check if gate exists
    const gate = await prisma.gate.findUnique({
      where: { id: gateId },
      include: {
        _count: {
          select: { visitorLogs: true },
        },
      },
    });

    if (!gate) {
      return res.status(404).json({
        success: false,
        message: 'Gate not found',
      });
    }

    // If user is SOCIETY_ADMIN, only allow deleting gates from their society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== gate.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete gates from your own society.',
      });
    }

    // Check if gate has visitor logs
    if (gate._count.visitorLogs > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete gate with existing visitor logs. Please remove visitor logs first.',
      });
    }

    // Log gate deletion before deleting
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.DELETE_GATE,
      entity: AUDIT_ENTITIES.GATE,
      entityId: gate.id,
      description: `Gate "${gate.name}" deleted`,
      req,
    });

    // Delete gate
    await prisma.gate.delete({
      where: { id: gateId },
    });

    res.json({
      success: true,
      message: 'Gate deleted successfully',
    });
  } catch (error) {
    console.error('Delete gate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gate',
      error: error.message,
    });
  }
};

