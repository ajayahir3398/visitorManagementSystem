export default {
  '/api/v1/security/dashboard': {
    get: {
      summary: 'Get security dashboard data',
      description: 'Retrieve comprehensive dashboard data for security guards including system status, society info, gates, statistics, pending approvals, and active visitors.',
      tags: ['v1 - Security'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Security dashboard data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SecurityDashboardResponse',
              },
              example: {
                success: true,
                message: 'Security dashboard data retrieved successfully',
                data: {
                  systemStatus: 'ACTIVE',
                  systemStatusMessage: null,
                  society: {
                    id: 1,
                    name: 'Green Valley Apartments',
                    type: 'apartment',
                    address: '123 Main Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                  },
                  gates: [
                    {
                      id: 1,
                      name: 'Main Gate',
                    },
                    {
                      id: 2,
                      name: 'Back Gate',
                    },
                  ],
                  guard: {
                    id: 5,
                    name: 'Security Guard Name',
                  },
                  stats: {
                    todayVisitors: 42,
                    pendingApprovals: 3,
                    insidePremises: 18,
                  },
                  pendingApprovals: [
                    {
                      id: 1,
                      visitor: {
                        id: 1,
                        name: 'Rahul',
                        mobile: '9876543210',
                        photoBase64: null,
                      },
                      unit: {
                        id: 1,
                        unitNo: 'A-302',
                        unitType: 'FLAT',
                      },
                      gate: {
                        id: 1,
                        name: 'Main Gate',
                      },
                      waitTime: 15,
                      waitTimeBadge: '15m ago',
                      purpose: 'Delivery',
                      createdAt: '2024-01-01T10:00:00.000Z',
                    },
                  ],
                  activeVisitors: [
                    {
                      id: 2,
                      visitor: {
                        id: 2,
                        name: 'Ramesh',
                        mobile: '9876543211',
                        photoBase64: null,
                      },
                      unit: {
                        id: 2,
                        unitNo: 'A-201',
                        unitType: 'FLAT',
                      },
                      gate: {
                        id: 1,
                        name: 'Main Gate',
                      },
                      entryTime: '2024-01-01T11:00:00.000Z',
                      status: 'approved',
                    },
                  ],
                },
              },
            },
          },
        },
        401: {
          description: 'Unauthorized - No token provided or invalid token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - SECURITY role required, or security guard must be associated with a society',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                message: 'Security guard must be associated with a society',
              },
            },
          },
        },
        404: {
          description: 'Society not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        500: {
          description: 'Internal server error',
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

