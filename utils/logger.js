import winston from 'winston';

// Custom format to include request ID if available
const logFormat = winston.format.printf(({ level, message, timestamp, reqId, ...meta }) => {
  return `${timestamp} [${reqId || 'SYSTEM'}] ${level}: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta) : ''
  }`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'visitor-api' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with level `info` and below to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production, log to the `console` with the custom format
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    })
  );
}

// Wrapper to easily pass reqId
export const getLogger = (reqId) => {
  return logger.child({ reqId });
};

export default logger;
