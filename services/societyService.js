import prisma from '../lib/prisma.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const SocietyService = {
  createSociety: async ({
    name,
    type,
    address,
    city,
    state,
    pincode,
    subscriptionId,
    razorpayKey,
  }) => {
    if (!name || !type) {
      throw { status: 400, message: 'Name and type are required' };
    }

    if (!['APARTMENT', 'OFFICE'].includes(type.toUpperCase())) {
      throw { status: 400, message: 'Type must be either "APARTMENT" or "OFFICE"' };
    }

    await fixSequence('societies');

    const society = await prisma.$transaction(async (tx) => {
      const newSociety = await tx.society.create({
        data: {
          name,
          type: type.toUpperCase(),
          address,
          city,
          state,
          pincode,
          razorpayKey,
          subscriptionId,
          status: 'ACTIVE',
        },
      });

      await fixSequence('gates');
      await tx.gate.create({
        data: {
          societyId: newSociety.id,
          name: 'Main Gate',
        },
      });

      return newSociety;
    });

    return society;
  },

  getSocieties: async ({ page = 1, limit = 10, status, type, search, source }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.status = status;
    if (type) where.type = type.toUpperCase();
    if (source) where.source = source;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [societies, total] = await Promise.all([
      prisma.society.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true } } },
      }),
      prisma.society.count({ where }),
    ]);

    return { societies, total };
  },

  getSocietyById: async ({ societyId, reqUser }) => {
    if (isNaN(societyId)) throw { status: 400, message: 'Invalid society ID' };

    const restrictedRoles = ['SOCIETY_ADMIN', 'RESIDENT', 'SECURITY'];
    if (restrictedRoles.includes(reqUser.role_name) && reqUser.society_id !== societyId) {
      throw { status: 403, message: 'Access denied. You can only view your own society.' };
    }

    const society = await prisma.society.findUnique({
      where: { id: societyId },
      include: { _count: { select: { users: true } } },
    });

    if (!society) throw { status: 404, message: 'Society not found' };

    return society;
  },

  updateSociety: async ({
    societyId,
    name,
    type,
    address,
    city,
    state,
    pincode,
    subscriptionId,
    status,
    razorpayKey,
    reqUser,
  }) => {
    if (isNaN(societyId)) throw { status: 400, message: 'Invalid society ID' };

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== societyId) {
      throw { status: 403, message: 'Access denied. You can only update your own society.' };
    }

    const existingSociety = await prisma.society.findUnique({ where: { id: societyId } });
    if (!existingSociety) throw { status: 404, message: 'Society not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN') {
      if (subscriptionId !== undefined || status !== undefined) {
        throw {
          status: 403,
          message: 'Access denied. Only Super Admin can update status and subscription.',
        };
      }
    }

    if (type && !['APARTMENT', 'OFFICE'].includes(type.toUpperCase())) {
      throw { status: 400, message: 'Type must be either "APARTMENT" or "OFFICE"' };
    }

    if (status && !['ACTIVE', 'EXPIRED'].includes(status.toUpperCase())) {
      throw { status: 400, message: 'Status must be either "ACTIVE" or "EXPIRED"' };
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type.toUpperCase();
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (razorpayKey !== undefined) updateData.razorpayKey = razorpayKey;

    if (reqUser.role_name === 'SUPER_ADMIN') {
      if (subscriptionId !== undefined) updateData.subscriptionId = subscriptionId;
      if (status) updateData.status = status.toUpperCase();
    }

    const society = await prisma.society.update({
      where: { id: societyId },
      data: updateData,
    });

    const changes = [];
    if (name && name !== existingSociety.name)
      changes.push(`name: "${existingSociety.name}" → "${name}"`);
    if (type && type.toUpperCase() !== existingSociety.type)
      changes.push(`type: "${existingSociety.type}" → "${type.toUpperCase()}"`);
    if (status && status.toUpperCase() !== existingSociety.status)
      changes.push(`status: "${existingSociety.status}" → "${status.toUpperCase()}"`);
    if (address !== undefined && address !== existingSociety.address)
      changes.push('address updated');
    if (city !== undefined && city !== existingSociety.city)
      changes.push(`city: "${existingSociety.city || 'N/A'}" → "${city || 'N/A'}"`);
    if (state !== undefined && state !== existingSociety.state)
      changes.push(`state: "${existingSociety.state || 'N/A'}" → "${state || 'N/A'}"`);
    if (pincode !== undefined && pincode !== existingSociety.pincode)
      changes.push('pincode updated');
    if (razorpayKey !== undefined && razorpayKey !== existingSociety.razorpayKey)
      changes.push('razorpayKey updated');
    if (subscriptionId !== undefined && subscriptionId !== existingSociety.subscriptionId) {
      changes.push(
        `subscriptionId: ${existingSociety.subscriptionId || 'N/A'} → ${subscriptionId || 'N/A'}`
      );
    }

    return { society, changes };
  },

  deleteSociety: async ({ societyId }) => {
    if (isNaN(societyId)) throw { status: 400, message: 'Invalid society ID' };

    const society = await prisma.society.findUnique({
      where: { id: societyId },
      include: { _count: { select: { users: true } } },
    });

    if (!society) throw { status: 404, message: 'Society not found' };

    if (society._count.users > 0) {
      throw {
        status: 400,
        message: 'Cannot delete society with existing users. Please remove users first.',
      };
    }

    await prisma.society.delete({
      where: { id: societyId },
    });

    return society;
  },
};
