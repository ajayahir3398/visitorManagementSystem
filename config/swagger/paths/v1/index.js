import authPaths from './auth.js';
import healthPaths from './health.js';
import societyPaths from './society.js';
import userPaths from './user.js';
import subscriptionPaths from './subscription.js';
import gatePaths from './gate.js';
import visitorPaths from './visitor.js';
import visitorLogPaths from './visitorLog.js';
import unitPaths from './unit.js';
import approvalPaths from './approval.js';
import preApprovalPaths from './preApproval.js';
import auditLogPaths from './auditLog.js';

export default {
  ...healthPaths,
  ...authPaths,
  ...societyPaths,
  ...userPaths,
  ...subscriptionPaths,
  ...gatePaths,
  ...visitorPaths,
  ...visitorLogPaths,
  ...unitPaths,
  ...approvalPaths,
  ...preApprovalPaths,
  ...auditLogPaths,
};

