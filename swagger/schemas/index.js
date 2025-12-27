// Import versioned schemas
import v1Schemas from './v1/index.js';
import v2Schemas from './v2/index.js';

// Combine all version schemas
// Note: Common schemas are included in each version's index
export default {
  ...v1Schemas,
  ...v2Schemas,
  // Future versions:
  // ...v3Schemas,
};

