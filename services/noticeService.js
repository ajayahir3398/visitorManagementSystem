import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const NoticeService = {
  createNotice: async ({
    title,
    description,
    noticeType,
    priority,
    audience,
    startDate,
    endDate,
    photoBase64,
    reqUser,
  }) => {
    const societyId = reqUser.society_id;
    const userId = reqUser.id;

    if (!societyId) throw { status: 400, message: 'User is not associated with a society' };

    await fixSequence('notices');

    const notice = await prisma.notice.create({
      data: {
        societyId: parseInt(societyId),
        createdBy: userId,
        title,
        description,
        noticeType: noticeType ? noticeType.toUpperCase() : undefined,
        priority: priority ? priority.toUpperCase() : 'MEDIUM',
        audience: audience ? audience.toUpperCase() : undefined,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        photoBase64,
        isActive: true,
      },
    });

    return notice;
  },

  getNotificationUsers: async (societyId, audience) => {
    let whereClause = { societyId: parseInt(societyId), status: 'ACTIVE' };

    const audienceUpper = audience?.toUpperCase();

    if (audienceUpper === 'SECURITY') {
      whereClause.role = { name: 'SECURITY' };
    } else if (
      audienceUpper === 'RESIDENTS' ||
      audienceUpper === 'OWNERS' ||
      audienceUpper === 'TENANTS'
    ) {
      if (audienceUpper === 'OWNERS') {
        const ownerMembers = await prisma.unitMember.findMany({
          where: { unit: { societyId: parseInt(societyId) }, role: 'OWNER' },
          select: { userId: true },
        });
        whereClause.id = { in: ownerMembers.map((m) => m.userId) };
      } else if (audienceUpper === 'TENANTS') {
        const tenantMembers = await prisma.unitMember.findMany({
          where: { unit: { societyId: parseInt(societyId) }, role: 'TENANT' },
          select: { userId: true },
        });
        whereClause.id = { in: tenantMembers.map((m) => m.userId) };
      } else {
        whereClause.role = { name: 'RESIDENT' };
      }
    }

    const users = await prisma.user.findMany({ where: whereClause, select: { id: true } });
    return users.map((u) => u.id);
  },

  getNotices: async ({ isRead, reqUser }) => {
    const societyId = reqUser.society_id;
    const role = reqUser.role_name;
    const userId = reqUser.id;
    const now = new Date();

    if (!societyId) throw { status: 400, message: 'User is not associated with a society' };

    const where = {
      societyId: parseInt(societyId),
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };

    if (role === 'SECURITY') {
      where.OR = [{ audience: 'ALL' }, { audience: 'SECURITY' }];
    } else if (role === 'RESIDENT') {
      const unitMember = await prisma.unitMember.findFirst({
        where: { userId },
        select: { role: true },
      });

      const specificAudience =
        unitMember?.role === 'OWNER' ? 'OWNERS' : unitMember?.role === 'TENANT' ? 'TENANTS' : null;

      where.OR = [{ audience: 'ALL' }, { audience: 'RESIDENTS' }];
      if (specificAudience) where.OR.push({ audience: specificAudience });
    }

    if (isRead !== undefined) {
      if (isRead === 'true') {
        where.reads = { some: { userId } };
      } else {
        where.reads = { none: { userId } };
      }
    }

    const notices = await prisma.notice.findMany({
      where,
      include: {
        reads: { include: { user: { select: { id: true, name: true } } } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return notices.map((notice) => {
      const isReadStatus = notice.reads.some((r) => r.userId === userId);
      const otherReads = notice.reads.filter((r) => r.userId !== userId);

      return {
        ...notice,
        isRead: isReadStatus,
        readCount: otherReads.length,
        readByUser: otherReads.map((r) => r.user),
        reads: undefined,
      };
    });
  },

  getNoticeById: async ({ noticeId, reqUser }) => {
    const societyId = reqUser.society_id;
    const userId = reqUser.id;

    if (!societyId) throw { status: 400, message: 'User is not associated with a society' };

    const notice = await prisma.notice.findFirst({
      where: { id: noticeId, societyId: parseInt(societyId) },
      include: {
        reads: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!notice) throw { status: 404, message: 'Notice not found' };

    const isReadStatus = notice.reads.some((r) => r.userId === userId);
    const otherReads = notice.reads.filter((r) => r.userId !== userId);

    return {
      ...notice,
      isRead: isReadStatus,
      readCount: otherReads.length,
      readByUser: otherReads.map((r) => r.user),
      reads: undefined,
    };
  },

  markNoticeRead: async ({ noticeId, reqUser }) => {
    const userId = reqUser.id;

    await fixSequence('notice_reads');

    await prisma.noticeRead.upsert({
      where: { noticeId_userId: { noticeId, userId } },
      update: {},
      create: { noticeId, userId },
    });
  },

  updateNotice: async ({ noticeId, updateData, reqUser }) => {
    const societyId = reqUser.society_id;

    if (updateData.priority) updateData.priority = updateData.priority.toUpperCase();
    if (updateData.audience) updateData.audience = updateData.audience.toUpperCase();
    if (updateData.noticeType) updateData.noticeType = updateData.noticeType.toUpperCase();

    const result = await prisma.notice.updateMany({
      where: { id: noticeId, societyId: parseInt(societyId) },
      data: updateData,
    });

    if (result.count === 0) throw { status: 404, message: 'Notice not found or no permission' };
  },

  deactivateNotice: async ({ noticeId, reqUser }) => {
    const societyId = reqUser.society_id;

    const result = await prisma.notice.updateMany({
      where: { id: noticeId, societyId: parseInt(societyId) },
      data: { isActive: false },
    });

    if (result.count === 0) throw { status: 404, message: 'Notice not found or no permission' };
  },
};
