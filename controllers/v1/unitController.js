import { UnitService } from '../../services/unitService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';
import busboy from 'busboy';
import csv from 'csv-parser';
import prisma from '../../lib/prisma.js'; // still needed for bulkUpload units processing inline

export const createUnit = asyncHandler(async (req, res) => {
  const unit = await UnitService.createUnit({
    ...req.body,
    reqUser: req.user,
  });

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
});

export const getUnits = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { units, total } = await UnitService.getUnits({
    ...req.query,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Units retrieved successfully',
    data: {
      units,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: total ? Math.ceil(total / parseInt(limit)) : 0,
      },
    },
  });
});

export const getUnitById = asyncHandler(async (req, res) => {
  const unit = await UnitService.getUnitById({
    unitId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Unit retrieved successfully',
    data: { unit },
  });
});

export const updateUnit = asyncHandler(async (req, res) => {
  const { unit, changes } = await UnitService.updateUnit({
    unitId: parseInt(req.params.id),
    ...req.body,
    reqUser: req.user,
  });

  const description =
    changes.length > 0
      ? `Unit "${unit.unitNo}" updated: ${changes.join(', ')}`
      : `Unit "${unit.unitNo}" updated`;

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
});

export const deleteUnit = asyncHandler(async (req, res) => {
  const unit = await UnitService.deleteUnit({
    unitId: parseInt(req.params.id),
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.DELETE_UNIT,
    entity: AUDIT_ENTITIES.UNIT,
    entityId: unit.id,
    description: `Unit "${unit.unitNo}" deleted`,
    req,
  });

  res.json({
    success: true,
    message: 'Unit deleted successfully',
  });
});

export const addUnitMember = asyncHandler(async (req, res) => {
  const { member, unit } = await UnitService.addUnitMember({
    unitId: parseInt(req.params.id),
    ...req.body,
    reqUser: req.user,
  });

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
});

export const removeUnitMember = asyncHandler(async (req, res) => {
  const member = await UnitService.removeUnitMember({
    unitId: parseInt(req.params.id),
    memberId: parseInt(req.params.memberId),
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.REMOVE_UNIT_MEMBER,
    entity: AUDIT_ENTITIES.UNIT,
    entityId: member.unit.id,
    description: `User "${member.user.name}" removed from unit "${member.unit.unitNo}"`,
    req,
  });

  res.json({
    success: true,
    message: 'Member removed from unit successfully',
  });
});

export const bulkDeleteUnits = asyncHandler(async (req, res) => {
  const deletedCount = await UnitService.bulkDeleteUnits({
    unitIds: req.body.unitIds,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: 'BULK_UNITS_DELETED',
    entity: AUDIT_ENTITIES.UNIT,
    description: `${deletedCount} units deleted via bulk delete`,
    req,
  });

  res.json({
    success: true,
    message: 'Units deleted successfully',
    data: { deletedCount },
  });
});

export const bulkUploadUnits = asyncHandler(async (req, res) => {
  if (req.user.role_name !== 'SOCIETY_ADMIN') {
    return res
      .status(403)
      .json({ success: false, message: 'Access denied. Only Society Admins can upload units.' });
  }

  const bb = busboy({ headers: req.headers });
  const units = [];
  const errors = [];
  let fileFound = false;

  bb.on('file', (name, file, info) => {
    if (name !== 'file') {
      file.resume();
      return;
    }

    const { mimeType } = info;
    if (mimeType !== 'text/csv' && mimeType !== 'application/vnd.ms-excel') {
      file.resume();
      errors.push({ error: 'Invalid file type. Only CSV is allowed.' });
      return;
    }

    fileFound = true;

    file
      .pipe(csv())
      .on('data', (row) => {
        if (!row.unit_no || !row.block) {
          errors.push({ row, error: 'unit_no and block are required' });
          return;
        }

        units.push({
          societyId: req.user.society_id,
          unitNo: row.unit_no.trim(),
          block: row.block.trim(),
          unitType: row.unit_type?.toUpperCase() || 'FLAT',
          floor: row.floor ? parseInt(row.floor) : null,
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
      if (!res.headersSent) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded or invalid field name. Key must be "file".',
        });
      }
      return;
    }

    if (units.length === 0 && errors.length === 0) {
      if (!res.headersSent) {
        return res.status(400).json({ success: false, message: 'No valid units found in CSV.' });
      }
      return;
    }

    if (units.length > 0) {
      try {
        const results = { success: [], failed: [] };

        for (const unit of units) {
          try {
            const createdUnit = await prisma.unit.create({ data: unit });
            results.success.push({
              unitNo: createdUnit.unitNo,
              unitType: createdUnit.unitType,
              floor: createdUnit.floor,
              block: createdUnit.block,
            });
          } catch (err) {
            let reason = err.message;
            if (err.code === 'P2002') reason = 'Unit with this number and block already exists';
            results.failed.push({ unitNo: unit.unitNo, reason });
          }
        }

        await logAction({
          user: req.user,
          action: 'BULK_UNITS_CREATED',
          entity: AUDIT_ENTITIES.UNIT,
          description: `Bulk upload: ${results.success.length} created, ${results.failed.length} failed`,
          req,
        });

        if (!res.headersSent) {
          res.json({ success: true, message: 'Bulk upload processing completed', data: results });
        }
      } catch (dbError) {
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Database error during bulk insert',
            error: dbError.message,
          });
        }
      }
    } else {
      if (!res.headersSent) {
        res
          .status(400)
          .json({ success: false, message: 'Failed to process units', data: { errors } });
      }
    }
  });

  req.pipe(bb);
});
