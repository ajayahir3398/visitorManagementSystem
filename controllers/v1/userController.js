import busboy from 'busboy';
import csv from 'csv-parser';
import { UserService } from '../../services/userService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const createUser = asyncHandler(async (req, res) => {
  const { user, actionRole } = await UserService.createUser({
    ...req.body,
    reqUser: req.user,
  });

  const action =
    actionRole === 'SOCIETY_ADMIN' ? AUDIT_ACTIONS.CREATE_SOCIETY_ADMIN : AUDIT_ACTIONS.CREATE_USER;

  await logAction({
    user: req.user,
    action,
    entity: AUDIT_ENTITIES.USER,
    entityId: user.id,
    description: `User "${user.name}" (${user.role.name}) created${user.society ? ` for society "${user.society.name}"` : ''}`,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user },
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { users, total } = await UserService.getUsers({
    ...req.query,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById({
    userId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'User retrieved successfully',
    data: { user },
  });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { user, changes, statusChanged, newStatus } = await UserService.updateUser({
    userId: parseInt(req.params.id),
    ...req.body,
    reqUser: req.user,
  });

  if (statusChanged) {
    if (newStatus === 'BLOCKED') {
      await logAction({
        user: req.user,
        action: AUDIT_ACTIONS.BLOCK_USER,
        entity: AUDIT_ENTITIES.USER,
        entityId: user.id,
        description: `User "${user.name}" blocked`,
        req,
      });
    } else if (newStatus === 'ACTIVE') {
      await logAction({
        user: req.user,
        action: AUDIT_ACTIONS.UNBLOCK_USER,
        entity: AUDIT_ENTITIES.USER,
        entityId: user.id,
        description: `User "${user.name}" unblocked`,
        req,
      });
    }
  }

  const description =
    changes.length > 0
      ? `User "${user.name}" updated: ${changes.join(', ')}`
      : `User "${user.name}" updated`;

  if (!statusChanged || (newStatus !== 'BLOCKED' && newStatus !== 'ACTIVE')) {
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.UPDATE_USER,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      description,
      req,
    });
  }

  res.json({
    success: true,
    message: 'User updated successfully',
    data: { user },
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await UserService.deleteUser({
    userId: parseInt(req.params.id),
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.DELETE_USER,
    entity: AUDIT_ENTITIES.USER,
    entityId: user.id,
    description: `User "${user.name}" (${user.role.name}) deleted`,
    req,
  });

  res.json({ success: true, message: 'User deleted successfully' });
});

export const bulkUploadResidents = asyncHandler(async (req, res) => {
  if (req.user.role_name !== 'SOCIETY_ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Society Admins can upload residents.',
    });
  }

  const bb = busboy({ headers: req.headers });
  const results = { success: [], failed: [] };
  let fileFound = false;

  bb.on('file', (name, file, info) => {
    if (name !== 'file') {
      file.resume();
      return;
    }

    const { mimeType } = info;
    if (mimeType !== 'text/csv' && mimeType !== 'application/vnd.ms-excel') {
      file.resume();
      results.failed.push({ error: 'Invalid file type. Only CSV is allowed.' });
      return;
    }

    fileFound = true;
    const rows = [];

    file
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', async () => {
        for (const row of rows) {
          try {
            // Let the service handle business logic only
            const { user: procUser, unit } = await UserService.processBulkUploadRow({
              row,
              reqUser: req.user,
            });

            // Note: In the original logic, it also logged the user creation if it was a new user.
            // We'll log the unit member addition
            await logAction({
              user: req.user,
              action: AUDIT_ACTIONS.ADD_UNIT_MEMBER,
              entity: AUDIT_ENTITIES.UNIT,
              entityId: unit.id,
              description: `User "${procUser.name}" added to unit "${unit.unitNo}" via bulk upload`,
              req,
            });

            results.success.push({
              unitNo: unit.unitNo,
              name: procUser.name,
              mobile: procUser.mobile,
              status: 'Added',
            });
          } catch (err) {
            results.failed.push({ row, error: err.message });
          }
        }

        res.status(200).json({
          success: true,
          message: 'Bulk upload processing completed',
          data: results,
        });
      });
  });

  bb.on('finish', () => {
    if (!fileFound && !res.headersSent) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
    }
  });

  req.pipe(bb);
});
