import { v4 as uuidv4 } from 'uuid';
import { getLogger } from '../utils/logger.js';

/**
 * Middleware to attach a unique request ID and a scoped logger to each request.
 */
export const requestIdMiddleware = (req, res, next) => {
  // Check if a trace ID is provided by the client/proxy, otherwise generate one
  const reqId = req.headers['x-request-id'] || uuidv4();

  req.id = reqId;
  req.logger = getLogger(reqId);

  // Set the request ID in the response headers
  res.setHeader('X-Request-Id', reqId);

  next();
};
