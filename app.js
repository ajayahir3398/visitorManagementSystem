import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import apiRoutes from './routes/index.js';
import swaggerSpec from './swagger/index.js';
import { healthCheck } from './controllers/v1/healthController.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Visitor Management API Documentation',
}));

// Health check (version-independent)
app.get('/health', (req, res) => {
  res.json({ status: 'API running', message: 'Use /api/v1/health for versioned health check' });
});

// API Routes (versioned)
// All routes are now under /api/v1, /api/v2, etc.
app.use('/api', apiRoutes);

// Version-specific health checks
app.get('/api/v1/health', healthCheck);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

export default app;
