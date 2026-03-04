import { ApprovalService } from '../../services/approvalService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const approveVisitor = asyncHandler(async (req, res) => {
  const visitorLogId = parseInt(req.params.id);
  const { approval, updatedLog, visitorLog } = await ApprovalService.processApproval({
    visitorLogId,
    reqUser: req.user,
    decision: 'APPROVED',
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.VISITOR_APPROVED,
    entity: AUDIT_ENTITIES.VISITOR_LOG,
    entityId: visitorLogId,
    description: `Visitor ${visitorLog.visitor?.name || 'Unknown'} approved for unit ${visitorLog.unit?.unitNo || 'Unknown'}`,
    req,
  });

  res.json({
    success: true,
    message: 'Visitor entry approved successfully',
    data: { visitorLog: updatedLog, approval },
  });
});

export const rejectVisitor = asyncHandler(async (req, res) => {
  const visitorLogId = parseInt(req.params.id);
  const { approval, updatedLog, visitorLog } = await ApprovalService.processApproval({
    visitorLogId,
    reqUser: req.user,
    decision: 'REJECTED',
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.VISITOR_REJECTED,
    entity: AUDIT_ENTITIES.VISITOR_LOG,
    entityId: visitorLogId,
    description: `Visitor ${visitorLog.visitor?.name || 'Unknown'} rejected for unit ${visitorLog.unit?.unitNo || 'Unknown'}`,
    req,
  });

  res.json({
    success: true,
    message: 'Visitor entry rejected successfully',
    data: { visitorLog: updatedLog, approval },
  });
});

export const getPendingApprovals = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { visitorLogs, total } = await ApprovalService.getPendingApprovals({
    ...req.query,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Pending approvals retrieved successfully',
    data: {
      visitorLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: total ? Math.ceil(total / parseInt(limit)) : 0,
      },
    },
  });
});
