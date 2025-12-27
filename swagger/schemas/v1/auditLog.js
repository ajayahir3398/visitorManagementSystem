export default {
  AuditLog: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      userId: {
        type: 'integer',
        nullable: true,
        example: 5,
        description: 'ID of the user who performed the action',
      },
      userName: {
        type: 'string',
        nullable: true,
        example: 'John Doe',
        description: 'Name of the user who performed the action',
      },
      userMobile: {
        type: 'string',
        nullable: true,
        example: '1234567890',
        description: 'Mobile number of the user who performed the action',
      },
      societyId: {
        type: 'integer',
        nullable: true,
        example: 1,
        description: 'ID of the society (if applicable)',
      },
      societyName: {
        type: 'string',
        nullable: true,
        example: 'Green Valley Apartments',
        description: 'Name of the society (if applicable)',
      },
      role: {
        type: 'string',
        nullable: true,
        example: 'SOCIETY_ADMIN',
        description: 'Role of the user who performed the action',
      },
      action: {
        type: 'string',
        example: 'VISITOR_ENTRY',
        description: 'Action performed (e.g., LOGIN, VISITOR_ENTRY, PRE_APPROVAL_CREATED)',
      },
      entity: {
        type: 'string',
        example: 'VisitorLog',
        description: 'Entity type affected by the action',
      },
      entityId: {
        type: 'integer',
        nullable: true,
        example: 123,
        description: 'ID of the affected entity',
      },
      description: {
        type: 'string',
        nullable: true,
        example: 'Visitor entry created for unit A-101',
        description: 'Human-readable description of the action',
      },
      ipAddress: {
        type: 'string',
        nullable: true,
        example: '192.168.1.1',
        description: 'IP address from which the action was performed',
      },
      userAgent: {
        type: 'string',
        nullable: true,
        example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        description: 'User agent string from the request',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T10:00:00.000Z',
        description: 'Timestamp when the action was performed',
      },
    },
  },
  AuditLogsResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Audit logs retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          logs: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/AuditLog',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                example: 1,
              },
              limit: {
                type: 'integer',
                example: 50,
              },
              total: {
                type: 'integer',
                example: 150,
              },
              totalPages: {
                type: 'integer',
                example: 3,
              },
            },
          },
        },
      },
    },
  },
  AuditLogResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Audit log retrieved successfully',
      },
      data: {
        $ref: '#/components/schemas/AuditLog',
      },
    },
  },
  AuditLogStatsResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Audit log statistics retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          totalLogs: {
            type: 'integer',
            example: 1500,
            description: 'Total number of audit logs',
          },
          topActions: {
            type: 'array',
            description: 'Top 10 most frequent actions',
            items: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  example: 'LOGIN',
                },
                count: {
                  type: 'integer',
                  example: 450,
                },
              },
            },
          },
          roleDistribution: {
            type: 'array',
            description: 'Distribution of actions by role',
            items: {
              type: 'object',
              properties: {
                role: {
                  type: 'string',
                  example: 'SOCIETY_ADMIN',
                },
                count: {
                  type: 'integer',
                  example: 300,
                },
              },
            },
          },
          topEntities: {
            type: 'array',
            description: 'Top 10 most affected entities',
            items: {
              type: 'object',
              properties: {
                entity: {
                  type: 'string',
                  example: 'VisitorLog',
                },
                count: {
                  type: 'integer',
                  example: 250,
                },
              },
            },
          },
        },
      },
    },
  },
};


