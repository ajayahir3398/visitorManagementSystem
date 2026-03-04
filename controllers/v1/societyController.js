import { SocietyService } from '../../services/societyService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const createSociety = asyncHandler(async (req, res) => {
  const society = await SocietyService.createSociety(req.body);

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.CREATE_SOCIETY,
    entity: AUDIT_ENTITIES.SOCIETY,
    entityId: society.id,
    description: `Society "${society.name}" created (${society.type})`,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Society created successfully',
    data: { society },
  });
});

export const getSocieties = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { societies, total } = await SocietyService.getSocieties(req.query);

  res.json({
    success: true,
    message: 'Societies retrieved successfully',
    data: {
      societies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: total ? Math.ceil(total / parseInt(limit)) : 0,
      },
    },
  });
});

export const getSocietyById = asyncHandler(async (req, res) => {
  const society = await SocietyService.getSocietyById({
    societyId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Society retrieved successfully',
    data: { society },
  });
});

export const updateSociety = asyncHandler(async (req, res) => {
  const { society, changes } = await SocietyService.updateSociety({
    societyId: parseInt(req.params.id),
    ...req.body,
    reqUser: req.user,
  });

  const description =
    changes.length > 0
      ? `Society "${society.name}" updated: ${changes.join(', ')}`
      : `Society "${society.name}" updated`;

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.UPDATE_SOCIETY,
    entity: AUDIT_ENTITIES.SOCIETY,
    entityId: society.id,
    description,
    req,
  });

  res.json({
    success: true,
    message: 'Society updated successfully',
    data: { society },
  });
});

export const deleteSociety = asyncHandler(async (req, res) => {
  const societyId = parseInt(req.params.id);
  const society = await SocietyService.deleteSociety({ societyId });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.DELETE_SOCIETY,
    entity: AUDIT_ENTITIES.SOCIETY,
    entityId: societyId,
    description: `Society "${society.name}" deleted`,
    req,
  });

  res.json({
    success: true,
    message: 'Society deleted successfully',
  });
});
