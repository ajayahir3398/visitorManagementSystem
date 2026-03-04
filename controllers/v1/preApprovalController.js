import { PreApprovalService } from '../../services/preApprovalService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const createPreApproval = asyncHandler(async (req, res) => {
  const preApproval = await PreApprovalService.createPreApproval({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.PRE_APPROVAL_CREATED,
    entity: AUDIT_ENTITIES.PRE_APPROVED_GUEST,
    entityId: preApproval.id,
    description: `Pre-approval code ${preApproval.accessCode} created for unit ${preApproval.unit.unitNo}`,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Pre-approval created successfully',
    data: { preApproval },
  });
});

export const getPreApprovals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { preApprovals, total } = await PreApprovalService.getPreApprovals({
    ...req.query,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Pre-approvals retrieved successfully',
    data: {
      preApprovals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: total ? Math.ceil(total / parseInt(limit)) : 0,
      },
    },
  });
});

export const getPreApprovalById = asyncHandler(async (req, res) => {
  const preApproval = await PreApprovalService.getPreApprovalById({
    preApprovalId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Pre-approval retrieved successfully',
    data: { preApproval },
  });
});

export const revokePreApproval = asyncHandler(async (req, res) => {
  const { preApproval, accessCode } = await PreApprovalService.revokePreApproval({
    preApprovalId: parseInt(req.params.id),
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.PRE_APPROVAL_REVOKED,
    entity: AUDIT_ENTITIES.PRE_APPROVED_GUEST,
    entityId: preApproval.id,
    description: `Pre-approval code ${accessCode} revoked`,
    req,
  });

  res.json({
    success: true,
    message: 'Pre-approval revoked successfully',
    data: { preApproval },
  });
});

export const verifyPreApprovalCode = asyncHandler(async (req, res) => {
  const { visitorLog, preApproval, unit } = await PreApprovalService.verifyPreApprovalCode({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.PRE_APPROVAL_USED,
    entity: AUDIT_ENTITIES.PRE_APPROVED_GUEST,
    entityId: preApproval.id,
    description: `Pre-approval code ${req.body.accessCode} used for visitor entry (visitor log ID: ${visitorLog.id})`,
    req,
  });

  res.json({
    success: true,
    message: 'Access code verified and entry approved successfully',
    data: {
      visitorLog,
      preApproval,
      unit,
    },
  });
});

export const getPreApprovalByCode = asyncHandler(async (req, res) => {
  const preApproval = await PreApprovalService.getPreApprovalByCode({
    code: req.params.code,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Pre-approval details retrieved successfully',
    data: { preApproval },
  });
});
