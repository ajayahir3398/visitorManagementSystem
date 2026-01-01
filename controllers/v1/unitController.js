import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';
import busboy from 'busboy';
import csv from 'csv-parser';

/**
 * Create a new unit
 * POST /api/v1/units
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const createUnit = async (req, res) => {
  try {
    const { unitNo, unitType, societyId, status, floor, block } = req.body;

    // Validation
    if (!unitNo || !societyId) {
      return res.status(400).json({
        success: false,
        message: 'unitNo and societyId are required',
      });
    }

    // If user is SOCIETY_ADMIN, only allow creating units for their own society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== parseInt(societyId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create units for your own society.',
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

    // Check if unit with same number already exists for this society
    const existingUnit = await prisma.unit.findFirst({
      where: {
        societyId: parseInt(societyId),
        unitNo: unitNo.trim(),
      },
    });

    if (existingUnit) {
      return res.status(400).json({
        success: false,
        message: 'Unit with this number already exists for this society',
      });
    }

    // Fix sequence if out of sync (prevents unique constraint errors on id)
    await fixSequence('units');

    // Create unit
    const unit = await prisma.unit.create({
      data: {
        unitNo: unitNo.trim(),
        unitType: unitType || null,
        societyId: parseInt(societyId),
        floor: floor ? parseInt(floor) : null,
        block: block || null,
        status: status || 'ACTIVE',
      },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: { members: true, visitorLogs: true },
        },
      },
    });

    // Log unit creation
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.CREATE_UNIT,
      entity: AUDIT_ENTITIES.UNIT,
      entityId: unit.id,
      description: `Unit "${unit.unitNo}" created for society "${unit.society.name}"`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Unit created successfully',
      data: { unit },
    });
  } catch (error) {
    console.error('Create unit error:', error);

    // Handle sequence out of sync error (unique constraint on id field)
    // This is a fallback - the automatic fix above should prevent most cases
    if (
      error.code === 'P2002' &&
      error.meta?.modelName === 'Unit' &&
      (error.message?.includes('id') || error.message?.includes('Unique constraint'))
    ) {
      // Try to fix sequence one more time and retry
      try {
        await fixSequence('units');
        // If fix succeeded, retry creating the unit
        const unit = await prisma.unit.create({
          data: {
            unitNo: req.body.unitNo.trim(),
            unitType: req.body.unitType || null,
            societyId: parseInt(req.body.societyId),
            floor: req.body.floor ? parseInt(req.body.floor) : null,
            block: req.body.block || null,
            status: req.body.status || 'ACTIVE',
          },
          include: {
            society: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
            _count: {
              select: { members: true, visitorLogs: true },
            },
          },
        });

        await logAction({
          user: req.user,
          action: AUDIT_ACTIONS.CREATE_UNIT,
          entity: AUDIT_ENTITIES.UNIT,
          entityId: unit.id,
          description: `Unit "${unit.unitNo}" created for society "${unit.society.name}"`,
          req,
        });

        return res.status(201).json({
          success: true,
          message: 'Unit created successfully (after sequence fix)',
          data: { unit },
        });
      } catch (retryError) {
        return res.status(500).json({
          success: false,
          message: 'Database sequence error. The ID sequence for units table is out of sync.',
          error: 'Please run: npm run fix:sequences',
          details: 'Automatic sequence fix failed. Please run the fix script manually.',
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create unit',
      error: error.message,
    });
  }
};

/**
 * Get all units
 * GET /api/v1/units
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT
 */
export const getUnits = async (req, res) => {
  try {
    const { page = 1, limit = 10, societyId, status, unitType, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    if (societyId) {
      where.societyId = parseInt(societyId);
    }

    if (status) {
      where.status = status;
    }

    if (unitType) {
      where.unitType = unitType;
    }

    if (search) {
      where.OR = [
        { unitNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If user is SOCIETY_ADMIN, SECURITY, or RESIDENT, only show units from their society
    if (['SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'].includes(req.user.role_name) && req.user.society_id) {
      where.societyId = req.user.society_id;
    }

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { unitNo: 'asc' },
        include: {
          society: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: { members: true, visitorLogs: true },
          },
        },
      }),
      prisma.unit.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Units retrieved successfully',
      data: {
        units,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get units error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve units',
      error: error.message,
    });
  }
};

/**
 * Get unit by ID
 * GET /api/v1/units/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT
 */
export const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const unitId = parseInt(id);

    if (isNaN(unitId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit ID',
      });
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        society: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                mobile: true,
                email: true,
                role: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { visitorLogs: true },
        },
      },
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found',
      });
    }

    // Check access based on role
    if (['SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'].includes(req.user.role_name) && req.user.society_id !== unit.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view units from your own society.',
      });
    }

    res.json({
      success: true,
      message: 'Unit retrieved successfully',
      data: { unit },
    });
  } catch (error) {
    console.error('Get unit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve unit',
      error: error.message,
    });
  }
};

/**
 * Update unit
 * PUT /api/v1/units/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const unitId = parseInt(id);
    const { unitNo, unitType, status, floor, block } = req.body;

    if (isNaN(unitId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit ID',
      });
    }

    // Check if unit exists
    const existingUnit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!existingUnit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found',
      });
    }

    // If user is SOCIETY_ADMIN, only allow updating units from their society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== existingUnit.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update units from your own society.',
      });
    }

    // Check if unit number already exists (if changed)
    if (unitNo && unitNo.trim() !== existingUnit.unitNo) {
      const duplicateUnit = await prisma.unit.findFirst({
        where: {
          societyId: existingUnit.societyId,
          unitNo: unitNo.trim(),
          id: { not: unitId },
        },
      });

      if (duplicateUnit) {
        return res.status(400).json({
          success: false,
          message: 'Unit with this number already exists for this society',
        });
      }
    }

    // Update unit
    const updateData = {};
    if (unitNo) updateData.unitNo = unitNo.trim();
    if (unitType !== undefined) updateData.unitType = unitType;
    if (floor !== undefined) updateData.floor = floor ? parseInt(floor) : null;
    if (block !== undefined) updateData.block = block;
    if (status) updateData.status = status;

    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: updateData,
      include: {
        society: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: { members: true, visitorLogs: true },
        },
      },
    });

    // Build description of what changed
    const changes = [];
    if (unitNo && unitNo.trim() !== existingUnit.unitNo) changes.push(`unitNo: "${existingUnit.unitNo}" → "${unitNo.trim()}"`);
    if (unitType !== undefined && unitType !== existingUnit.unitType) changes.push(`unitType: "${existingUnit.unitType || 'N/A'}" → "${unitType || 'N/A'}"`);
    if (floor !== undefined && floor !== existingUnit.floor) changes.push(`floor: "${existingUnit.floor || 'N/A'}" → "${floor || 'N/A'}"`);
    if (block !== undefined && block !== existingUnit.block) changes.push(`block: "${existingUnit.block || 'N/A'}" → "${block || 'N/A'}"`);
    if (status && status !== existingUnit.status) changes.push(`status: "${existingUnit.status}" → "${status}"`);

    const description = changes.length > 0
      ? `Unit "${unit.unitNo}" updated: ${changes.join(', ')}`
      : `Unit "${unit.unitNo}" updated`;

    // Log unit update
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.UPDATE_UNIT,
      entity: AUDIT_ENTITIES.UNIT,
      entityId: unit.id,
      description,
      req,
    });

    res.json({
      success: true,
      message: 'Unit updated successfully',
      data: { unit },
    });
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update unit',
      error: error.message,
    });
  }
};

/**
 * Delete unit
 * DELETE /api/v1/units/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const unitId = parseInt(id);

    if (isNaN(unitId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit ID',
      });
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        _count: {
          select: { members: true, visitorLogs: true },
        },
      },
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found',
      });
    }

    // If user is SOCIETY_ADMIN, only allow deleting units from their society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== unit.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete units from your own society.',
      });
    }

    // Check if unit has members or visitor logs
    if (unit._count.members > 0 || unit._count.visitorLogs > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete unit with existing members or visitor logs. Please remove them first.',
      });
    }

    // Log unit deletion before deleting
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.DELETE_UNIT,
      entity: AUDIT_ENTITIES.UNIT,
      entityId: unit.id,
      description: `Unit "${unit.unitNo}" deleted`,
      req,
    });

    // Delete unit
    await prisma.unit.delete({
      where: { id: unitId },
    });

    res.json({
      success: true,
      message: 'Unit deleted successfully',
    });
  } catch (error) {
    console.error('Delete unit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete unit',
      error: error.message,
    });
  }
};

/**
 * Add member to unit
 * POST /api/v1/units/:id/members
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const addUnitMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role, isPrimary } = req.body;
    const unitId = parseInt(id);

    if (isNaN(unitId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit ID',
      });
    }

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId and role are required',
      });
    }

    // Check if unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found',
      });
    }

    // Check access
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== unit.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage units from your own society.',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is already a member
    const existingMember = await prisma.unitMember.findUnique({
      where: {
        unitId_userId: {
          unitId,
          userId: parseInt(userId),
        },
      },
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this unit',
      });
    }

    // If setting as primary, unset other primary members
    if (isPrimary) {
      await prisma.unitMember.updateMany({
        where: {
          unitId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Fix sequence if out of sync
    await fixSequence('unit_members');

    // Add member
    const member = await prisma.unitMember.create({
      data: {
        unitId,
        userId: parseInt(userId),
        role: role.toUpperCase(),
        isPrimary: isPrimary || false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true,
          },
        },
        unit: {
          select: {
            id: true,
            unitNo: true,
          },
        },
      },
    });

    // Log unit member addition
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.ADD_UNIT_MEMBER,
      entity: AUDIT_ENTITIES.UNIT,
      entityId: unit.id,
      description: `User "${member.user.name}" added as ${member.role} to unit "${member.unit.unitNo}"${member.isPrimary ? ' (Primary)' : ''}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Member added to unit successfully',
      data: { member },
    });
  } catch (error) {
    console.error('Add unit member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add member to unit',
      error: error.message,
    });
  }
};

/**
 * Remove member from unit
 * DELETE /api/v1/units/:id/members/:memberId
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (own society only)
 */
export const removeUnitMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const unitId = parseInt(id);
    const memberIdInt = parseInt(memberId);

    if (isNaN(unitId) || isNaN(memberIdInt)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid unit ID or member ID',
      });
    }

    // Check if member exists
    const member = await prisma.unitMember.findUnique({
      where: { id: memberIdInt },
      include: {
        unit: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // Check access
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== member.unit.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage units from your own society.',
      });
    }

    // Log unit member removal before deleting
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.REMOVE_UNIT_MEMBER,
      entity: AUDIT_ENTITIES.UNIT,
      entityId: member.unit.id,
      description: `User "${member.user.name}" removed from unit "${member.unit.unitNo}"`,
      req,
    });

    // Remove member
    await prisma.unitMember.delete({
      where: { id: memberIdInt },
    });

    res.json({
      success: true,
      message: 'Member removed from unit successfully',
    });
  } catch (error) {
    console.error('Remove unit member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove member from unit',
      error: error.message,
    });
  }
};

/**
 * Bulk upload units via CSV
 * POST /api/v1/units/bulk-upload
 * Access: SOCIETY_ADMIN only
 */
export const bulkUploadUnits = async (req, res) => {
  try {
    // Check if user is society admin
    if (req.user.role_name !== 'SOCIETY_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Society Admins can upload units.',
      });
    }

    const bb = busboy({ headers: req.headers });
    const units = [];
    const errors = [];
    let fileFound = false;

    bb.on('file', (name, file, info) => {
      // Basic validation
      if (name !== 'file') {
        file.resume();
        return;
      }

      const { mimeType } = info;
      if (mimeType !== 'text/csv' && mimeType !== 'application/vnd.ms-excel') {
        // Just resume stream to consume it
        file.resume();
        errors.push({ error: 'Invalid file type. Only CSV is allowed.' });
        return;
      }

      fileFound = true;

      file
        .pipe(csv())
        .on('data', (row) => {
          // Normalize keys to lowercase/trimmed if needed, or rely on specific CSV headers
          // Expecting: unit_no, unit_type, floor, block
          // Or keys might be case-sensitive depending on csv-parser config. Default is case-sensitive headers.
          // Let's assume headers are as specified: 'unit_no', 'unit_type', 'floor', 'block'

          if (!row.unit_no) {
            errors.push({ row, error: 'unit_no is required' });
            return;
          }

          units.push({
            societyId: req.user.society_id,
            unitNo: row.unit_no.trim(),
            unitType: row.unit_type?.toUpperCase() || 'FLAT',
            floor: row.floor ? parseInt(row.floor) : null,
            block: row.block?.trim() || null,
            status: 'ACTIVE',
          });
        })
        .on('error', (err) => {
          console.error('CSV parse error:', err);
          errors.push({ error: 'Failed to parse CSV file.' });
        });
    });

    bb.on('close', async () => {
      if (!fileFound) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded or invalid field name. Key must be "file".',
        });
      }

      if (units.length === 0 && errors.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid units found in CSV.',
        });
      }

      if (units.length > 0) {
        try {
          const results = {
            success: [],
            failed: [],
          };

          // Iterate and create units individually to capture per-item status
          for (const unit of units) {
            try {
              const createdUnit = await prisma.unit.create({
                data: unit,
              });
              results.success.push({
                unitNo: createdUnit.unitNo,
                unitType: createdUnit.unitType,
                floor: createdUnit.floor,
                block: createdUnit.block,
              });
            } catch (err) {
              let reason = err.message;
              if (err.code === 'P2002') {
                reason = 'Unit already exists';
              }
              results.failed.push({
                unitNo: unit.unitNo,
                reason: reason,
              });
            }
          }

          // Log action
          const successCount = results.success.length;
          const failedCount = results.failed.length;

          await logAction({
            user: req.user,
            action: 'BULK_UNITS_CREATED',
            entity: AUDIT_ENTITIES.UNIT,
            description: `Bulk upload: ${successCount} created, ${failedCount} failed`,
            req,
          });

          res.json({
            success: true,
            message: 'Bulk upload processing completed',
            data: results,
          });
        } catch (dbError) {
          console.error('Bulk insert error:', dbError);
          res.status(500).json({
            success: false,
            message: 'Database error during bulk insert',
            error: dbError.message,
          });
        }
      } else {
        // Only errors
        res.status(400).json({
          success: false,
          message: 'Failed to process units',
          data: { errors },
        });
      }
    });

    req.pipe(bb);
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during upload',
      error: error.message,
    });
  }
};

/**
 * Bulk delete units
 * POST /api/v1/units/bulk-delete
 * Access: SOCIETY_ADMIN only
 */
export const bulkDeleteUnits = async (req, res) => {
  try {
    const { unitIds } = req.body;

    // Check if user is society admin
    if (req.user.role_name !== 'SOCIETY_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only Society Admins can delete units.',
      });
    }

    if (!Array.isArray(unitIds) || unitIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'unitIds array is required and must not be empty',
      });
    }

    // Verify all units belong to the society
    const count = await prisma.unit.count({
      where: {
        id: { in: unitIds },
        societyId: req.user.society_id,
      },
    });

    if (count !== unitIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more units not found or do not belong to your society',
      });
    }

    // Delete units
    const result = await prisma.unit.deleteMany({
      where: {
        id: { in: unitIds },
        societyId: req.user.society_id,
      },
    });

    // Log action
    await logAction({
      user: req.user,
      action: 'BULK_UNITS_DELETED',
      entity: AUDIT_ENTITIES.UNIT,
      description: `${result.count} units deleted via bulk delete`,
      req,
    });

    res.json({
      success: true,
      message: 'Units deleted successfully',
      data: {
        deletedCount: result.count,
      },
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete units',
      error: error.message,
    });
  }
};

