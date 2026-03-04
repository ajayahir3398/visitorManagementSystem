import { GateService } from '../../services/gateService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const createGate = asyncHandler(async (req, res) => {
  const gate = await GateService.createGate({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.CREATE_GATE,
    entity: AUDIT_ENTITIES.GATE,
    entityId: gate.id,
    description: `Gate "${gate.name}" created for society "${gate.society.name}"`,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Gate created successfully',
    data: { gate },
  });
});

export const getGates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { gates, total } = await GateService.getGates({
    ...req.query,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Gates retrieved successfully',
    data: {
      gates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: total ? Math.ceil(total / parseInt(limit)) : 0,
      },
    },
  });
});

export const getGateById = asyncHandler(async (req, res) => {
  const gate = await GateService.getGateById({
    gateId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Gate retrieved successfully',
    data: { gate },
  });
});

export const updateGate = asyncHandler(async (req, res) => {
  const { gate, changes } = await GateService.updateGate({
    gateId: parseInt(req.params.id),
    ...req.body,
    reqUser: req.user,
  });

  const description =
    changes.length > 0
      ? `Gate "${gate.name}" updated: ${changes.join(', ')}`
      : `Gate "${gate.name}" updated`;

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.UPDATE_GATE,
    entity: AUDIT_ENTITIES.GATE,
    entityId: gate.id,
    description,
    req,
  });

  res.json({
    success: true,
    message: 'Gate updated successfully',
    data: { gate },
  });
});

export const deleteGate = asyncHandler(async (req, res) => {
  const gate = await GateService.deleteGate({
    gateId: parseInt(req.params.id),
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.DELETE_GATE,
    entity: AUDIT_ENTITIES.GATE,
    entityId: gate.id,
    description: `Gate "${gate.name}" deleted`,
    req,
  });

  res.json({
    success: true,
    message: 'Gate deleted successfully',
  });
});
