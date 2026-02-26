import commonSchemas from '../common.js';
import userSchemas from './user.js';
import authSchemas from './auth.js';

export default {
  ...commonSchemas,
  ...userSchemas,
  ...authSchemas,
};
