import { AuditLogService } from '../../services/auditLogService.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { logs, total, pageNum, limitNum } = await AuditLogService.getAuditLogs({
    ...req.query,
    reqUser: req.user,
  });

  res.status(200).json({
    success: true,
    message: 'Audit logs retrieved successfully',
    data: {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
});

export const getAuditLogById = asyncHandler(async (req, res) => {
  const log = await AuditLogService.getAuditLogById({
    logId: req.params.id,
    reqUser: req.user,
  });

  res.status(200).json({
    success: true,
    message: 'Audit log retrieved successfully',
    data: log,
  });
});

export const getAuditLogStats = asyncHandler(async (req, res) => {
  const stats = await AuditLogService.getAuditLogStats({
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    reqUser: req.user,
  });

  res.status(200).json({
    success: true,
    message: 'Audit log statistics retrieved successfully',
    data: stats,
  });
});
