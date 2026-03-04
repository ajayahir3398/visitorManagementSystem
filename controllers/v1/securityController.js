import { SecurityService } from '../../services/securityService.js';
import { PreApprovalService } from '../../services/preApprovalService.js';
import { VisitorLogService } from '../../services/visitorLogService.js';
import { EmergencyService } from '../../services/emergencyService.js';
import {
  sendNotificationToUnitResidents,
  sendNotificationToUnitResidentsByFlatNo,
} from '../../utils/notificationHelper.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getDashboardOverview = asyncHandler(async (req, res) => {
  const overview = await SecurityService.getDashboardOverview({ reqUser: req.user });
  res.json({ success: true, data: overview });
});

export const getPendingApprovals = asyncHandler(async (req, res) => {
  const data = await SecurityService.getPendingApprovals({ reqUser: req.user });
  res.json({ success: true, data });
});

export const getInsideVisitors = asyncHandler(async (req, res) => {
  const data = await SecurityService.getInsideVisitors({ reqUser: req.user });
  res.json({ success: true, data });
});

export const getRecentActivity = asyncHandler(async (req, res) => {
  const data = await SecurityService.getRecentActivity({ reqUser: req.user });
  res.json({ success: true, data });
});

export const getDashboardEmergency = asyncHandler(async (req, res) => {
  const emergency = await SecurityService.getActiveEmergency({ reqUser: req.user });
  res.json({ success: true, data: emergency });
});

export const verifyGuestCode = asyncHandler(async (req, res) => {
  const { code, gateId, visitorId } = req.body;
  const result = await PreApprovalService.verifyPreApprovalCode({
    accessCode: code,
    gateId,
    visitorId,
    reqUser: req.user,
  });
  res.json({ success: true, message: 'Entry approved', data: result });
});

export const visitorEntry = asyncHandler(async (req, res) => {
  const result = await VisitorLogService.createEntry({
    ...req.body,
    user: req.user,
  });

  // Log action
  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.VISITOR_ENTRY,
    entity: AUDIT_ENTITIES.VISITOR_LOG,
    entityId: result.id,
    description: `Visitor entry requested for ${result.visitor?.name || 'Unknown'} at gate ${result.gate?.name || 'Unknown'}`,
    req,
  });

  // Notifications
  try {
    const visitorName = result.visitor?.name || 'A visitor';
    const unitNo = result.unit?.unitNo || result.flatNo || 'your unit';
    const gateName = result.gate?.name || 'the gate';
    const notifData = {
      screen: 'visitor_log_detail',
      visitorLogId: result.id.toString(),
      type: 'visitor_request',
    };

    if (result.unitId) {
      await sendNotificationToUnitResidents(
        result.unitId,
        'New Visitor Request',
        `${visitorName} is waiting at ${gateName} for ${unitNo}`,
        notifData
      );
    } else if (result.flatNo) {
      await sendNotificationToUnitResidentsByFlatNo(
        result.societyId,
        result.flatNo,
        'New Visitor Request',
        `${visitorName} is waiting at ${gateName} for ${unitNo}`,
        notifData
      );
    }
  } catch (error) {
    req.logger?.error('Error sending notification to residents:', error);
  }

  res.json({ success: true, message: 'Visitor entry requested', data: result });
});

export const visitorExit = asyncHandler(async (req, res) => {
  const { visitorLogId, exitTime } = req.body;
  const result = await VisitorLogService.markExit({
    visitorLogId: parseInt(visitorLogId),
    exitTime,
    user: req.user,
  });
  res.json({ success: true, message: 'Visitor marked as exited', data: result });
});

export const raiseEmergency = asyncHandler(async (req, res) => {
  const result = await EmergencyService.raiseEmergency({
    ...req.body,
    reqUser: req.user,
  });

  // Log action
  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.EMERGENCY_RAISED,
    entity: AUDIT_ENTITIES.EMERGENCY_REQUEST,
    entityId: result.id,
    description: `${result.emergencyType} emergency raised by ${req.user.name}`,
    req,
  });

  // Notifications
  try {
    const societyId = req.user.society_id;
    const notificationBody = `${req.user.name} raised a ${result.emergencyType} emergency at ${result.unit?.unitNo || result.location || 'unknown location'}`;

    // Send to all residents in the society (or we could target security/admin roles specifically)
    // For now, let's follow the general emergency broadcast pattern if exists,
    // but typically security raised emergencies should alert other security/admins and residents.
    // Let's at least ensure it's logged and some basic notification is sent.
    await sendNotificationToUnitResidentsByFlatNo(
      societyId,
      result.unit?.unitNo || 'ADMIN', // Fallback or special handling
      `EMERGENCY: ${result.emergencyType}`,
      notificationBody,
      {
        screen: 'emergency_detail',
        emergencyId: result.id.toString(),
        type: 'emergency',
      }
    );
  } catch (error) {
    req.logger?.error('Error sending emergency notification:', error);
  }

  res.json({ success: true, message: 'Emergency alert raised', data: result });
});
