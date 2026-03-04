import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import {
  sendNotificationToUnitResidents,
  sendNotificationToUnitResidentsByFlatNo,
} from '../../utils/notificationHelper.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { VisitorLogService } from '../../services/visitorLogService.js';

export const createVisitorEntry = asyncHandler(async (req, res) => {
  const visitorLog = await VisitorLogService.createEntry({
    ...req.body,
    user: req.user,
  });

  // Log action
  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.VISITOR_ENTRY,
    entity: AUDIT_ENTITIES.VISITOR_LOG,
    entityId: visitorLog.id,
    description: `Visitor entry created for ${visitorLog.visitor?.name || 'Unknown'} at gate ${visitorLog.gate?.name || 'Unknown'}`,
    req,
  });

  // Notifications
  try {
    const visitorName = visitorLog.visitor?.name || 'A visitor';
    const unitNo = visitorLog.unit?.unitNo || visitorLog.flatNo || 'your unit';
    const gateName = visitorLog.gate?.name || 'the gate';
    const notifData = {
      screen: 'visitor_log_detail',
      visitorLogId: visitorLog.id.toString(),
      type: 'visitor_request',
    };

    if (visitorLog.unitId) {
      await sendNotificationToUnitResidents(
        visitorLog.unitId,
        'New Visitor Request',
        `${visitorName} is waiting at ${gateName} for ${unitNo}`,
        notifData
      );
    } else if (visitorLog.flatNo) {
      await sendNotificationToUnitResidentsByFlatNo(
        visitorLog.societyId,
        visitorLog.flatNo,
        'New Visitor Request',
        `${visitorName} is waiting at ${gateName} for ${unitNo}`,
        notifData
      );
    }
  } catch (error) {
    req.logger?.error('Error sending notification to residents:', error);
  }

  res
    .status(201)
    .json({ success: true, message: 'Visitor entry logged successfully', data: { visitorLog } });
});

export const markVisitorExit = asyncHandler(async (req, res) => {
  const visitorLog = await VisitorLogService.markExit({
    visitorLogId: parseInt(req.params.id),
    exitTime: req.body.exitTime,
    user: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.VISITOR_EXIT,
    entity: AUDIT_ENTITIES.VISITOR_LOG,
    entityId: visitorLog.id,
    description: `Visitor exit marked for ${visitorLog.visitor?.name || 'Unknown'}`,
    req,
  });

  res.json({ success: true, message: 'Visitor exit marked successfully', data: { visitorLog } });
});

export const getVisitorLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { visitorLogs, total } = await VisitorLogService.getLogs({
    ...req.query,
    user: req.user,
  });

  res.json({
    success: true,
    message: 'Visitor logs retrieved successfully',
    data: {
      visitorLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

export const getVisitorLogById = asyncHandler(async (req, res) => {
  const visitorLog = await VisitorLogService.getLogById({
    visitorLogId: parseInt(req.params.id),
    user: req.user,
  });

  res.json({ success: true, message: 'Visitor log retrieved successfully', data: { visitorLog } });
});

export const getActiveEntries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { visitorLogs, total } = await VisitorLogService.getActiveEntries({
    ...req.query,
    user: req.user,
  });

  res.json({
    success: true,
    message: 'Active entries retrieved successfully',
    data: {
      visitorLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});
