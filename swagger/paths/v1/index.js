import authPaths from './auth.js';
import healthPaths from './health.js';
import societyPaths from './society.js';
import userPaths from './user.js';
import subscriptionPaths from './subscription.js';
import planPaths from './plan.js';
import gatePaths from './gate.js';
import visitorPaths from './visitor.js';
import visitorLogPaths from './visitorLog.js';
import unitPaths from './unit.js';
import approvalPaths from './approval.js';
import preApprovalPaths from './preApproval.js';
import auditLogPaths from './auditLog.js';
import securityPaths from './security.js';
import rulePaths from './rule.js';
import violationPaths from './violation.js';
import noticePaths from './notice.js';
import publicPaths from './public.js';

export default {
  ...healthPaths,
  ...authPaths,
  ...publicPaths,
  ...societyPaths,
  ...userPaths,
  ...subscriptionPaths,
  ...planPaths,
  ...gatePaths,
  ...visitorPaths,
  ...visitorLogPaths,
  ...unitPaths,
  ...approvalPaths,
  ...preApprovalPaths,
  ...auditLogPaths,
  ...securityPaths,
  ...rulePaths,
  ...violationPaths,
  ...noticePaths,
};

