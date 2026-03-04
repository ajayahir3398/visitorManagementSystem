export default {
  '/api/v1/security/dashboard/overview': {
    get: {
      summary: 'Get dashboard summary statistics',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Dashboard overview statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/SecurityDashboardStats' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/security/dashboard/pending-approvals': {
    get: {
      summary: 'Get list of visitors waiting for approval',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of pending approvals',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      notices: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SecurityDashboardPendingApproval' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/security/dashboard/inside-visitors': {
    get: {
      summary: 'Get list of visitors currently inside',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of inside visitors',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      visitors: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SecurityDashboardActiveVisitor' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/security/dashboard/recent-activity': {
    get: {
      summary: 'Get latest security activity logs',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Latest activity logs',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/SecurityDashboardActivity' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/security/dashboard/emergency': {
    get: {
      summary: 'Get active emergency status',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Emergency status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/SecurityDashboardEmergency' },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/security/verify-guest-code': {
    post: {
      summary: 'Verify pre-approved guest access code',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['code', 'gateId'],
              properties: {
                code: { type: 'string', example: 'GV-123456' },
                gateId: { type: 'integer', example: 1 },
                visitorId: { type: 'integer', example: null, nullable: true },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Code verified and entry approved',
        },
      },
    },
  },
  '/api/v1/security/visitor-entry': {
    post: {
      summary: 'Register a new visitor entry request',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['gateId'],
              properties: {
                visitorId: {
                  type: 'integer',
                  description: 'Required if name and mobile are not provided',
                },
                name: { type: 'string', description: 'Required if visitorId is not provided' },
                mobile: { type: 'string', description: 'Required if visitorId is not provided' },
                gateId: { type: 'integer' },
                unitId: { type: 'integer' },
                purpose: { type: 'string' },
                photoBase64: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Entry requested',
        },
      },
    },
  },
  '/api/v1/security/visitor-exit': {
    post: {
      summary: 'Mark a visitor as exited',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['visitorLogId'],
              properties: {
                visitorLogId: { type: 'integer' },
                exitTime: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Visitor marked as exited',
        },
      },
    },
  },
  '/api/v1/security/emergency': {
    post: {
      summary: 'Raise a new emergency alert',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['emergencyType', 'notificationType'],
              properties: {
                emergencyType: { type: 'string', example: 'MEDICAL' },
                notificationType: { type: 'string', example: 'PANIC_ALARM' },
                description: { type: 'string' },
                location: { type: 'string' },
                unitId: { type: 'integer' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Emergency raised',
        },
      },
    },
  },
};
