import prisma from '../../lib/prisma.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { fixSequence } from '../../utils/sequenceFix.js';

/**
 * Generate a unique 6-digit access code
 * Format: GV-XXXXXX (e.g., GV-483921)
 */
const generateAccessCode = (prefix = 'GV') => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomNum}`;
};

/**
 * Create pre-approved guest
 * POST /api/v1/pre-approvals
 * Access: RESIDENT only
 */
export const createPreApproval = async (req, res) => {
  try {
    const { unitId, guestName, guestMobile, validFrom, validTill, maxUses = 1 } = req.body;

    // Validation
    if (!unitId) {
      return res.status(400).json({
        success: false,
        message: 'unitId is required',
      });
    }

    if (!validFrom || !validTill) {
      return res.status(400).json({
        success: false,
        message: 'validFrom and validTill are required',
      });
    }

    const validFromDate = new Date(validFrom);
    const validTillDate = new Date(validTill);

    if (validTillDate <= validFromDate) {
      return res.status(400).json({
        success: false,
        message: 'validTill must be after validFrom',
      });
    }

    if (maxUses < 1) {
      return res.status(400).json({
        success: false,
        message: 'maxUses must be at least 1',
      });
    }

    // Check if resident is a member of the unit
    const isMember = await prisma.unitMember.findFirst({
      where: {
        unitId: parseInt(unitId),
        userId: req.user.id,
      },
    });

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only create pre-approvals for your units.',
      });
    }

    // Get unit to verify society
    const unit = await prisma.unit.findUnique({
      where: { id: parseInt(unitId) },
      select: {
        id: true,
        societyId: true,
        unitNo: true,
      },
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
        message: 'Access denied. Unit does not belong to your society.',
      });
    }

    // Generate unique access code
    let accessCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      accessCode = generateAccessCode();
      const existing = await prisma.preApprovedGuest.findUnique({
        where: { accessCode },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate unique access code. Please try again.',
      });
    }

    // Fix sequence if out of sync
    await fixSequence('pre_approved_guests');

    // Create pre-approval
    const preApproval = await prisma.preApprovedGuest.create({
      data: {
        societyId: unit.societyId,
        unitId: parseInt(unitId),
        residentId: req.user.id,
        guestName: guestName || null,
        guestMobile: guestMobile || null,
        accessCode,
        validFrom: validFromDate,
        validTill: validTillDate,
        maxUses: parseInt(maxUses),
        usedCount: 0,
        status: 'ACTIVE',
      },
      include: {
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
          },
        },
        resident: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    });

    // Log pre-approval creation
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.PRE_APPROVAL_CREATED,
      entity: AUDIT_ENTITIES.PRE_APPROVED_GUEST,
      entityId: preApproval.id,
      description: `Pre-approval code ${accessCode} created for unit ${preApproval.unit.unitNo}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Pre-approval created successfully',
      data: { preApproval },
    });
  } catch (error) {
    console.error('Create pre-approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create pre-approval',
      error: error.message,
    });
  }
};

/**
 * Get all pre-approvals for resident
 * GET /api/v1/pre-approvals
 * Access: RESIDENT only
 */
export const getPreApprovals = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      residentId: req.user.id,
    };

    if (status) {
      where.status = status;
    }

    const [preApprovals, total] = await Promise.all([
      prisma.preApprovedGuest.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          unit: {
            select: {
              id: true,
              unitNo: true,
              unitType: true,
            },
          },
        },
      }),
      prisma.preApprovedGuest.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Pre-approvals retrieved successfully',
      data: {
        preApprovals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get pre-approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pre-approvals',
      error: error.message,
    });
  }
};

/**
 * Get pre-approval by ID
 * GET /api/v1/pre-approvals/:id
 * Access: RESIDENT only
 */
export const getPreApprovalById = async (req, res) => {
  try {
    const { id } = req.params;
    const preApprovalId = parseInt(id);

    if (isNaN(preApprovalId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pre-approval ID',
      });
    }

    const preApproval = await prisma.preApprovedGuest.findUnique({
      where: { id: preApprovalId },
      include: {
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
          },
        },
        resident: {
          select: {
            id: true,
            name: true,
            mobile: true,
          },
        },
      },
    });

    if (!preApproval) {
      return res.status(404).json({
        success: false,
        message: 'Pre-approval not found',
      });
    }

    // Check if resident owns this pre-approval
    if (preApproval.residentId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own pre-approvals.',
      });
    }

    res.json({
      success: true,
      message: 'Pre-approval retrieved successfully',
      data: { preApproval },
    });
  } catch (error) {
    console.error('Get pre-approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pre-approval',
      error: error.message,
    });
  }
};

/**
 * Revoke pre-approval
 * POST /api/v1/pre-approvals/:id/revoke
 * Access: RESIDENT only
 */
export const revokePreApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const preApprovalId = parseInt(id);

    if (isNaN(preApprovalId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pre-approval ID',
      });
    }

    const preApproval = await prisma.preApprovedGuest.findUnique({
      where: { id: preApprovalId },
    });

    if (!preApproval) {
      return res.status(404).json({
        success: false,
        message: 'Pre-approval not found',
      });
    }

    // Check if resident owns this pre-approval
    if (preApproval.residentId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only revoke your own pre-approvals.',
      });
    }

    // Check if already revoked or used
    if (preApproval.status === 'REVOKED' || preApproval.status === 'USED') {
      return res.status(400).json({
        success: false,
        message: `Pre-approval is already ${preApproval.status.toLowerCase()}`,
        data: { preApproval },
      });
    }

    // Update status to REVOKED
    const updated = await prisma.preApprovedGuest.update({
      where: { id: preApprovalId },
      data: { status: 'REVOKED' },
      include: {
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
          },
        },
      },
    });

    // Log pre-approval revocation
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.PRE_APPROVAL_REVOKED,
      entity: AUDIT_ENTITIES.PRE_APPROVED_GUEST,
      entityId: preApproval.id,
      description: `Pre-approval code ${preApproval.accessCode} revoked`,
      req,
    });

    res.json({
      success: true,
      message: 'Pre-approval revoked successfully',
      data: { preApproval: updated },
    });
  } catch (error) {
    console.error('Revoke pre-approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke pre-approval',
      error: error.message,
    });
  }
};

/**
 * Verify pre-approval code and create visitor entry
 * POST /api/v1/pre-approvals/verify
 * Access: SECURITY only
 */
export const verifyPreApprovalCode = async (req, res) => {
  try {
    const { accessCode, gateId, visitorId } = req.body;

    if (!accessCode) {
      return res.status(400).json({
        success: false,
        message: 'accessCode is required',
      });
    }

    if (!gateId) {
      return res.status(400).json({
        success: false,
        message: 'gateId is required',
      });
    }

    // Security guard must have a society
    if (!req.user.society_id) {
      return res.status(403).json({
        success: false,
        message: 'Security guard must be associated with a society',
      });
    }

    // Find pre-approval by code
    const preApproval = await prisma.preApprovedGuest.findUnique({
      where: { accessCode },
      include: {
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
            societyId: true,
          },
        },
      },
    });

    if (!preApproval) {
      return res.status(404).json({
        success: false,
        message: 'Invalid access code',
      });
    }

    // Check if pre-approval belongs to security's society
    if (preApproval.societyId !== req.user.society_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This code does not belong to your society.',
      });
    }

    // Verify gate belongs to society
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

    const now = new Date();

    // Validate code status and validity
    if (preApproval.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: `Code is ${preApproval.status.toLowerCase()}`,
        data: { preApproval },
      });
    }

    if (now < preApproval.validFrom) {
      return res.status(400).json({
        success: false,
        message: 'Code is not yet valid',
        data: { preApproval },
      });
    }

    if (now > preApproval.validTill) {
      // Auto-expire if past validTill
      await prisma.preApprovedGuest.update({
        where: { id: preApproval.id },
        data: { status: 'EXPIRED' },
      });

      return res.status(400).json({
        success: false,
        message: 'Code has expired',
        data: { preApproval },
      });
    }

    if (preApproval.usedCount >= preApproval.maxUses) {
      // Auto-mark as used if max uses reached
      await prisma.preApprovedGuest.update({
        where: { id: preApproval.id },
        data: { status: 'USED' },
      });

      return res.status(400).json({
        success: false,
        message: 'Code has reached maximum uses',
        data: { preApproval },
      });
    }

    // Create or find visitor if visitorId provided
    let finalVisitorId = visitorId ? parseInt(visitorId) : null;

    if (!finalVisitorId && preApproval.guestMobile) {
      // Try to find existing visitor by mobile
      const existingVisitor = await prisma.visitor.findFirst({
        where: { mobile: preApproval.guestMobile },
      });

      if (existingVisitor) {
        finalVisitorId = existingVisitor.id;
      } else if (preApproval.guestName) {
        // Fix sequence if out of sync
        await fixSequence('visitors');
        
        // Create new visitor if mobile exists but visitor doesn't
        const newVisitor = await prisma.visitor.create({
          data: {
            name: preApproval.guestName,
            mobile: preApproval.guestMobile,
          },
        });
        finalVisitorId = newVisitor.id;
      }
    }

    // Fix sequence if out of sync
    await fixSequence('visitor_logs');

    // Create visitor log entry (auto-approved)
    const visitorLog = await prisma.visitorLog.create({
      data: {
        societyId: preApproval.societyId,
        gateId: parseInt(gateId),
        visitorId: finalVisitorId,
        unitId: preApproval.unitId,
        purpose: `Pre-approved guest - Code: ${accessCode}`,
        entryTime: new Date(),
        status: 'approved', // Auto-approved
        createdBy: req.user.id,
        preApprovalId: preApproval.id,
      },
      include: {
        visitor: {
          select: {
            id: true,
            name: true,
            mobile: true,
            photoUrl: true,
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

    // Update pre-approval usage count
    const newUsedCount = preApproval.usedCount + 1;
    const newStatus = newUsedCount >= preApproval.maxUses ? 'USED' : 'ACTIVE';

    const updatedPreApproval = await prisma.preApprovedGuest.update({
      where: { id: preApproval.id },
      data: {
        usedCount: newUsedCount,
        status: newStatus,
      },
    });

    // Log pre-approval code usage
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.PRE_APPROVAL_USED,
      entity: AUDIT_ENTITIES.PRE_APPROVED_GUEST,
      entityId: preApproval.id,
      description: `Pre-approval code ${accessCode} used for visitor entry (visitor log ID: ${visitorLog.id})`,
      req,
    });

    res.json({
      success: true,
      message: 'Access code verified and entry approved successfully',
      data: {
        visitorLog,
        preApproval: updatedPreApproval,
        unit: preApproval.unit,
      },
    });
  } catch (error) {
    console.error('Verify pre-approval code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify access code',
      error: error.message,
    });
  }
};


