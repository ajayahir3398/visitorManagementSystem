import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma.js';
import { createTrialSubscription } from '../../services/subscriptionService.js';
import { logAction, AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../utils/auditLogger.js';

/**
 * Create a new user (Society Admin)
 * POST /api/v1/users
 * Access: SUPER_ADMIN only
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, mobile, password, societyId, roleId, status } = req.body;

    // Validation
    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Name and mobile are required',
      });
    }

    // Validate mobile format
    if (!/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile must be 10 digits',
      });
    }

    // Validate email if provided
    if (email && !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Check if mobile already exists
    const existingMobile = await prisma.user.findUnique({
      where: { mobile },
    });

    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: 'User with this mobile number already exists',
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }
    }

    // Get role - default to SOCIETY_ADMIN if not provided
    let role;
    if (roleId) {
      role = await prisma.role.findUnique({ where: { id: roleId } });
    } else {
      role = await prisma.role.findUnique({ where: { name: 'SOCIETY_ADMIN' } });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    // Validate society if provided
    if (societyId) {
      const society = await prisma.society.findUnique({
        where: { id: societyId },
      });

      if (!society) {
        return res.status(400).json({
          success: false,
          message: 'Society not found',
        });
      }
    }

    // Hash password if provided
    let passwordHash = null;
    if (password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile,
        passwordHash,
        roleId: role.id,
        societyId: societyId || null,
        status: status || 'active',
      },
      include: {
        role: true,
        society: true,
      },
    });

    // If user is SOCIETY_ADMIN and has a society, create TRIAL subscription
    if (role.name === 'SOCIETY_ADMIN' && user.societyId) {
      try {
        // Check if subscription already exists
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            societyId: user.societyId,
          },
        });

        // Only create trial if no subscription exists
        if (!existingSubscription) {
          await createTrialSubscription(user.societyId, 60); // 60 days trial
        }
      } catch (subscriptionError) {
        console.error('Error creating trial subscription:', subscriptionError);
        // Don't fail user creation if subscription creation fails
        // Log error but continue
      }
    }

    // Remove password hash from response
    delete user.passwordHash;

    // Determine action type based on role
    const action = role.name === 'SOCIETY_ADMIN' 
      ? AUDIT_ACTIONS.CREATE_SOCIETY_ADMIN 
      : AUDIT_ACTIONS.CREATE_USER;

    // Log user creation
    await logAction({
      user: req.user,
      action,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      description: `User "${user.name}" (${user.role.name}) created${user.society ? ` for society "${user.society.name}"` : ''}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
    });
  }
};

/**
 * Get all users
 * GET /api/v1/users
 * Access: SUPER_ADMIN, SOCIETY_ADMIN
 */
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, roleId, societyId, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
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

    // If user is SOCIETY_ADMIN, only show users from their society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id) {
      where.societyId = req.user.society_id;
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
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
          societyId: true,
          society: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message,
    });
  }
};

/**
 * Get user by ID
 * GET /api/v1/users/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (users from their society only)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        societyId: true,
        society: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
            city: true,
            state: true,
          },
        },
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If user is SOCIETY_ADMIN, only allow access to users from their society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== user.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view users from your society.',
      });
    }

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message,
    });
  }
};

/**
 * Update user
 * PUT /api/v1/users/:id
 * Access: SUPER_ADMIN, SOCIETY_ADMIN (users from their society only)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);
    const { name, email, mobile, password, societyId, roleId, status } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If user is SOCIETY_ADMIN, only allow updating users from their society
    if (req.user.role_name === 'SOCIETY_ADMIN' && req.user.society_id !== existingUser.societyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update users from your society.',
      });
    }

    // Validate mobile if provided
    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile must be 10 digits',
      });
    }

    // Check if mobile already exists (if changed)
    if (mobile && mobile !== existingUser.mobile) {
      const mobileExists = await prisma.user.findUnique({
        where: { mobile },
      });

      if (mobileExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this mobile number already exists',
        });
      }
    }

    // Check if email already exists (if changed)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }
    }

    // Validate role if provided
    if (roleId) {
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
      }
    }

    // Validate society if provided
    if (societyId) {
      const society = await prisma.society.findUnique({
        where: { id: societyId },
      });

      if (!society) {
        return res.status(400).json({
          success: false,
          message: 'Society not found',
        });
      }
    }

    // Hash password if provided
    let passwordHash = existingUser.passwordHash;
    if (password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (password) updateData.passwordHash = passwordHash;
    if (societyId !== undefined) updateData.societyId = societyId;
    if (roleId) updateData.roleId = roleId;
    if (status) updateData.status = status;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        mobile: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        societyId: true,
        society: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Build description of what changed
    const changes = [];
    if (name && name !== existingUser.name) changes.push(`name: "${existingUser.name}" → "${name}"`);
    if (email !== undefined && email !== existingUser.email) changes.push(`email: "${existingUser.email || 'N/A'}" → "${email || 'N/A'}"`);
    if (mobile && mobile !== existingUser.mobile) changes.push(`mobile: "${existingUser.mobile}" → "${mobile}"`);
    if (password) changes.push('password updated');
    if (societyId !== undefined && societyId !== existingUser.societyId) changes.push(`societyId: ${existingUser.societyId || 'N/A'} → ${societyId || 'N/A'}`);
    if (roleId && roleId !== existingUser.roleId) {
      const oldRole = await prisma.role.findUnique({ where: { id: existingUser.roleId } });
      const newRole = await prisma.role.findUnique({ where: { id: roleId } });
      changes.push(`role: "${oldRole?.name || 'N/A'}" → "${newRole?.name || 'N/A'}"`);
    }
    if (status && status !== existingUser.status) {
      changes.push(`status: "${existingUser.status}" → "${status}"`);
      // Log block/unblock separately if status changed
      if (status === 'blocked' && existingUser.status === 'active') {
        await logAction({
          user: req.user,
          action: AUDIT_ACTIONS.BLOCK_USER,
          entity: AUDIT_ENTITIES.USER,
          entityId: user.id,
          description: `User "${user.name}" blocked`,
          req,
        });
      } else if (status === 'active' && existingUser.status === 'blocked') {
        await logAction({
          user: req.user,
          action: AUDIT_ACTIONS.UNBLOCK_USER,
          entity: AUDIT_ENTITIES.USER,
          entityId: user.id,
          description: `User "${user.name}" unblocked`,
          req,
        });
      }
    }

    const description = changes.length > 0
      ? `User "${user.name}" updated: ${changes.join(', ')}`
      : `User "${user.name}" updated`;

    // Log user update (unless it was a block/unblock which was already logged)
    if (!status || status === existingUser.status || (status !== 'blocked' && status !== 'active')) {
      await logAction({
        user: req.user,
        action: AUDIT_ACTIONS.UPDATE_USER,
        entity: AUDIT_ENTITIES.USER,
        entityId: user.id,
        description,
        req,
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
};

/**
 * Delete user
 * DELETE /api/v1/users/:id
 * Access: SUPER_ADMIN only
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent deleting SUPER_ADMIN
    if (user.role.name === 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete SUPER_ADMIN user',
      });
    }

    // Log user deletion before deleting
    await logAction({
      user: req.user,
      action: AUDIT_ACTIONS.DELETE_USER,
      entity: AUDIT_ENTITIES.USER,
      entityId: user.id,
      description: `User "${user.name}" (${user.role.name}) deleted`,
      req,
    });

    // Delete user (cascade will handle refresh tokens)
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
};

