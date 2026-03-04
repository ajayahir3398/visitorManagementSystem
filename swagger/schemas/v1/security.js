export default {
  SecurityDashboardStats: {
    type: 'object',
    properties: {
      todayVisitors: {
        type: 'integer',
        example: 42,
        description: 'Total number of visitors logged today',
      },
      pendingApprovals: {
        type: 'integer',
        example: 3,
        description: 'Number of visitors waiting for resident approval',
      },
      insidePremises: {
        type: 'integer',
        example: 18,
        description: 'Number of visitors currently inside the premises',
      },
    },
  },
  SecurityDashboardSociety: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      name: {
        type: 'string',
        example: 'Green Valley Apartments',
      },
      type: {
        type: 'string',
        example: 'APARTMENT',
        enum: ['APARTMENT', 'OFFICE'],
      },
      address: {
        type: 'string',
        nullable: true,
        example: '123 Main Street',
      },
      city: {
        type: 'string',
        nullable: true,
        example: 'Mumbai',
      },
      state: {
        type: 'string',
        nullable: true,
        example: 'Maharashtra',
      },
    },
  },
  SecurityDashboardGate: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      name: {
        type: 'string',
        example: 'Main Gate',
      },
    },
  },
  SecurityDashboardGuard: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 5,
      },
      name: {
        type: 'string',
        example: 'Security Guard Name',
      },
    },
  },
  SecurityDashboardPendingApproval: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      visitor: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Rahul',
          },
          mobile: {
            type: 'string',
            example: '9876543210',
          },
          photoBase64: {
            type: 'string',
            nullable: true,
            example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
          },
        },
      },
      unit: {
        type: 'object',
        nullable: true,
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          unitNo: {
            type: 'string',
            example: 'A-302',
          },
          unitType: {
            type: 'string',
            example: 'FLAT',
          },
        },
      },
      gate: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Main Gate',
          },
        },
      },
      waitTime: {
        type: 'integer',
        example: 15,
        description: 'Waiting time in minutes',
      },
      waitTimeBadge: {
        type: 'string',
        example: '15m ago',
        description: 'Human-readable waiting time badge',
      },
      purpose: {
        type: 'string',
        nullable: true,
        example: 'Delivery',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T10:00:00.000Z',
      },
    },
  },
  SecurityDashboardActiveVisitor: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 2,
      },
      visitor: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 2,
          },
          name: {
            type: 'string',
            example: 'Ramesh',
          },
          mobile: {
            type: 'string',
            example: '9876543211',
          },
          photoBase64: {
            type: 'string',
            nullable: true,
            example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
          },
        },
      },
      unit: {
        type: 'object',
        nullable: true,
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          unitNo: {
            type: 'string',
            example: 'A-201',
          },
          unitType: {
            type: 'string',
            example: 'FLAT',
          },
        },
      },
      gate: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'Main Gate',
          },
        },
      },
      entryTime: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-01T11:00:00.000Z',
      },
      status: {
        type: 'string',
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        example: 'APPROVED',
      },
    },
  },
  SecurityDashboardActivity: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      action: { type: 'string', example: 'Visitor entered' },
      subject: { type: 'string', example: 'Rahul' },
      target: { type: 'string', example: 'A-302' },
      time: { type: 'string', format: 'date-time' },
      type: { type: 'string', example: 'APPROVED' },
    },
  },
  SecurityDashboardEmergency: {
    type: 'object',
    properties: {
      active: { type: 'boolean', example: true },
      id: { type: 'integer', example: 1, nullable: true },
      type: { type: 'string', example: 'MEDICAL', nullable: true },
      location: { type: 'string', example: 'B-205', nullable: true },
      raisedBy: { type: 'string', example: 'Amit Shah', nullable: true },
      time: { type: 'string', format: 'date-time', nullable: true },
      status: { type: 'string', example: 'OPEN', nullable: true },
    },
  },
};
