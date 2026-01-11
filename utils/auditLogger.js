import prisma from '../lib/prisma.js';
import { fixSequence } from './sequenceFix.js';
/**
 * Central Audit Logger Utility
 * 
 * Logs user actions for security, debugging, compliance, and audit purposes.
 * 
 * @param {Object} params - Audit log parameters
 * @param {Object} params.user - User object from req.user (optional)
 * @param {String} params.action - Action name (e.g., "LOGIN", "VISITOR_ENTRY", "PRE_APPROVAL_CREATED")
 * @param {String} params.entity - Entity type (e.g., "VisitorLog", "PreApprovedGuest", "Society")
 * @param {Number} params.entityId - ID of the affected entity (optional)
 * @param {String} params.description - Human-readable description (optional)
 * @param {Object} params.req - Express request object (optional, for IP and user agent)
 * 
 * @example
 * await logAction({
 *   user: req.user,
 *   action: "VISITOR_ENTRY",
 *   entity: "VisitorLog",
 *   entityId: visitorLog.id,
 *   description: "Visitor entry created",
 *   req
 * });
 */
export const logAction = async ({
  user = null,
  action,
  entity,
  entityId = null,
  description = null,
  req = null,
}) => {
  try {
    // Extract IP address from request
    let ipAddress = null;
    if (req) {
      ipAddress =
        req.ip ||
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        null;
    }

    // Extract user agent from request
    const userAgent = req?.headers['user-agent'] || null;

    // Get role name from user if available
    const role = user?.role_name || user?.role?.name || null;

    // Create audit log entry
    await fixSequence('audit_logs');
    await prisma.auditLog.create({
      data: {
        userId: user?.id || null,
        societyId: user?.society_id || user?.societyId || null,
        role: role,
        action: action,
        entity: entity,
        entityId: entityId,
        description: description,
        ipAddress: ipAddress,
        userAgent: userAgent,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error);
  }
};

/**
 * Action constants for consistency
 * Use these constants instead of hardcoding action strings
 */
export const AUDIT_ACTIONS = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  OTP_SENT: 'OTP_SENT',
  OTP_VERIFIED: 'OTP_VERIFIED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',

  // Society Management
  CREATE_SOCIETY: 'CREATE_SOCIETY',
  UPDATE_SOCIETY: 'UPDATE_SOCIETY',
  DELETE_SOCIETY: 'DELETE_SOCIETY',
  SOCIETY_LOCKED: 'SOCIETY_LOCKED',
  SOCIETY_UNLOCKED: 'SOCIETY_UNLOCKED',
  SOCIETY_SELF_REGISTRATION_OTP_SENT: 'SOCIETY_SELF_REGISTRATION_OTP_SENT',
  SOCIETY_SELF_REGISTERED: 'SOCIETY_SELF_REGISTERED',

  // User Management
  CREATE_USER: 'CREATE_USER',
  CREATE_SOCIETY_ADMIN: 'CREATE_SOCIETY_ADMIN',
  UPDATE_USER: 'UPDATE_USER',
  DELETE_USER: 'DELETE_USER',
  BLOCK_USER: 'BLOCK_USER',
  UNBLOCK_USER: 'UNBLOCK_USER',

  // Visitor Management
  VISITOR_ENTRY: 'VISITOR_ENTRY',
  VISITOR_APPROVED: 'VISITOR_APPROVED',
  VISITOR_REJECTED: 'VISITOR_REJECTED',
  VISITOR_EXIT: 'VISITOR_EXIT',
  CREATE_VISITOR: 'CREATE_VISITOR',
  UPDATE_VISITOR: 'UPDATE_VISITOR',

  // Pre-Approval Management
  PRE_APPROVAL_CREATED: 'PRE_APPROVAL_CREATED',
  PRE_APPROVAL_USED: 'PRE_APPROVAL_USED',
  PRE_APPROVAL_REVOKED: 'PRE_APPROVAL_REVOKED',
  PRE_APPROVAL_EXPIRED: 'PRE_APPROVAL_EXPIRED',

  // Subscription Management
  SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_RENEWED: 'SUBSCRIPTION_RENEWED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  SUBSCRIPTION_PURCHASED: 'SUBSCRIPTION_PURCHASED',

  // General CRUD
  CREATED: 'CREATED',
  UPDATED: 'UPDATED',
  DELETED: 'DELETED',
  ACTIVATED: 'ACTIVATED',
  DEACTIVATED: 'DEACTIVATED',

  // Unit Management
  CREATE_UNIT: 'CREATE_UNIT',
  UPDATE_UNIT: 'UPDATE_UNIT',
  DELETE_UNIT: 'DELETE_UNIT',
  ADD_UNIT_MEMBER: 'ADD_UNIT_MEMBER',
  REMOVE_UNIT_MEMBER: 'REMOVE_UNIT_MEMBER',

  // Gate Management
  CREATE_GATE: 'CREATE_GATE',
  UPDATE_GATE: 'UPDATE_GATE',
  DELETE_GATE: 'DELETE_GATE',

  // Rule Management
  RULE_CREATED: 'RULE_CREATED',
  RULE_UPDATED: 'RULE_UPDATED',
  RULE_DEACTIVATED: 'RULE_DEACTIVATED',

  // Violation Management
  VIOLATION_REPORTED: 'VIOLATION_REPORTED',
  VIOLATION_UPDATED: 'VIOLATION_UPDATED',
  VIOLATION_RESOLVED: 'VIOLATION_RESOLVED',

  // Notice Board
  NOTICE_CREATED: 'NOTICE_CREATED',
  NOTICE_UPDATED: 'NOTICE_UPDATED',
  NOTICE_DEACTIVATED: 'NOTICE_DEACTIVATED',
  NOTICE_READ: 'NOTICE_READ',

  // Maintenance Management
  MAINTENANCE_PLAN_UPSERTED: 'MAINTENANCE_PLAN_UPSERTED',
  MAINTENANCE_BILL_GENERATED: 'MAINTENANCE_BILL_GENERATED',
  MAINTENANCE_BILL_PAID: 'MAINTENANCE_BILL_PAID',

  // Emergency Management
  EMERGENCY_RAISED: 'EMERGENCY_RAISED',
  EMERGENCY_ACKNOWLEDGED: 'EMERGENCY_ACKNOWLEDGED',
  EMERGENCY_RESPONDED: 'EMERGENCY_RESPONDED',
  EMERGENCY_RESOLVED: 'EMERGENCY_RESOLVED',
};

/**
 * Entity constants for consistency
 */
export const AUDIT_ENTITIES = {
  USER: 'User',
  SOCIETY: 'Society',
  VISITOR: 'Visitor',
  VISITOR_LOG: 'VisitorLog',
  PRE_APPROVED_GUEST: 'PreApprovedGuest',
  SUBSCRIPTION: 'Subscription',
  SUBSCRIPTION_PLAN: 'SubscriptionPlan',
  UNIT: 'Unit',
  GATE: 'Gate',
  APPROVAL: 'Approval',
  PAYMENT: 'Payment',
  INVOICE: 'Invoice',
  RULE: 'Rule',
  RULE_VIOLATION: 'RuleViolation',
  NOTICE: 'Notice',
  SOCIETY_MAINTENANCE_PLAN: 'SocietyMaintenancePlan',
  MAINTENANCE_BILL: 'MaintenanceBill',
  MAINTENANCE_PAYMENT: 'MaintenancePayment',
  EMERGENCY_REQUEST: 'EmergencyRequest',
  EMERGENCY_RESPONSE: 'EmergencyResponse',
};


