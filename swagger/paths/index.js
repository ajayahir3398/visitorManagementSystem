// Import versioned inputs
import v1Paths from './v1/index.js';
import _v2Paths from './v2/index.js';

// Combine all version paths
export default {
  ...v1Paths,
  // ...v2Paths,
};
