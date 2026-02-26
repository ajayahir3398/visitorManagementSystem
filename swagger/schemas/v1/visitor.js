export default {
  Visitor: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
      mobile: {
        type: 'string',
        example: '1234567890',
      },
      photoBase64: {
        type: 'string',
        nullable: true,
        example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
        description: 'Base64 data URI for the visitor photo',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
      },
    },
  },
  CreateVisitorRequest: {
    type: 'object',
    required: ['name', 'mobile'],
    properties: {
      name: {
        type: 'string',
        example: 'John Doe',
      },
      mobile: {
        type: 'string',
        pattern: '^[0-9]{10}$',
        example: '1234567890',
        description: '10-digit mobile number',
      },
      photoBase64: {
        type: 'string',
        nullable: true,
        example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
        description: 'Base64 data URI for the visitor photo',
      },
    },
  },
  UpdateVisitorRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'John Doe',
      },
      mobile: {
        type: 'string',
        pattern: '^[0-9]{10}$',
        example: '1234567890',
      },
      photoBase64: {
        type: 'string',
        nullable: true,
        example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
        description: 'Base64 data URI for the visitor photo',
      },
    },
  },
  VisitorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Visitor retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          visitor: {
            $ref: '#/components/schemas/Visitor',
          },
        },
      },
    },
  },
  VisitorsListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Visitors retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          visitors: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Visitor',
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
