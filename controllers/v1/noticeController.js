import { NoticeService } from '../../services/noticeService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';
import { sendNotificationToUsers } from '../../utils/notificationHelper.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const createNotice = asyncHandler(async (req, res) => {
  const { title, description, audience } = req.body;
  const notice = await NoticeService.createNotice({
    ...req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.NOTICE_CREATED,
    entity: AUDIT_ENTITIES.NOTICE,
    entityId: notice.id,
    description: `Notice created: ${notice.title}`,
    req,
  });

  try {
    const userIds = await NoticeService.getNotificationUsers(req.user.society_id, audience);

    if (userIds.length > 0) {
      console.log(
        `🔔 Sending notice notification to ${userIds.length} users (Audience: ${audience})`
      );
      sendNotificationToUsers(
        userIds,
        `New Notice: ${title}`,
        description.length > 50 ? description.substring(0, 47) + '...' : description,
        { type: 'notice', id: notice.id.toString(), screen: 'notice_detail' }
      );
    }
  } catch (notifError) {
    console.error('Error sending notice notifications:', notifError);
  }

  res.status(201).json({
    success: true,
    message: 'Notice created successfully',
    data: { notice },
  });
});

export const getNotices = asyncHandler(async (req, res) => {
  const notices = await NoticeService.getNotices({
    isRead: req.query.isRead,
    reqUser: req.user,
  });

  res.json({
    success: true,
    message: 'Notices retrieved successfully',
    data: { notices },
  });
});

export const getNoticeById = asyncHandler(async (req, res) => {
  const notice = await NoticeService.getNoticeById({
    noticeId: parseInt(req.params.id),
    reqUser: req.user,
  });

  res.json({
    success: true,
    data: notice,
  });
});

export const markNoticeRead = asyncHandler(async (req, res) => {
  const noticeId = parseInt(req.params.id);
  await NoticeService.markNoticeRead({
    noticeId,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.NOTICE_READ,
    entity: AUDIT_ENTITIES.NOTICE,
    entityId: noticeId,
    description: `Notice ${noticeId} marked as read`,
    req,
  });

  res.json({
    success: true,
    message: 'Notice marked as read',
  });
});

export const updateNotice = asyncHandler(async (req, res) => {
  const noticeId = parseInt(req.params.id);
  await NoticeService.updateNotice({
    noticeId,
    updateData: req.body,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.NOTICE_UPDATED,
    entity: AUDIT_ENTITIES.NOTICE,
    entityId: noticeId,
    description: `Notice ${noticeId} updated`,
    req,
  });

  res.json({
    success: true,
    message: 'Notice updated successfully',
  });
});

export const deactivateNotice = asyncHandler(async (req, res) => {
  const noticeId = parseInt(req.params.id);
  await NoticeService.deactivateNotice({
    noticeId,
    reqUser: req.user,
  });

  await logAction({
    user: req.user,
    action: AUDIT_ACTIONS.NOTICE_DEACTIVATED,
    entity: AUDIT_ENTITIES.NOTICE,
    entityId: noticeId,
    description: `Notice ${noticeId} deactivated`,
    req,
  });

  res.json({
    success: true,
    message: 'Notice deactivated successfully',
  });
});
