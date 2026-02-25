export default {
  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD METRIC RESPONSES
  // ═══════════════════════════════════════════════════════════════

  SuperAdminSummaryResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Dashboard summary retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          totalSocieties: { type: 'integer', example: 128 },
          activeSocieties: { type: 'integer', example: 96 },
          trialSocieties: { type: 'integer', example: 18 },
          lockedSocieties: { type: 'integer', example: 14 },
          totalSocietyAdmins: { type: 'integer', example: 128 },
        },
      },
    },
  },

  SuperAdminRevenueResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Revenue summary retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          mrr: { type: 'number', example: 186500, description: 'Monthly Recurring Revenue' },
          thisMonth: { type: 'number', example: 45200 },
          lastMonth: { type: 'number', example: 39800 },
          totalRevenue: { type: 'number', example: 624300 },
        },
      },
    },
  },

  SuperAdminSubscriptionResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Subscription breakdown retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          active: { type: 'integer', example: 96 },
          trial: { type: 'integer', example: 18 },
          grace: { type: 'integer', example: 8 },
          locked: { type: 'integer', example: 14 },
          expiringIn7Days: { type: 'integer', example: 11 },
        },
      },
    },
  },


  SuperAdminNotificationsResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Notification stats retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 152340 },
          byType: {
            type: 'object',
            example: { VISITOR: 120000, EMERGENCY: 5340, SYSTEM: 27000 },
            description: 'Notification counts grouped by type',
          },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CHART RESPONSES
  // ═══════════════════════════════════════════════════════════════

  SuperAdminStatusChartResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Society status chart data retrieved successfully' },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'ACTIVE' },
            count: { type: 'integer', example: 96 },
          },
        },
        example: [
          { status: 'ACTIVE', count: 96 },
          { status: 'TRIAL', count: 18 },
          { status: 'GRACE', count: 8 },
          { status: 'LOCKED', count: 14 },
        ],
      },
    },
  },

  SuperAdminMonthlyChartResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Monthly revenue chart data retrieved successfully' },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            month: { type: 'string', example: 'Jan' },
            amount: { type: 'integer', example: 22000 },
          },
        },
        example: [
          { month: 'Jan', amount: 22000 },
          { month: 'Feb', amount: 31000 },
          { month: 'Mar', amount: 45200 },
        ],
      },
    },
  },

  SuperAdminPlanDistributionChartResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Plan distribution chart data retrieved successfully' },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            plan: { type: 'string', example: 'Monthly Plan' },
            count: { type: 'integer', example: 52 },
          },
        },
        example: [
          { plan: 'Trial Plan', count: 18 },
          { plan: 'Monthly Plan', count: 52 },
          { plan: 'Yearly Plan', count: 10 },
        ],
      },
    },
  },

  SuperAdminConversionChartResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Conversion chart data retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          trial: { type: 'integer', example: 18 },
          paid: { type: 'integer', example: 96 },
        },
      },
    },
  },

  SuperAdminTopCitiesChartResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Top cities chart data retrieved successfully' },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            city: { type: 'string', example: 'Ahmedabad' },
            count: { type: 'integer', example: 42 },
          },
        },
        example: [
          { city: 'Ahmedabad', count: 42 },
          { city: 'Surat', count: 31 },
          { city: 'Mumbai', count: 25 },
        ],
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // ACTION SCHEMAS
  // ═══════════════════════════════════════════════════════════════

  SuperAdminActionResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Society has been locked successfully' },
      data: {
        type: 'object',
        properties: {
          societyId: { type: 'integer', example: 1 },
          status: { type: 'string', example: 'LOCKED' },
        },
      },
    },
  },

  SuperAdminExtendSubscriptionRequest: {
    type: 'object',
    required: ['days'],
    properties: {
      days: {
        type: 'integer',
        minimum: 1,
        maximum: 365,
        example: 7,
        description: 'Number of days to extend the trial/subscription',
      },
    },
  },

  SuperAdminExtendSubscriptionResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Trial extended by 7 days successfully' },
      data: {
        type: 'object',
        properties: {
          societyId: { type: 'integer', example: 1 },
          subscriptionId: { type: 'integer', example: 5 },
          newExpiryDate: { type: 'string', format: 'date-time', example: '2025-04-15T00:00:00.000Z' },
          status: { type: 'string', example: 'TRIAL' },
        },
      },
    },
  },
};
