import swaggerJsdoc from 'swagger-jsdoc';
import schemas from './schemas/index.js';
import paths from './paths/index.js';
import tags from './tags/index.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Visitor Management System API',
      version: '1.0.0',
      description: 'API documentation for Visitor Management System - A system for managing visitors in apartments/societies and corporate offices',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 1111}`,
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas,
    },
    paths,
    tags,
  },
  apis: ['./routes/*.js', './app.js'], // Path to the API files for JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;

