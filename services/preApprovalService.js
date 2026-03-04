import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';
import { normalizeBase64Image } from '../utils/image.js';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const generateAccessCode = (prefix = 'GV') => {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomNum}`;
};

export const PreApprovalService = {
  createPreApproval: async ({
    guestName,
    guestMobile,
    validFrom,
    validTill,
    maxUses = 1,
    unitId,
    photoBase64,
    reqUser,
  }) => {
    const userUnits = await prisma.unitMember.findMany({
      where: { userId: reqUser.id },
      include: { unit: { select: { id: true, societyId: true, unitNo: true } } },
    });

    if (userUnits.length === 0) {
      throw {
        status: 403,
        message: 'Access denied. You must be associated with a unit to create pre-approvals.',
      };
    }

    let selectedUnit;
    if (unitId) {
      const unitMember = userUnits.find((um) => um.unitId === parseInt(unitId));
      if (!unitMember) {
        throw {
          status: 403,
          message: 'Access denied. You are not associated with the specified unit.',
        };
      }
      selectedUnit = unitMember.unit;
    } else {
      const selectedUnitMember = userUnits.find((um) => um.isPrimary) || userUnits[0];
      selectedUnit = selectedUnitMember.unit;
    }

    if (!validFrom || !validTill) {
      throw { status: 400, message: 'validFrom and validTill are required' };
    }

    const validFromDate = new Date(validFrom);
    const validTillDate = new Date(validTill);

    if (validTillDate <= validFromDate) {
      throw { status: 400, message: 'validTill must be after validFrom' };
    }

    if (maxUses < 1) {
      throw { status: 400, message: 'maxUses must be at least 1' };
    }

    if (selectedUnit.societyId !== reqUser.society_id) {
      throw { status: 403, message: 'Access denied. Unit does not belong to your society.' };
    }

    let normalizedPhoto = null;
    if (photoBase64 !== undefined) {
      try {
        normalizedPhoto =
          photoBase64 === null
            ? null
            : normalizeBase64Image(photoBase64, { maxBytes: MAX_PHOTO_BYTES });
      } catch (error) {
        throw { status: 400, message: error.message || 'Invalid photo data' };
      }
    }

    let accessCode;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      accessCode = generateAccessCode();
      const existing = await prisma.preApprovedGuest.findUnique({ where: { accessCode } });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      throw { status: 500, message: 'Failed to generate unique access code. Please try again.' };
    }

    await fixSequence('pre_approved_guests');

    const preApproval = await prisma.preApprovedGuest.create({
      data: {
        societyId: selectedUnit.societyId,
        unitId: parseInt(selectedUnit.id),
        residentId: reqUser.id,
        guestName: guestName || null,
        guestMobile: guestMobile || null,
        photoBase64: normalizedPhoto,
        accessCode,
        validFrom: validFromDate,
        validTill: validTillDate,
        maxUses: parseInt(maxUses),
        usedCount: 0,
        status: 'ACTIVE',
      },
      include: {
        unit: { select: { id: true, unitNo: true, unitType: true, floor: true, block: true } },
        resident: { select: { id: true, name: true, mobile: true } },
      },
    });

    return preApproval;
  },

  getPreApprovals: async ({ page = 1, limit = 10, status, reqUser }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { societyId: reqUser.society_id };

    if (reqUser.role_name === 'RESIDENT') {
      where.residentId = reqUser.id;
    }
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
          unit: { select: { id: true, unitNo: true, unitType: true, floor: true, block: true } },
        },
      }),
      prisma.preApprovedGuest.count({ where }),
    ]);

    return { preApprovals, total };
  },

  getPreApprovalById: async ({ preApprovalId, reqUser }) => {
    if (isNaN(preApprovalId)) throw { status: 400, message: 'Invalid pre-approval ID' };

    const preApproval = await prisma.preApprovedGuest.findUnique({
      where: { id: preApprovalId },
      include: {
        unit: { select: { id: true, unitNo: true, unitType: true, floor: true, block: true } },
        resident: { select: { id: true, name: true, mobile: true } },
      },
    });

    if (!preApproval) throw { status: 404, message: 'Pre-approval not found' };

    if (reqUser.role_name === 'RESIDENT') {
      if (preApproval.residentId !== reqUser.id) {
        throw { status: 403, message: 'Access denied. You can only view your own pre-approvals.' };
      }
    } else {
      if (preApproval.societyId !== reqUser.society_id) {
        throw {
          status: 403,
          message: 'Access denied. Pre-approval does not belong to your society.',
        };
      }
    }

    return preApproval;
  },

  revokePreApproval: async ({ preApprovalId, reqUser }) => {
    if (isNaN(preApprovalId)) throw { status: 400, message: 'Invalid pre-approval ID' };

    const preApproval = await prisma.preApprovedGuest.findUnique({
      where: { id: preApprovalId },
    });

    if (!preApproval) throw { status: 404, message: 'Pre-approval not found' };

    if (preApproval.residentId !== reqUser.id) {
      throw { status: 403, message: 'Access denied. You can only revoke your own pre-approvals.' };
    }

    if (preApproval.status === 'REVOKED' || preApproval.status === 'USED') {
      throw {
        status: 400,
        message: `Pre-approval is already ${preApproval.status.toLowerCase()}`,
        data: { preApproval },
      };
    }

    const updated = await prisma.preApprovedGuest.update({
      where: { id: preApprovalId },
      data: { status: 'REVOKED' },
      include: {
        unit: { select: { id: true, unitNo: true, unitType: true, floor: true, block: true } },
      },
    });

    return { preApproval: updated, accessCode: preApproval.accessCode };
  },

  verifyPreApprovalCode: async ({ accessCode, gateId, visitorId, reqUser }) => {
    if (!accessCode) throw { status: 400, message: 'accessCode is required' };
    if (!gateId) throw { status: 400, message: 'gateId is required' };
    if (!reqUser.society_id)
      throw { status: 403, message: 'Security guard must be associated with a society' };

    const preApproval = await prisma.preApprovedGuest.findUnique({
      where: { accessCode },
      include: {
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
            floor: true,
            block: true,
            societyId: true,
          },
        },
      },
    });

    if (!preApproval) throw { status: 404, message: 'Invalid access code' };
    if (preApproval.societyId !== reqUser.society_id)
      throw { status: 403, message: 'Access denied. This code does not belong to your society.' };

    const gate = await prisma.gate.findUnique({ where: { id: parseInt(gateId) } });
    if (!gate) throw { status: 404, message: 'Gate not found' };
    if (gate.societyId !== reqUser.society_id)
      throw { status: 403, message: 'Gate does not belong to your society' };

    const now = new Date();

    // Check if visitor is already inside (has active entry for this pre-approval)
    const activeEntry = await prisma.visitorLog.findFirst({
      where: {
        preApprovalId: preApproval.id,
        entryTime: { not: null },
        exitTime: null,
      },
    });

    if (activeEntry) {
      throw {
        status: 400,
        message: 'Visitor is already inside. Please mark exit before new entry.',
        data: { activeEntry },
      };
    }

    if (preApproval.status !== 'ACTIVE')
      throw {
        status: 400,
        message: `Code is ${preApproval.status.toLowerCase()}`,
        data: { preApproval },
      };
    if (now < preApproval.validFrom)
      throw { status: 400, message: 'Code is not yet valid', data: { preApproval } };
    if (now > preApproval.validTill) {
      await prisma.preApprovedGuest.update({
        where: { id: preApproval.id },
        data: { status: 'EXPIRED' },
      });
      throw {
        status: 400,
        message: 'Code has expired',
        data: { preApproval: { ...preApproval, status: 'EXPIRED' } },
      };
    }
    if (preApproval.usedCount >= preApproval.maxUses) {
      await prisma.preApprovedGuest.update({
        where: { id: preApproval.id },
        data: { status: 'USED' },
      });
      throw {
        status: 400,
        message: 'Code has reached maximum uses',
        data: { preApproval: { ...preApproval, status: 'USED' } },
      };
    }

    let finalVisitorId = visitorId ? parseInt(visitorId) : null;

    if (!finalVisitorId && preApproval.guestMobile) {
      const existingVisitor = await prisma.visitor.findFirst({
        where: { mobile: preApproval.guestMobile },
      });
      if (existingVisitor) {
        finalVisitorId = existingVisitor.id;
      } else if (preApproval.guestName) {
        await fixSequence('visitors');
        const newVisitor = await prisma.visitor.create({
          data: {
            name: preApproval.guestName,
            mobile: preApproval.guestMobile,
            photoBase64: preApproval.photoBase64 || null,
          },
        });
        finalVisitorId = newVisitor.id;
      }
    }

    if (finalVisitorId && preApproval.photoBase64) {
      await prisma.visitor.update({
        where: { id: finalVisitorId },
        data: { photoBase64: preApproval.photoBase64 },
      });
    }

    await fixSequence('visitor_logs');
    const visitorLog = await prisma.visitorLog.create({
      data: {
        societyId: preApproval.societyId,
        gateId: parseInt(gateId),
        visitorId: finalVisitorId,
        unitId: preApproval.unitId,
        purpose: `Pre-approved guest - Code: ${accessCode}`,
        entryTime: new Date(),
        status: 'APPROVED',
        createdBy: reqUser.id,
        preApprovalId: preApproval.id,
      },
      include: {
        visitor: { select: { id: true, name: true, mobile: true, photoBase64: true } },
        unit: { select: { id: true, unitNo: true, unitType: true, floor: true, block: true } },
        gate: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    const newUsedCount = preApproval.usedCount + 1;
    const newStatus = newUsedCount >= preApproval.maxUses ? 'USED' : 'ACTIVE';

    const updatedPreApproval = await prisma.preApprovedGuest.update({
      where: { id: preApproval.id },
      data: { usedCount: newUsedCount, status: newStatus },
    });

    return { visitorLog, preApproval: updatedPreApproval, unit: preApproval.unit };
  },

  getPreApprovalByCode: async ({ code, reqUser }) => {
    if (!code) throw { status: 400, message: 'Access code is required' };
    if (!reqUser.society_id)
      throw { status: 403, message: 'Security guard must be associated with a society' };

    const preApproval = await prisma.preApprovedGuest.findUnique({
      where: { accessCode: code },
      include: {
        unit: {
          select: {
            id: true,
            unitNo: true,
            unitType: true,
            floor: true,
            block: true,
            societyId: true,
          },
        },
        resident: { select: { id: true, name: true, mobile: true } },
      },
    });

    if (!preApproval) throw { status: 404, message: 'Pre-approval not found for this code' };
    if (preApproval.societyId !== reqUser.society_id) {
      throw {
        status: 403,
        message: 'Access denied. This pre-approval does not belong to your society.',
      };
    }

    return preApproval;
  },
};
