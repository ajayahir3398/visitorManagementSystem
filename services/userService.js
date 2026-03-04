import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { createTrialSubscription } from './subscriptionService.js';
import { fixSequence } from '../utils/sequenceFix.js';

export const UserService = {
  createUser: async ({
    name,
    email,
    mobile,
    password,
    societyId,
    roleId,
    status,
    photoBase64,
    reqUser: _reqUser,
  }) => {
    if (!name || !mobile) {
      throw { status: 400, message: 'Name and mobile are required' };
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      throw { status: 400, message: 'Mobile must be 10 digits' };
    }
    if (email && !email.includes('@')) {
      throw { status: 400, message: 'Invalid email format' };
    }

    const existingMobile = await prisma.user.findUnique({ where: { mobile } });
    if (existingMobile) {
      throw { status: 400, message: 'User with this mobile number already exists' };
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        throw { status: 400, message: 'User with this email already exists' };
      }
    }

    let role;
    if (roleId) {
      role = await prisma.role.findUnique({ where: { id: roleId } });
    } else {
      role = await prisma.role.findUnique({ where: { name: 'SOCIETY_ADMIN' } });
    }
    if (!role) {
      throw { status: 400, message: 'Invalid role' };
    }

    if (societyId) {
      const society = await prisma.society.findUnique({ where: { id: societyId } });
      if (!society) {
        throw { status: 400, message: 'Society not found' };
      }
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await fixSequence('users');

    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        passwordHash,
        roleId: role.id,
        societyId: societyId || null,
        status: status || 'ACTIVE',
        photoBase64: photoBase64 || null,
      },
      include: { role: true, society: true },
    });

    if (role.name === 'SOCIETY_ADMIN' && user.societyId) {
      try {
        const existingSubscription = await prisma.subscription.findFirst({
          where: { societyId: user.societyId },
        });
        if (!existingSubscription) {
          await createTrialSubscription(user.societyId, 14);
        }
      } catch (error) {
        console.error('Error creating trial subscription:', error);
      }
    }

    delete user.passwordHash;
    return { user, actionRole: role.name };
  },

  getUsers: async ({ page = 1, limit = 10, status, roleId, societyId, search, reqUser }) => {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (status) where.status = status;
    if (roleId) where.roleId = parseInt(roleId);
    if (societyId) where.societyId = parseInt(societyId);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search } },
      ];
    }

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id) {
      where.societyId = reqUser.society_id;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          mobile: true,
          photoBase64: true,
          roleId: true,
          role: { select: { id: true, name: true, createdAt: true } },
          societyId: true,
          society: { select: { id: true, name: true, type: true } },
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  },

  getUserById: async ({ userId, reqUser }) => {
    if (isNaN(userId)) throw { status: 400, message: 'Invalid user ID' };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        photoBase64: true,
        roleId: true,
        role: { select: { id: true, name: true, createdAt: true } },
        societyId: true,
        society: {
          select: { id: true, name: true, type: true, address: true, city: true, state: true },
        },
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw { status: 404, message: 'User not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== user.societyId) {
      throw { status: 403, message: 'Access denied. You can only view users from your society.' };
    }

    if (
      (reqUser.role_name === 'RESIDENT' || reqUser.role_name === 'SECURITY') &&
      reqUser.id !== user.id
    ) {
      throw { status: 403, message: 'Access denied. You can only view your own profile.' };
    }

    return user;
  },

  updateUser: async ({
    userId,
    name,
    email,
    mobile,
    password,
    societyId,
    roleId,
    status,
    photoBase64,
    reqUser,
  }) => {
    if (isNaN(userId)) throw { status: 400, message: 'Invalid user ID' };

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw { status: 404, message: 'User not found' };

    if (reqUser.role_name === 'SOCIETY_ADMIN' && reqUser.society_id !== existingUser.societyId) {
      throw { status: 403, message: 'Access denied. You can only update users from your society.' };
    }

    if (
      (reqUser.role_name === 'RESIDENT' || reqUser.role_name === 'SECURITY') &&
      reqUser.id !== existingUser.id
    ) {
      throw { status: 403, message: 'Access denied. You can only update your own profile.' };
    }

    if (reqUser.role_name === 'RESIDENT' || reqUser.role_name === 'SECURITY') {
      if (roleId || societyId || status) {
        throw {
          status: 403,
          message: 'Access denied. You cannot update role, society, or status.',
        };
      }
    }

    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      throw { status: 400, message: 'Mobile must be 10 digits' };
    }

    if (mobile && mobile !== existingUser.mobile) {
      const mobileExists = await prisma.user.findUnique({ where: { mobile } });
      if (mobileExists)
        throw { status: 400, message: 'User with this mobile number already exists' };
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) throw { status: 400, message: 'User with this email already exists' };
    }

    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) throw { status: 400, message: 'Invalid role' };
    }

    if (societyId) {
      const society = await prisma.society.findUnique({ where: { id: societyId } });
      if (!society) throw { status: 400, message: 'Society not found' };
    }

    let passwordHash = existingUser.passwordHash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (password) updateData.passwordHash = passwordHash;
    if (societyId !== undefined) updateData.societyId = societyId;
    if (roleId) updateData.roleId = roleId;
    if (photoBase64 !== undefined) updateData.photoBase64 = photoBase64;
    if (status) updateData.status = status;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        photoBase64: true,
        roleId: true,
        role: { select: { id: true, name: true, createdAt: true } },
        societyId: true,
        society: { select: { id: true, name: true, type: true } },
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const changes = [];
    if (name && name !== existingUser.name)
      changes.push(`name: "${existingUser.name}" → "${name}"`);
    if (email !== undefined && email !== existingUser.email)
      changes.push(`email: "${existingUser.email || 'N/A'}" → "${email || 'N/A'}"`);
    if (mobile && mobile !== existingUser.mobile)
      changes.push(`mobile: "${existingUser.mobile}" → "${mobile}"`);
    if (password) changes.push('password updated');
    if (societyId !== undefined && societyId !== existingUser.societyId)
      changes.push(`societyId: ${existingUser.societyId || 'N/A'} → ${societyId || 'N/A'}`);
    if (roleId && roleId !== existingUser.roleId) {
      const oldRole = await prisma.role.findUnique({ where: { id: existingUser.roleId } });
      const newRole = await prisma.role.findUnique({ where: { id: roleId } });
      changes.push(`role: "${oldRole?.name || 'N/A'}" → "${newRole?.name || 'N/A'}"`);
    }
    if (status && status !== existingUser.status) {
      changes.push(`status: "${existingUser.status}" → "${status}"`);
    }

    return {
      user,
      existingUser,
      changes,
      statusChanged: status && status !== existingUser.status,
      newStatus: status,
    };
  },

  deleteUser: async ({ userId, reqUser }) => {
    if (isNaN(userId)) throw { status: 400, message: 'Invalid user ID' };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) throw { status: 404, message: 'User not found' };

    if (user.role.name === 'SUPER_ADMIN') {
      throw { status: 403, message: 'Cannot delete SUPER_ADMIN user' };
    }

    if (reqUser.role_name === 'SOCIETY_ADMIN') {
      if (user.role.name === 'SUPER_ADMIN' || user.role.name === 'SOCIETY_ADMIN') {
        throw {
          status: 403,
          message: 'SOCIETY_ADMIN can only delete SECURITY and RESIDENT users.',
        };
      }
      if (!reqUser.society_id || user.societyId !== reqUser.society_id) {
        throw {
          status: 403,
          message: 'Access denied. You can only delete users from your own society.',
        };
      }
    }

    const [approvalsCount, visitorLogsCount] = await Promise.all([
      prisma.approval.count({ where: { residentId: userId } }),
      prisma.visitorLog.count({ where: { createdBy: userId } }),
    ]);

    const relatedRecords = [];
    if (approvalsCount > 0) relatedRecords.push(`${approvalsCount} approval record(s)`);
    if (visitorLogsCount > 0)
      relatedRecords.push(`${visitorLogsCount} visitor log(s) created by this user`);

    if (relatedRecords.length > 0) {
      throw {
        status: 400,
        message: `Cannot delete user. This user has ${relatedRecords.join(' and ')}. Please remove or reassign these records first.`,
      };
    }

    try {
      await prisma.user.delete({ where: { id: userId } });
    } catch (error) {
      if (error.code === 'P2003') {
        throw {
          status: 400,
          message:
            'Cannot delete user. This user has related records in the system. Please remove or reassign related records first.',
        };
      }
      throw error;
    }

    return user;
  },

  processBulkUploadRow: async ({ row, reqUser }) => {
    const unitNo = row.unit_no?.trim();
    const block = row.block?.trim();
    const name = row.name?.trim();
    const mobile = row.mobile?.trim();
    const email = row.email?.trim() || null;
    const roleName = row.role?.trim().toUpperCase() || 'OWNER';

    if (!unitNo || !name || !mobile) {
      throw new Error('unit_no, name, and mobile are required');
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      throw new Error('Invalid mobile number format');
    }

    const unit = await prisma.unit.findFirst({
      where: {
        societyId: reqUser.society_id,
        unitNo: unitNo,
        block: block || null,
      },
    });

    if (!unit) {
      throw new Error(`Unit ${unitNo} ${block ? `(Block ${block})` : ''} not found`);
    }

    let user = await prisma.user.findUnique({ where: { mobile } });

    if (!user) {
      const residentRole = await prisma.role.findUnique({ where: { name: 'RESIDENT' } });
      if (!residentRole) throw new Error('Resident role not found in system');

      await fixSequence('users');

      user = await prisma.user.create({
        data: {
          name,
          mobile,
          email,
          roleId: residentRole.id,
          societyId: reqUser.society_id,
          status: 'ACTIVE',
        },
      });
    }

    const existingMember = await prisma.unitMember.findUnique({
      where: {
        unitId_userId: { unitId: unit.id, userId: user.id },
      },
    });

    if (existingMember) {
      throw new Error(`User ${name} (${mobile}) is already a member of unit ${unitNo}`);
    }

    await fixSequence('unit_members');

    await prisma.unitMember.create({
      data: {
        unitId: unit.id,
        userId: user.id,
        role: roleName,
        isPrimary: false,
      },
    });

    return { user, unit };
  },
};
