import commonSchemas from '../common.js';
import userSchemas from './user.js';
import authSchemas from './auth.js';
import societySchemas from './society.js';
import userManagementSchemas from './userManagement.js';
import subscriptionSchemas from './subscription.js';
import planSchemas from './plan.js';
import gateSchemas from './gate.js';
import visitorSchemas from './visitor.js';
import visitorLogSchemas from './visitorLog.js';
import unitSchemas from './unit.js';
import approvalSchemas from './approval.js';
import preApprovalSchemas from './preApproval.js';
import auditLogSchemas from './auditLog.js';

export default {
  ...commonSchemas,
  ...userSchemas,
  ...authSchemas,
  ...societySchemas,
  ...userManagementSchemas,
  ...subscriptionSchemas,
  ...planSchemas,
  ...gateSchemas,
  ...visitorSchemas,
  ...visitorLogSchemas,
  ...unitSchemas,
  ...approvalSchemas,
  ...preApprovalSchemas,
  ...auditLogSchemas,
};

