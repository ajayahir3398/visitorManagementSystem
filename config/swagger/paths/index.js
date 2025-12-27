// Import versioned paths
import v1Paths from './v1/index.js';
import v2Paths from './v2/index.js';

// Combine all version paths
// Paths should include version prefix in their keys
export default {
  ...v1Paths,
  // Future versions:
//   ...v2Paths,
};

