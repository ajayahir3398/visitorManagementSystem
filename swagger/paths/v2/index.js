import authPaths from './auth.js';
import healthPaths from './health.js';

export default {
  ...healthPaths,
  ...authPaths,
};
