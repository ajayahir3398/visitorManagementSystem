// Import versioned schemas
import v1Schemas from './v1/index.js';
import v2Schemas from './v2/index.js';

// Combine all version schemas
export default {
  ...v1Schemas,
  ...v2Schemas,
};
