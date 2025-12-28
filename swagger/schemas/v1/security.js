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
        example: 'apartment',
        enum: ['apartment', 'office'],
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
          photoUrl: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/photo.jpg',
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
          photoUrl: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/photo2.jpg',
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
        enum: ['pending', 'approved', 'rejected'],
        example: 'approved',
      },
    },
  },
  SecurityDashboardResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Security dashboard data retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          systemStatus: {
            type: 'string',
            enum: ['ACTIVE', 'GRACE', 'LOCKED'],
            example: 'ACTIVE',
            description: 'System status based on subscription',
          },
          systemStatusMessage: {
            type: 'string',
            nullable: true,
            example: null,
            description: 'Optional message shown when status is GRACE or LOCKED',
          },
          society: {
            $ref: '#/components/schemas/SecurityDashboardSociety',
          },
          gates: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SecurityDashboardGate',
            },
          },
          guard: {
            $ref: '#/components/schemas/SecurityDashboardGuard',
          },
          stats: {
            $ref: '#/components/schemas/SecurityDashboardStats',
          },
          pendingApprovals: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SecurityDashboardPendingApproval',
            },
            description: 'Top 10 pending approvals (most recent first)',
          },
          activeVisitors: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SecurityDashboardActiveVisitor',
            },
            description: 'Top 10 active visitors currently inside (most recent entry first)',
          },
        },
      },
    },
  },
};

