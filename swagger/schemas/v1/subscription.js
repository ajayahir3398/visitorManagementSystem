export default {
  Subscription: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      societyId: {
        type: 'integer',
        example: 1,
      },
      planId: {
        type: 'integer',
        example: 1,
      },
      status: {
        type: 'string',
        enum: ['TRIAL', 'ACTIVE', 'GRACE', 'LOCKED', 'SUSPENDED'],
        example: 'TRIAL',
      },
      startDate: {
        type: 'string',
        format: 'date',
        example: '2024-01-01',
      },
      expiryDate: {
        type: 'string',
        format: 'date',
        nullable: true,
        example: '2024-03-01',
      },
      graceDays: {
        type: 'integer',
        example: 3,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
      },
      plan: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          code: { type: 'string', example: 'MONTHLY' },
          name: { type: 'string', example: 'Monthly Plan' },
          price: { type: 'integer', example: 800 },
          durationMonths: { type: 'integer', example: 1 },
          billingCycle: { type: 'string', example: 'MONTHLY' },
        },
      },
      society: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Green Valley Apartments' },
        },
      },
    },
  },
  ExtendSubscriptionRequest: {
    type: 'object',
    required: ['additionalDays'],
    properties: {
      additionalDays: {
        type: 'integer',
        minimum: 1,
        example: 30,
        description: 'Number of days to extend the subscription',
      },
    },
  },
  SubscriptionResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Subscription retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          subscription: {
            $ref: '#/components/schemas/Subscription',
          },
        },
      },
    },
  },
  SubscriptionsListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Subscriptions retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          subscriptions: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Subscription',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 50 },
              pages: { type: 'integer', example: 5 },
            },
          },
        },
      },
    },
  },
  BuySubscriptionRequest: {
    type: 'object',
    required: ['planId'],
    properties: {
      planId: {
        type: 'integer',
        minimum: 1,
        example: 2,
        description: 'ID of the subscription plan to purchase',
      },
    },
  },
};

