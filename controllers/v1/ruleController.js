import { RuleService } from '../../services/ruleService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { sendNotificationToUsers } from '../../utils/notificationHelper.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const createRule = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const rule = await RuleService.createRule({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.RULE_CREATED,
    entity: AUDIT_ENTITIES.RULE,
    entityId: rule.id,
    description: `Rule "${rule.title}" created`,
    req,
  });

  try {
    const userIds = await RuleService.getRuleNotificationUsers(req.user.society_id);

    if (userIds.length > 0) {
      console.log(`🔔 Sending rule notification to ${userIds.length} users`);
      sendNotificationToUsers(
        userIds,
        `New Society Rule: ${title}`,
        description.length > 50 ? description.substring(0, 47) + '...' : description,
        { type: 'rule', id: rule.id.toString(), screen: 'rule_detail' }
      );
    }
  } catch (notifError) {
    console.error('Error sending rule notifications:', notifError);
  }

  res.status(201).json({
    success: true,
    message: 'Rule created successfully',
    data: { rule },
  });
});

export const getRules = asyncHandler(async (req, res) => {
  const rules = await RuleService.getRules({
    category: req.query.category,
    isActive: req.query.isActive,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Rules retrieved successfully',
    data: { rules },
  });
});

export const getRuleById = asyncHandler(async (req, res) => {
  const rule = await RuleService.getRuleById({
    ruleId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Rule retrieved successfully',
    data: { rule },
  });
});

export const updateRule = asyncHandler(async (req, res) => {
  const rule = await RuleService.updateRule({
    ruleId: parseInt(req.params.id),
    updateData: req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.RULE_UPDATED,
    entity: AUDIT_ENTITIES.RULE,
    entityId: rule.id,
    description: `Rule "${rule.title}" updated`,
    req,
  });

  res.json({
    success: true,
    message: 'Rule updated successfully',
    data: { rule },
  });
});

export const deleteRule = asyncHandler(async (req, res) => {
  const rule = await RuleService.deleteRule({
    ruleId: parseInt(req.params.id),
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.RULE_DEACTIVATED,
    entity: AUDIT_ENTITIES.RULE,
    entityId: rule.id,
    description: `Rule "${rule.title}" deactivated`,
    req,
  });

  res.json({
    success: true,
    message: 'Rule deactivated successfully',
  });
});
