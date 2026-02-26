export default {
  '/api/v1/audit-logs': {
    get: {
      summary: 'Get audit logs',
      description:
        "Retrieve audit logs with filtering and pagination. Super Admin can see all logs, Society Admin can only see their society's logs.",
      tags: ['v1 - Audit Logs'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number (default: 1)',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page (default: 50, max: 100)',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 50,
          },
        },
        {
          name: 'action',
          in: 'query',
          description: 'Filter by action (e.g., LOGIN, VISITOR_ENTRY)',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'entity',
          in: 'query',
          description: 'Filter by entity type (e.g., VisitorLog, PreApprovedGuest)',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'userId',
          in: 'query',
          description: 'Filter by user ID',
          schema: {
            type: 'integer',
          },
        },
        {
          name: 'societyId',
          in: 'query',
          description: 'Filter by society ID (Super Admin only)',
          schema: {
            type: 'integer',
          },
        },
        {
          name: 'role',
          in: 'query',
          description: 'Filter by role',
          schema: {
            type: 'string',
          },
        },
        {
          name: 'startDate',
          in: 'query',
          description: 'Filter logs from this date (ISO 8601 format)',
          schema: {
            type: 'string',
            format: 'date-time',
          },
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'Filter logs until this date (ISO 8601 format)',
          schema: {
            type: 'string',
            format: 'date-time',
          },
        },
      ],
      responses: {
        200: {
          description: 'Audit logs retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AuditLogsResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/audit-logs/stats': {
    get: {
      summary: 'Get audit log statistics',
      description:
        'Retrieve statistics about audit logs including action counts, role distribution, and entity counts.',
      tags: ['v1 - Audit Logs'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'startDate',
          in: 'query',
          description: 'Filter statistics from this date (ISO 8601 format)',
          schema: {
            type: 'string',
            format: 'date-time',
          },
        },
        {
          name: 'endDate',
          in: 'query',
          description: 'Filter statistics until this date (ISO 8601 format)',
          schema: {
            type: 'string',
            format: 'date-time',
          },
        },
      ],
      responses: {
        200: {
          description: 'Audit log statistics retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AuditLogStatsResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/audit-logs/{id}': {
    get: {
      summary: 'Get audit log by ID',
      description: 'Retrieve a specific audit log by its ID.',
      tags: ['v1 - Audit Logs'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Audit log ID',
          schema: {
            type: 'integer',
          },
        },
      ],
      responses: {
        200: {
          description: 'Audit log retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AuditLogResponse',
              },
            },
          },
        },
        404: {
          description: 'Audit log not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
};
