export default {
  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD METRICS
  // ═══════════════════════════════════════════════════════════════

  '/api/v1/admin/dashboard/overview': {
    get: {
      summary: 'Get society overview (KPI cards)',
      description: 'Returns total units, residents, security staff, open emergencies, and pending violations for the logged-in admin\'s society.',
      tags: ['v1 - Society Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Dashboard overview retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyOverviewResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },

  '/api/v1/admin/dashboard/maintenance': {
    get: {
      summary: 'Get maintenance & financial overview',
      description: 'Returns upcoming bills, unpaid bills, overdue bills, collected this month, and overdue amount.',
      tags: ['v1 - Society Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Maintenance summary retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyMaintenanceResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },

  '/api/v1/admin/dashboard/visitors': {
    get: {
      summary: 'Get visitor activity summary',
      description: 'Returns today\'s visitors, pending approvals, visitors inside premises, and pre-approved guests.',
      tags: ['v1 - Society Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Visitor summary retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyVisitorsResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },

  '/api/v1/admin/dashboard/emergencies': {
    get: {
      summary: 'Get emergency snapshot',
      description: 'Returns open emergencies, resolved this month, and average response time in minutes.',
      tags: ['v1 - Society Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Emergency summary retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyEmergenciesResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },

  '/api/v1/admin/dashboard/notices': {
    get: {
      summary: 'Get notices & rules summary',
      description: 'Returns active notices, total reads, recent notice, and active rules count.',
      tags: ['v1 - Society Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Notice summary retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyNoticesResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },

  '/api/v1/admin/dashboard/activity': {
    get: {
      summary: 'Get recent activity feed',
      description: 'Returns the last 10 audit log entries for this society with user info.',
      tags: ['v1 - Society Admin Dashboard'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Recent activity retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyActivityResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CHARTS
  // ═══════════════════════════════════════════════════════════════

  '/api/v1/admin/charts/maintenance-collection': {
    get: {
      summary: 'Maintenance collection trend (Line chart)',
      description: 'Returns monthly collection totals for the last 6 months.',
      tags: ['v1 - Society Admin Charts'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Maintenance collection chart data retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyMaintenanceCollectionChartResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },

  '/api/v1/admin/charts/visitor-trend': {
    get: {
      summary: 'Daily visitor trend (Bar chart)',
      description: 'Returns daily visitor counts for the last 7 days.',
      tags: ['v1 - Society Admin Charts'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Visitor trend chart data retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyVisitorTrendChartResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },

  '/api/v1/admin/charts/emergency-types': {
    get: {
      summary: 'Emergency type distribution (Pie chart)',
      description: 'Returns emergency counts grouped by type.',
      tags: ['v1 - Society Admin Charts'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Emergency types chart data retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyEmergencyTypesChartResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },

  '/api/v1/admin/charts/maintenance-status': {
    get: {
      summary: 'Maintenance bill status (Donut chart)',
      description: 'Returns bill counts grouped by status (UNPAID/PAID/OVERDUE).',
      tags: ['v1 - Society Admin Charts'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Maintenance status chart data retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SocietyMaintenanceStatusChartResponse' },
            },
          },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        403: { description: 'Forbidden - SOCIETY_ADMIN only', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
      },
    },
  },
};
