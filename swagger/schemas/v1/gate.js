export default {
  Gate: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      societyId: {
        type: 'integer',
        example: 1,
      },
      name: {
        type: 'string',
        example: 'Main Gate',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
      },
      society: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Green Valley Apartments' },
          type: { type: 'string', example: 'apartment' },
        },
      },
    },
  },
  CreateGateRequest: {
    type: 'object',
    required: ['name', 'societyId'],
    properties: {
      name: {
        type: 'string',
        example: 'Main Gate',
        description: 'Gate name (e.g., Main Gate, Back Gate)',
      },
      societyId: {
        type: 'integer',
        example: 1,
        description: 'Society ID',
      },
    },
  },
  UpdateGateRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Main Gate',
        description: 'Gate name',
      },
    },
  },
  GateResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Gate retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          gate: {
            $ref: '#/components/schemas/Gate',
          },
        },
      },
    },
  },
  GatesListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Gates retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          gates: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Gate',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 50 },
              pages: { type: 'integer', example: 5 },
            },
          },
        },
      },
    },
  },
};

