import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../lib/prisma.js';

/**
 * Middleware to verify JWT token
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header required.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        status: 'active',
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    // Format user object to match previous structure
    req.user = {
      ...user,
      role_name: user.role.name,
      society_id: user.societyId, // Add snake_case for consistency
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Invalid or expired token',
    });
  }
};

/**
 * Middleware to check if user has required role(s)
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Required role: ' + allowedRoles.join(' or '),
      });
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't fail if token is missing
 * Useful for endpoints that can work with or without authentication
 */
export const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided - continue without setting req.user
      return next();
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        status: 'active',
      },
      include: {
        role: true,
      },
    });

    if (user) {
      // Format user object to match previous structure
      req.user = {
        ...user,
        role_name: user.role.name,
        society_id: user.societyId,
      };
    }

    // Continue even if user not found (token might be invalid, but that's OK for optional auth)
    next();
  } catch (error) {
    // Token is invalid, but continue anyway (optional auth)
    next();
  }
};

/**
 * Combined middleware: authenticate + authorize
 */
export const requireAuth = (allowedRoles) => {
  return [authenticate, ...(allowedRoles ? [authorize(...allowedRoles)] : [])];
};
