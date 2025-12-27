export default {
  '/api/v1/visitors': {
    post: {
      summary: 'Create a new visitor',
      tags: ['v1 - Visitors'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateVisitorRequest',
            },
            example: {
              name: 'John Doe',
              mobile: '1234567890',
              photoUrl: 'https://example.com/photo.jpg',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Visitor created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorResponse',
              },
            },
          },
        },
        200: {
          description: 'Visitor already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorResponse',
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
    get: {
      summary: 'Get all visitors (with search)',
      tags: ['v1 - Visitors'],
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
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search by name or mobile',
        },
        {
          name: 'mobile',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by exact mobile number',
        },
      ],
      responses: {
        200: {
          description: 'Visitors retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorsListResponse',
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
  '/api/v1/visitors/search': {
    get: {
      summary: 'Search visitors by name or mobile',
      description: 'Quick search endpoint for finding visitors. Minimum 2 characters required.',
      tags: ['v1 - Visitors'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string', minLength: 2 },
          description: 'Search query (name or mobile)',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20, maximum: 100 },
          description: 'Maximum number of results',
        },
      ],
      responses: {
        200: {
          description: 'Visitors found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Visitors found' },
                  data: {
                    type: 'object',
                    properties: {
                      visitors: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Visitor',
                        },
                      },
                    },
                  },
                },
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
      },
    },
  },
  '/api/v1/visitors/{id}': {
    get: {
      summary: 'Get visitor by ID',
      tags: ['v1 - Visitors'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Visitor ID',
        },
      ],
      responses: {
        200: {
          description: 'Visitor retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorResponse',
              },
            },
          },
        },
        404: {
          description: 'Visitor not found',
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
          description: 'Forbidden - RESIDENT can only view visitors from their society',
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
    put: {
      summary: 'Update visitor',
      tags: ['v1 - Visitors'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Visitor ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateVisitorRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Visitor updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VisitorResponse',
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
        404: {
          description: 'Visitor not found',
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
    delete: {
      summary: 'Delete visitor',
      tags: ['v1 - Visitors'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Visitor ID',
        },
      ],
      responses: {
        200: {
          description: 'Visitor deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Visitor deleted successfully' },
                },
              },
            },
          },
        },
        400: {
          description: 'Cannot delete visitor with visitor logs',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Visitor not found',
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
          description: 'Forbidden - SUPER_ADMIN or SOCIETY_ADMIN only',
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

