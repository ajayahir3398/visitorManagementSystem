import { VisitorService } from '../../services/visitorService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const createVisitor = asyncHandler(async (req, res) => {
  const { visitor, isExisting } = await VisitorService.createVisitor(req.body);

  if (isExisting) {
    return res.status(200).json({
      success: true,
      message: 'Visitor already exists',
      data: { visitor },
    });
  }

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.CREATE_VISITOR,
    entity: AUDIT_ENTITIES.VISITOR,
    entityId: visitor.id,
    description: `Visitor "${visitor.name}" (${visitor.mobile}) created`,
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Visitor created successfully',
    data: { visitor },
  });
});

export const getVisitors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { visitors, total } = await VisitorService.getVisitors({
    ...req.query,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Visitors retrieved successfully',
    data: {
      visitors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: total ? Math.ceil(total / parseInt(limit)) : 0,
      },
    },
  });
});

export const getVisitorById = asyncHandler(async (req, res) => {
  const visitor = await VisitorService.getVisitorById({
    visitorId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Visitor retrieved successfully',
    data: { visitor },
  });
});

export const updateVisitor = asyncHandler(async (req, res) => {
  const { visitor, changes } = await VisitorService.updateVisitor({
    visitorId: parseInt(req.params.id),
    ...req.body,
  });

  const description =
    changes.length > 0
      ? `Visitor "${visitor.name}" updated: ${changes.join(', ')}`
      : `Visitor "${visitor.name}" updated`;

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.UPDATE_VISITOR,
    entity: AUDIT_ENTITIES.VISITOR,
    entityId: visitor.id,
    description,
    req,
  });

  res.json({
    success: true,
    message: 'Visitor updated successfully',
    data: { visitor },
  });
});

export const deleteVisitor = asyncHandler(async (req, res) => {
  const visitor = await VisitorService.deleteVisitor({
    visitorId: parseInt(req.params.id),
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.DELETE_VISITOR,
    entity: AUDIT_ENTITIES.VISITOR,
    entityId: visitor.id,
    description: `Visitor "${visitor.name}" (${visitor.mobile}) deleted`,
    req,
  });

  res.json({
    success: true,
    message: 'Visitor deleted successfully',
  });
});

export const searchVisitors = asyncHandler(async (req, res) => {
  const visitors = await VisitorService.searchVisitors({
    ...req.query,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: visitors.length > 0 ? 'Visitors found' : 'No visitors found',
    data: { visitors },
  });
});
