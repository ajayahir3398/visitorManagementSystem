import prisma from '../lib/prisma.js';

export const AuditLogService = {
  getAuditLogs: async ({
    page = 1,
    limit = 50,
    action,
    entity,
    userId,
    societyId,
    role,
    startDate,
    endDate,
    reqUser,
  }) => {
    const where = {};

    if (reqUser.role_name === 'SOCIETY_ADMIN') {
      if (!reqUser.society_id)
        throw { status: 403, message: 'Society Admin must be associated with a society' };
      where.societyId = reqUser.society_id;
    } else if (reqUser.role_name !== 'SUPER_ADMIN') {
      throw {
        status: 403,
        message: 'Access denied. Only Super Admin and Society Admin can view audit logs.',
      };
    }

    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (userId) where.userId = parseInt(userId);
    if (societyId && reqUser.role_name === 'SUPER_ADMIN') where.societyId = parseInt(societyId);
    if (role) where.role = role;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          user: { select: { id: true, name: true, mobile: true, email: true } },
          society: { select: { id: true, name: true } },
        },
      }),
    ]);

    const formattedLogs = logs.map((log) => ({
      ...log,
      userName: log.user?.name || null,
      userMobile: log.user?.mobile || null,
      societyName: log.society?.name || null,
      user: undefined,
      society: undefined,
    }));

    return { logs: formattedLogs, total, pageNum, limitNum };
  },

  getAuditLogById: async ({ logId, reqUser }) => {
    const log = await prisma.auditLog.findUnique({
      where: { id: parseInt(logId) },
      include: {
        user: { select: { id: true, name: true, mobile: true, email: true } },
        society: { select: { id: true, name: true } },
      },
    });

    if (!log) throw { status: 404, message: 'Audit log not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN') {
      if (log.societyId !== reqUser.society_id) {
        throw {
          status: 403,
          message: "Access denied. You can only view your society's audit logs.",
        };
      }
    } else if (reqUser.role_name !== 'SUPER_ADMIN') {
      throw {
        status: 403,
        message: 'Access denied. Only Super Admin and Society Admin can view audit logs.',
      };
    }

    return {
      ...log,
      userName: log.user?.name || null,
      userMobile: log.user?.mobile || null,
      societyName: log.society?.name || null,
      user: undefined,
      society: undefined,
    };
  },

  getAuditLogStats: async ({ startDate, endDate, reqUser }) => {
    const where = {};

    if (reqUser.role_name === 'SOCIETY_ADMIN') {
      if (!reqUser.society_id)
        throw { status: 403, message: 'Society Admin must be associated with a society' };
      where.societyId = reqUser.society_id;
    } else if (reqUser.role_name !== 'SUPER_ADMIN') {
      throw {
        status: 403,
        message: 'Access denied. Only Super Admin and Society Admin can view audit log statistics.',
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [totalLogs, actionCounts, roleCounts, entityCounts] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({ by: ['role'], where, _count: { role: true } }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        where,
        _count: { entity: true },
        orderBy: { _count: { entity: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      topActions: actionCounts.map((item) => ({ action: item.action, count: item._count.action })),
      roleDistribution: roleCounts.map((item) => ({ role: item.role, count: item._count.role })),
      topEntities: entityCounts.map((item) => ({ entity: item.entity, count: item._count.entity })),
    };
  },
};
