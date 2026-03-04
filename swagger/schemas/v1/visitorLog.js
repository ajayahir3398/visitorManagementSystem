export default {
  VisitorLog: {
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
      gateId: {
        type: 'integer',
        example: 1,
      },
      visitorId: {
        type: 'integer',
        example: 1,
      },
      unitId: {
        type: 'integer',
        nullable: true,
        example: 1,
        description: 'Unit ID (preferred over flatNo)',
      },
      flatNo: {
        type: 'string',
        nullable: true,
        example: 'A-101',
        description: 'Flat number (kept for backward compatibility)',
      },
      purpose: {
        type: 'string',
        nullable: true,
        example: 'Delivery',
      },
      entryTime: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-01T10:00:00.000Z',
      },
      exitTime: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null,
      },
      preApprovalId: {
        type: 'integer',
        nullable: true,
        example: 1,
        description: 'ID of the pre-approval if used',
      },
      status: {
        type: 'string',
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'EXITED'],
        example: 'PENDING',
      },
      createdBy: {
        type: 'integer',
        example: 5,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
      },
      visitor: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'John Doe' },
          mobile: { type: 'string', example: '1234567890' },
          photoBase64: {
            type: 'string',
            nullable: true,
            example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
            description: 'Base64 data URI for the visitor photo',
          },
        },
      },
      gate: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Main Gate' },
        },
      },
      unit: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'integer', example: 1 },
          unitNo: { type: 'string', example: 'A-302' },
          unitType: { type: 'string', example: 'FLAT' },
        },
      },
      createdByUser: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          name: { type: 'string', example: 'Security Guard' },
        },
      },
      society: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Green Valley Apartments' },
        },
      },
    },
  },
  CreateVisitorEntryRequest: {
    type: 'object',
    required: ['visitorId', 'entryGateId', 'purpose'],
    properties: {
      visitorId: {
        type: 'integer',
        example: 1,
        description: 'Visitor ID',
      },
      entryGateId: {
        type: 'integer',
        example: 1,
        description: 'Gate ID',
      },
      unitId: {
        type: 'integer',
        nullable: true,
        example: 1,
        description: 'Unit ID (preferred over flatNo)',
      },
      flatNo: {
        type: 'string',
        nullable: true,
        example: 'A-101',
        description: 'Flat number (kept for backward compatibility, use unitId if available)',
      },
      purpose: {
        type: 'string',
        nullable: true,
        example: 'Delivery',
        description: 'Purpose of visit',
      },
      photoBase64: {
        type: 'string',
        nullable: true,
        example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
        description: 'Base64 data URI for the visitor photo (updates visitor record)',
      },
      preApprovalId: {
        type: 'integer',
        example: 1,
        description: 'Pre-approval ID (optional)',
      },
      entryTime: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-01T10:00:00.000Z',
        description: 'Entry time (defaults to current time if not provided)',
      },
    },
  },
  MarkExitRequest: {
    type: 'object',
    properties: {
      exitTime: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-01T12:00:00.000Z',
        description: 'Exit time (defaults to current time if not provided)',
      },
    },
  },
  VisitorLogResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Visitor entry logged successfully',
      },
      data: {
        type: 'object',
        properties: {
          visitorLog: {
            $ref: '#/components/schemas/VisitorLog',
          },
        },
      },
    },
  },
  VisitorLogsListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Visitor logs retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          visitorLogs: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/VisitorLog',
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
