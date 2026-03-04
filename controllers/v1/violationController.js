import { ViolationService } from '../../services/violationService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const reportViolation = asyncHandler(async (req, res) => {
  const { violation, rule } = await ViolationService.reportViolation({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.VIOLATION_REPORTED,
    entity: AUDIT_ENTITIES.RULE_VIOLATION,
    entityId: violation.id,
    description: `Violation reported for rule "${rule.title}"`,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Violation reported successfully',
    data: { violation },
  });
});

export const getViolations = asyncHandler(async (req, res) => {
  const violations = await ViolationService.getViolations({
    status: req.query.status,
    unitId: req.query.unitId,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Violations retrieved successfully',
    data: { violations },
  });
});

export const updateViolationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const violation = await ViolationService.updateViolationStatus({
    violationId: parseInt(req.params.id),
    status,
    penaltyAmount: req.body.penaltyAmount,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action:
      status === 'RESOLVED' ? AUDIT_ACTIONS.VIOLATION_RESOLVED : AUDIT_ACTIONS.VIOLATION_UPDATED,
    entity: AUDIT_ENTITIES.RULE_VIOLATION,
    entityId: violation.id,
    description: `Violation status updated to ${status}`,
    req,
  });

  res.json({
    success: true,
    message: 'Violation status updated successfully',
    data: { violation },
  });
});
