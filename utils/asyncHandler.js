/**
 * Wrapper for async route handlers to automatically catch and pass errors to Express's next()
 * Eliminates the need for repetitive try-catch blocks in controllers.
 *
 * @param {Function} fn - The async route handler
 * @returns {Function} - Wrapped middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
