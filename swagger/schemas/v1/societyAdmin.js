export default {
  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD RESPONSE SCHEMAS
  // ═══════════════════════════════════════════════════════════════

  SocietyOverviewResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Dashboard overview retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          totalUnits: { type: 'integer', example: 120 },
          totalResidents: { type: 'integer', example: 340 },
          activeSecurity: { type: 'integer', example: 8 },
          openEmergencies: { type: 'integer', example: 1 },
          pendingViolations: { type: 'integer', example: 3 },
        },
      },
    },
  },

  SocietyMaintenanceResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Maintenance summary retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          upcomingBills: { type: 'integer', example: 120 },
          unpaidBills: { type: 'integer', example: 34 },
          overdueBills: { type: 'integer', example: 12 },
          collectedThisMonth: { type: 'integer', example: 145000 },
          overdueAmount: { type: 'integer', example: 32000 },
        },
      },
    },
  },

  SocietyVisitorsResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Visitor summary retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          todayVisitors: { type: 'integer', example: 48 },
          pendingApprovals: { type: 'integer', example: 3 },
          insidePremises: { type: 'integer', example: 21 },
          preApprovedToday: { type: 'integer', example: 12 },
        },
      },
    },
  },

  SocietyEmergenciesResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Emergency summary retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          openEmergencies: { type: 'integer', example: 1 },
          resolvedThisMonth: { type: 'integer', example: 5 },
          avgResponseMinutes: { type: 'integer', example: 6 },
        },
      },
    },
  },

  SocietyNoticesResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Notice summary retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          activeNotices: { type: 'integer', example: 4 },
          totalReads: { type: 'integer', example: 280 },
          recentNotice: {
            type: 'object',
            nullable: true,
            properties: {
              title: { type: 'string', example: 'Water supply maintenance' },
              createdAt: { type: 'string', format: 'date-time' },
              noticeType: { type: 'string', example: 'Maintenance' },
            },
          },
          activeRules: { type: 'integer', example: 12 },
        },
      },
    },
  },

  SocietyActivityResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Recent activity retrieved successfully' },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 512 },
            action: { type: 'string', example: 'MAINTENANCE_BILL_GENERATED' },
            entity: { type: 'string', example: 'MAINTENANCE_BILL' },
            description: { type: 'string', example: 'Maintenance bill generated for April 2025' },
            createdAt: { type: 'string', format: 'date-time' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer', example: 5 },
                name: { type: 'string', example: 'Ajay Ahir' },
              },
            },
          },
        },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // CHART RESPONSE SCHEMAS
  // ═══════════════════════════════════════════════════════════════

  SocietyMaintenanceCollectionChartResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: {
        type: 'string',
        example: 'Maintenance collection chart data retrieved successfully',
      },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            month: { type: 'string', example: 'Jan' },
            month_num: { type: 'integer', example: 1 },
            total: { type: 'integer', example: 145000 },
          },
        },
        example: [
          { month: 'Oct', month_num: 10, total: 120000 },
          { month: 'Nov', month_num: 11, total: 135000 },
          { month: 'Dec', month_num: 12, total: 128000 },
          { month: 'Jan', month_num: 1, total: 145000 },
          { month: 'Feb', month_num: 2, total: 152000 },
        ],
      },
    },
  },

  SocietyVisitorTrendChartResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Visitor trend chart data retrieved successfully' },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            day: { type: 'string', example: 'Mon 17 Feb' },
            date: { type: 'string', format: 'date' },
            count: { type: 'integer', example: 48 },
          },
        },
        example: [
          { day: 'Mon 17 Feb', date: '2025-02-17', count: 48 },
          { day: 'Tue 18 Feb', date: '2025-02-18', count: 52 },
          { day: 'Wed 19 Feb', date: '2025-02-19', count: 41 },
        ],
      },
    },
  },

  SocietyEmergencyTypesChartResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Emergency types chart data retrieved successfully' },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', example: 'Medical' },
            count: { type: 'integer', example: 8 },
          },
        },
        example: [
          { type: 'Medical', count: 8 },
          { type: 'Fire', count: 2 },
          { type: 'Security', count: 5 },
          { type: 'Theft', count: 1 },
        ],
      },
    },
  },

  SocietyMaintenanceStatusChartResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Maintenance status chart data retrieved successfully' },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'PAID' },
            count: { type: 'integer', example: 86 },
          },
        },
        example: [
          { status: 'PAID', count: 86 },
          { status: 'UNPAID', count: 22 },
          { status: 'OVERDUE', count: 12 },
        ],
      },
    },
  },
};
