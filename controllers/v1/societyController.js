import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Create a new society
 * POST /api/v1/societies
 * Access: SUPER_ADMIN only
 */
export const createSociety = async (req, res) => {
  try {
    const { name, type, address, city, state, pincode, subscriptionId } = req.body;

    // Validation
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required',
      });
    }

    if (!['apartment', 'office'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "apartment" or "office"',
      });
    }

    // Fix sequence if out of sync
    await fixSequence('societies');

    // Create society
    const society = await prisma.society.create({
      data: {
        name,
        type: type.toLowerCase(),
        address,
        city,
        state,
        pincode,
        subscriptionId,
        status: 'active',
      },
    });

    // Log society creation
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.CREATE_SOCIETY,
      entity: AUDIT_ENTITIES.SOCIETY,
      entityId: society.id,
      description: `Society "${society.name}" created (${society.type})`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Society created successfully',
      data: { society },
    });
  } catch (error) {
    console.error('Create society error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create society',
      error: error.message,
    });
  }
};

/**
 * Get all societies
 * GET /api/v1/societies
 * Access: SUPER_ADMIN only
 */
export const getSocieties = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search, source } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type.toLowerCase();
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [societies, total] = await Promise.all([
      prisma.society.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      prisma.society.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Societies retrieved successfully',
      data: {
        societies,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get societies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve societies',
      error: error.message,
    });
  }
};

/**
 * Get society by ID
 * GET /api/v1/societies/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const getSocietyById = async (req, res) => {
  try {
    const { id } = req.params;
    const societyId = parseInt(id);

    if (isNaN(societyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID',
      });
    }

    // If user is SOCIETY_ADMIN, only allow access to their own society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own society.',
      });
    }

    const society = await prisma.society.findUnique({
      where: { id: societyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found',
      });
    }

    res.json({
      success: true,
      message: 'Society retrieved successfully',
      data: { society },
    });
  } catch (error) {
    console.error('Get society error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve society',
      error: error.message,
    });
  }
};

/**
 * Update society
 * PUT /api/v1/societies/:id
 * Access: SUPER_ADMIN only
 */
export const updateSociety = async (req, res) => {
  try {
    const { id } = req.params;
    const societyId = parseInt(id);
    const { name, type, address, city, state, pincode, subscriptionId, status } = req.body;

    if (isNaN(societyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID',
      });
    }

    // Check if society exists
    const existingSociety = await prisma.society.findUnique({
      where: { id: societyId },
    });

    if (!existingSociety) {
      return res.status(404).json({
        success: false,
        message: 'Society not found',
      });
    }

    // Validate type if provided
    if (type && !['apartment', 'office'].includes(type.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Type must be either "apartment" or "office"',
      });
    }

    // Validate status if provided
    if (status && !['active', 'expired'].includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "active" or "expired"',
      });
    }

    // Update society
    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type.toLowerCase();
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (subscriptionId !== undefined) updateData.subscriptionId = subscriptionId;
    if (status) updateData.status = status.toLowerCase();

    const society = await prisma.society.update({
      where: { id: societyId },
      data: updateData,
    });

    // Build description of what changed
    const changes = [];
    if (name && name !== existingSociety.name) changes.push(`name: "${existingSociety.name}" → "${name}"`);
    if (type && type.toLowerCase() !== existingSociety.type) changes.push(`type: "${existingSociety.type}" → "${type.toLowerCase()}"`);
    if (status && status.toLowerCase() !== existingSociety.status) changes.push(`status: "${existingSociety.status}" → "${status.toLowerCase()}"`);
    if (address !== undefined && address !== existingSociety.address) changes.push('address updated');
    if (city !== undefined && city !== existingSociety.city) changes.push(`city: "${existingSociety.city || 'N/A'}" → "${city || 'N/A'}"`);
    if (state !== undefined && state !== existingSociety.state) changes.push(`state: "${existingSociety.state || 'N/A'}" → "${state || 'N/A'}"`);
    if (pincode !== undefined && pincode !== existingSociety.pincode) changes.push('pincode updated');
    if (subscriptionId !== undefined && subscriptionId !== existingSociety.subscriptionId) changes.push(`subscriptionId: ${existingSociety.subscriptionId || 'N/A'} → ${subscriptionId || 'N/A'}`);

    const description = changes.length > 0
      ? `Society "${society.name}" updated: ${changes.join(', ')}`
      : `Society "${society.name}" updated`;

    // Log society update
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.UPDATE_SOCIETY,
      entity: AUDIT_ENTITIES.SOCIETY,
      entityId: society.id,
      description,
      req,
    });

    res.json({
      success: true,
      message: 'Society updated successfully',
      data: { society },
    });
  } catch (error) {
    console.error('Update society error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update society',
      error: error.message,
    });
  }
};

/**
 * Delete society
 * DELETE /api/v1/societies/:id
 * Access: SUPER_ADMIN only
 */
export const deleteSociety = async (req, res) => {
  try {
    const { id } = req.params;
    const societyId = parseInt(id);

    if (isNaN(societyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid society ID',
      });
    }

    // Check if society exists
    const society = await prisma.society.findUnique({
      where: { id: societyId },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found',
      });
    }

    // Check if society has users
    if (society._count.users > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete society with existing users. Please remove users first.',
      });
    }

    // Log society deletion before deleting
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.DELETE_SOCIETY,
      entity: AUDIT_ENTITIES.SOCIETY,
      entityId: society.id,
      description: `Society "${society.name}" deleted`,
      req,
    });

    // Delete society
    await prisma.society.delete({
      where: { id: societyId },
    });

    res.json({
      success: true,
      message: 'Society deleted successfully',
    });
  } catch (error) {
    console.error('Delete society error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete society',
      error: error.message,
    });
  }
};

