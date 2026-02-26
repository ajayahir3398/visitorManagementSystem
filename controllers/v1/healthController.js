/**
 * Health check controller for API v1
 * GET /api/v1/health
 */
export const healthCheck = (req, res) => {
  res.json({
    status: 'API running',
    version: 'v1',
    timestamp: new Date().toISOString(),
  });
};
