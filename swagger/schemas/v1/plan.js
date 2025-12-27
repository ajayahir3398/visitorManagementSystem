export default {
  SubscriptionPlan: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
        description: 'Plan ID',
      },
      code: {
        type: 'string',
        example: 'MONTHLY',
        description: 'Unique plan code (MONTHLY, YEARLY, TRIAL)',
      },
      name: {
        type: 'string',
        example: 'Monthly Plan',
        description: 'Plan name',
      },
      price: {
        type: 'integer',
        example: 800,
        description: 'Price in smallest unit (₹800 → 800)',
      },
      durationMonths: {
        type: 'integer',
        example: 1,
        description: 'Duration in months',
      },
      billingCycle: {
        type: 'string',
        enum: ['MONTHLY', 'YEARLY'],
        example: 'MONTHLY',
        description: 'Billing cycle',
      },
      visitorLimit: {
        type: 'integer',
        nullable: true,
        example: null,
        description: 'Visitor limit (null = unlimited)',
      },
      features: {
        type: 'object',
        nullable: true,
        example: {
          unlimited_visitors: true,
        },
        description: 'Plan features (JSON object)',
      },
      isActive: {
        type: 'boolean',
        example: true,
        description: 'Whether the plan is active',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
        description: 'Plan creation timestamp',
      },
      _count: {
        type: 'object',
        properties: {
          subscriptions: {
            type: 'integer',
            example: 10,
            description: 'Number of active subscriptions using this plan',
          },
        },
        description: 'Count of related subscriptions (only in getAllPlans)',
      },
    },
  },
  CreatePlanRequest: {
    type: 'object',
    required: ['code', 'name', 'price', 'durationMonths', 'billingCycle'],
    properties: {
      code: {
        type: 'string',
        minLength: 1,
        maxLength: 20,
        example: 'QUARTERLY',
        description: 'Unique plan code (must be unique)',
      },
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        example: 'Quarterly Plan',
        description: 'Plan name',
      },
      price: {
        type: 'integer',
        minimum: 0,
        example: 2200,
        description: 'Price in smallest unit (non-negative integer)',
      },
      durationMonths: {
        type: 'integer',
        minimum: 1,
        example: 3,
        description: 'Duration in months (must be >= 1)',
      },
      billingCycle: {
        type: 'string',
        enum: ['MONTHLY', 'YEARLY'],
        example: 'MONTHLY',
        description: 'Billing cycle',
      },
      visitorLimit: {
        type: 'integer',
        nullable: true,
        minimum: 1,
        example: null,
        description: 'Visitor limit (null = unlimited, must be >= 1 if provided)',
      },
      features: {
        type: 'object',
        nullable: true,
        example: {
          unlimited_visitors: true,
          premium_support: true,
        },
        description: 'Plan features (JSON object)',
      },
      isActive: {
        type: 'boolean',
        example: true,
        description: 'Whether the plan is active (default: true)',
      },
    },
  },
  UpdatePlanRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 50,
        example: 'Updated Monthly Plan',
        description: 'Plan name',
      },
      price: {
        type: 'integer',
        minimum: 0,
        example: 900,
        description: 'Price in smallest unit',
      },
      durationMonths: {
        type: 'integer',
        minimum: 1,
        example: 1,
        description: 'Duration in months',
      },
      billingCycle: {
        type: 'string',
        enum: ['MONTHLY', 'YEARLY'],
        example: 'MONTHLY',
        description: 'Billing cycle',
      },
      visitorLimit: {
        type: 'integer',
        nullable: true,
        minimum: 1,
        example: null,
        description: 'Visitor limit (null = unlimited)',
      },
      features: {
        type: 'object',
        nullable: true,
        example: {
          unlimited_visitors: true,
        },
        description: 'Plan features (JSON object)',
      },
      isActive: {
        type: 'boolean',
        example: true,
        description: 'Whether the plan is active',
      },
    },
    description: 'All fields are optional. Only provided fields will be updated.',
  },
  PlanResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Plan retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          plan: {
            $ref: '#/components/schemas/SubscriptionPlan',
          },
        },
      },
    },
  },
  PlansListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Plans retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          plans: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SubscriptionPlan',
            },
          },
        },
      },
    },
  },
  AllPlansResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'All plans retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          plans: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/SubscriptionPlan',
            },
            description: 'All plans including inactive ones, with subscription counts',
          },
        },
      },
    },
  },
};

