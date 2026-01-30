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
import securitySchemas from './security.js';
import ruleSchemas from './rule.js';
import violationSchemas from './violation.js';
import noticeSchemas from './notice.js';
import emergencySchemas from './emergency.js';
import publicSchemas from './public.js';
import maintenancePlanSchemas from './maintenancePlan.js';
import maintenanceSchemas from './maintenance.js';
import notificationSchemas from './notification.js';

export default {
  ...commonSchemas,
  ...userSchemas,
  ...authSchemas,
  ...publicSchemas,
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
  ...securitySchemas,
  ...ruleSchemas,
  ...violationSchemas,
  ...noticeSchemas,
  ...emergencySchemas,
  ...maintenancePlanSchemas,
  ...maintenanceSchemas,
  ...notificationSchemas,
};
