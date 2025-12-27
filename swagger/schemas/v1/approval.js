export default {
  Approval: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      visitorLogId: {
        type: 'integer',
        example: 1,
      },
      residentId: {
        type: 'integer',
        example: 5,
      },
      decision: {
        type: 'string',
        enum: ['approved', 'rejected'],
        example: 'approved',
      },
      decisionTime: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T10:00:00.000Z',
      },
      resident: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          name: { type: 'string', example: 'John Doe' },
          mobile: { type: 'string', example: '1234567890' },
        },
      },
    },
  },
  ApprovalResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Visitor entry approved successfully',
      },
      data: {
        type: 'object',
        properties: {
          visitorLog: {
            $ref: '#/components/schemas/VisitorLog',
          },
          approval: {
            $ref: '#/components/schemas/Approval',
          },
        },
      },
    },
  },
  PendingApprovalsResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Pending approvals retrieved successfully',
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
              total: { type: 'integer', example: 5 },
              pages: { type: 'integer', example: 1 },
            },
          },
        },
      },
    },
  },
};

