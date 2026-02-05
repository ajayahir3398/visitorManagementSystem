export default {
  '/api/v1/visitor-logs': {
    post: {
      summary: 'Create visitor entry (log entry)',
      description: 'Security guard logs a visitor entry. Creates a visitor log with entry time.',
      tags: ['v1 - Visitor Logs'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateVisitorEntryRequest',
            },
            example: {
              visitorId: 1,
              gateId: 1,
              unitId: 1,
              flatNo: 'A-101',
              purpose: 'Delivery',
              photoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
              entryTime: '2024-01-01T10:00:00.000Z',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Visitor entry logged successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorLogResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error or visitor already has active entry',
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
          description: 'Forbidden - SECURITY role only',
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
    get: {
      summary: 'Get all visitor logs',
      tags: ['v1 - Visitor Logs'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
          description: 'Items per page',
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'exited'],
          },
          description: 'Filter by status',
        },
        {
          name: 'gateId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by gate ID',
        },
        {
          name: 'visitorId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by visitor ID',
        },
        {
          name: 'flatNo',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by flat number',
        },
        {
          name: 'date',
          in: 'query',
          schema: { type: 'string', format: 'date' },
          description: 'Filter by date (YYYY-MM-DD)',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search by flat number, purpose, visitor name, or mobile',
        },
      ],
      responses: {
        200: {
          description: 'Visitor logs retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorLogsListResponse',
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
      },
    },
  },
  '/api/v1/visitor-logs/active': {
    get: {
      summary: 'Get active entries (visitors currently inside)',
      description: 'Get list of visitors who have entered but not exited yet',
      tags: ['v1 - Visitor Logs'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
          description: 'Items per page',
        },
        {
          name: 'gateId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by gate ID',
        },
      ],
      responses: {
        200: {
          description: 'Active entries retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorLogsListResponse',
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
          description: 'Forbidden - SUPER_ADMIN, SOCIETY_ADMIN, or SECURITY only',
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
  '/api/v1/visitor-logs/{id}': {
    get: {
      summary: 'Get visitor log by ID',
      tags: ['v1 - Visitor Logs'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Visitor log ID',
        },
      ],
      responses: {
        200: {
          description: 'Visitor log retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorLogResponse',
              },
            },
          },
        },
        404: {
          description: 'Visitor log not found',
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
          description: 'Forbidden',
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
  '/api/v1/visitor-logs/{id}/exit': {
    put: {
      summary: 'Mark visitor exit',
      description: 'Security guard marks a visitor exit. Updates exit time and status to "exited".',
      tags: ['v1 - Visitor Logs'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Visitor log ID',
        },
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/MarkExitRequest',
            },
            example: {
              exitTime: '2024-01-01T12:00:00.000Z',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Visitor exit marked successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorLogResponse',
              },
            },
          },
        },
        400: {
          description: 'Visitor already exited',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Visitor log not found',
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
          description: 'Forbidden - SECURITY role only',
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

