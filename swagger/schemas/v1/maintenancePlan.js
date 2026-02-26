export default {
  // Maintenance Plan Schema
  MaintenancePlan: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      societyId: { type: 'integer', example: 5 },
      planType: { type: 'string', enum: ['MONTHLY', 'YEARLY'], example: 'MONTHLY' },
      amount: { type: 'integer', description: 'Amount in ₹', example: 2500 },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  // Request Schemas
  CreateMaintenancePlanRequest: {
    type: 'object',
    required: ['planType', 'amount'],
    properties: {
      planType: {
        type: 'string',
        enum: ['MONTHLY', 'YEARLY'],
        description: 'Type of maintenance plan',
        example: 'MONTHLY',
      },
      amount: {
        type: 'integer',
        minimum: 1,
        description: 'Amount in ₹',
        example: 2500,
      },
    },
  },

  UpdateMaintenancePlanRequest: {
    type: 'object',
    properties: {
      amount: {
        type: 'integer',
        minimum: 1,
        description: 'Amount in ₹',
        example: 3000,
      },
      isActive: {
        type: 'boolean',
        description: 'Active status',
        example: true,
      },
    },
  },

  // Response Schemas
  MaintenancePlanResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Maintenance plan created successfully' },
      data: {
        type: 'object',
        properties: {
          plan: { $ref: '#/components/schemas/MaintenancePlan' },
        },
      },
    },
  },

  MaintenancePlansListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Maintenance plans retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          plans: {
            type: 'array',
            items: { $ref: '#/components/schemas/MaintenancePlan' },
          },
        },
      },
    },
  },
};
