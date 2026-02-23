export default {
  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD METRICS
  // ═══════════════════════════════════════════════════════════════

  '/api/v1/super-admin/dashboard/summary': {
    get: {
      summary: 'Get platform overview summary',
      description: 'Returns total/active/trial/locked societies, total users, and total visitors. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Dashboard summary retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminSummaryResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/dashboard/revenue': {
    get: {
      summary: 'Get revenue summary',
      description: 'Returns MRR, this month revenue, last month revenue, and total revenue. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Revenue summary retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminRevenueResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/dashboard/subscriptions': {
    get: {
      summary: 'Get subscription breakdown',
      description: 'Returns active/trial/grace/locked counts and subscriptions expiring within 7 days. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Subscription breakdown retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminSubscriptionResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/dashboard/users': {
    get: {
      summary: 'Get user counts by role',
      description: 'Returns counts of Society Admins, Security Guards, and Residents. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User counts retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminUsersResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/dashboard/visitors': {
    get: {
      summary: 'Get aggregated visitor volume',
      description: 'Returns visitor counts for today, this month, and last month. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Visitor volume retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminVisitorsResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/dashboard/notifications': {
    get: {
      summary: 'Get notification stats',
      description: 'Returns total notification count and breakdown by type. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Notification stats retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminNotificationsResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CHARTS
  // ═══════════════════════════════════════════════════════════════

  '/api/v1/super-admin/charts/society-status': {
    get: {
      summary: 'Society status distribution (Pie Chart)',
      description: 'Returns subscription status distribution for pie chart. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Charts'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Society status chart data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminStatusChartResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/charts/revenue': {
    get: {
      summary: 'Monthly revenue trend (Line Chart)',
      description: 'Returns month-wise revenue aggregation for the given year. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Charts'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'year',
          in: 'query',
          schema: { type: 'integer', default: 2025 },
          description: 'Year to filter (defaults to current year)',
        },
      ],
      responses: {
        200: {
          description: 'Monthly revenue chart data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminMonthlyChartResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/charts/visitors': {
    get: {
      summary: 'Visitor trend by month (Bar Chart)',
      description: 'Returns month-wise visitor count for the given year. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Charts'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'year',
          in: 'query',
          schema: { type: 'integer', default: 2025 },
          description: 'Year to filter (defaults to current year)',
        },
      ],
      responses: {
        200: {
          description: 'Visitor trend chart data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminVisitorTrendChartResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/charts/plan-distribution': {
    get: {
      summary: 'Plan distribution (Donut Chart)',
      description: 'Returns subscription count grouped by plan for donut chart. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Charts'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Plan distribution chart data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminPlanDistributionChartResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/charts/conversion': {
    get: {
      summary: 'Trial → Paid conversion (Funnel Chart)',
      description: 'Returns trial and paid subscription counts for conversion funnel. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Charts'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Conversion chart data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminConversionChartResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/charts/top-cities': {
    get: {
      summary: 'Top cities by society count (Bar Chart)',
      description: 'Returns top 10 cities with most societies. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Charts'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Top cities chart data retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminTopCitiesChartResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // QUICK ACTIONS
  // ═══════════════════════════════════════════════════════════════

  '/api/v1/super-admin/society/{id}/lock': {
    post: {
      summary: 'Lock a society',
      description: 'Locks a society by setting subscription to LOCKED and society status to expired. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Actions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Society ID',
        },
      ],
      responses: {
        200: {
          description: 'Society locked successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminActionResponse',
              },
              example: {
                success: true,
                message: 'Society "Green Valley" has been locked successfully',
                data: { societyId: 1, status: 'LOCKED' },
              },
            },
          },
        },
        400: {
          description: 'Invalid society ID',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        404: {
          description: 'Society not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/society/{id}/unlock': {
    post: {
      summary: 'Unlock a society',
      description: 'Unlocks a society by setting subscription to ACTIVE and society status to active. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Actions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Society ID',
        },
      ],
      responses: {
        200: {
          description: 'Society unlocked successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminActionResponse',
              },
              example: {
                success: true,
                message: 'Society "Green Valley" has been unlocked successfully',
                data: { societyId: 1, status: 'ACTIVE' },
              },
            },
          },
        },
        400: {
          description: 'Invalid society ID',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        404: {
          description: 'Society not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },

  '/api/v1/super-admin/society/{id}/extend-trial': {
    post: {
      summary: 'Extend trial period',
      description: 'Extends the subscription expiry by a specified number of days. Reactivates locked societies. SUPER_ADMIN only.',
      tags: ['v1 - Super Admin Actions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Society ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SuperAdminExtendTrialRequest',
            },
            example: {
              days: 7,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Trial extended successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuperAdminExtendTrialResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        404: {
          description: 'Society or subscription not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        401: {
          description: 'Unauthorized',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },
};
