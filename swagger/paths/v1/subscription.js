export default {
  '/api/v1/subscriptions': {
    get: {
      summary: 'Get all subscriptions',
      tags: ['v1 - Subscriptions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          description: 'Page number',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
          description: 'Items per page',
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['TRIAL', 'ACTIVE', 'GRACE', 'LOCKED', 'SUSPENDED'],
          },
          description: 'Filter by status',
        },
        {
          name: 'societyId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by society ID',
        },
        {
          name: 'planId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by plan ID',
        },
      ],
      responses: {
        200: {
          description: 'Subscriptions retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SubscriptionsListResponse',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
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
  '/api/v1/subscriptions/society/{societyId}': {
    get: {
      summary: 'Get subscription for a society',
      tags: ['v1 - Subscriptions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'societyId',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Society ID',
        },
      ],
      responses: {
        200: {
          description: 'Subscription retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SubscriptionResponse',
              },
            },
          },
        },
        404: {
          description: 'Subscription not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden',
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
  '/api/v1/subscriptions/{id}/extend': {
    post: {
      summary: 'Extend subscription period by subscription ID',
      tags: ['v1 - Subscriptions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Subscription ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ExtendSubscriptionRequest',
            },
            example: {
              additionalDays: 30,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Subscription extended successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SubscriptionResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Subscription not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
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
  '/api/v1/subscriptions/society/{societyId}/extend': {
    post: {
      summary: 'Extend subscription period by society ID',
      description:
        'Extends the latest subscription for a society. Useful for extending trial periods.',
      tags: ['v1 - Subscriptions'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'societyId',
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
              $ref: '#/components/schemas/ExtendSubscriptionRequest',
            },
            example: {
              additionalDays: 30,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Subscription extended successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SubscriptionResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Subscription not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - SUPER_ADMIN only',
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
  '/api/v1/subscriptions/current': {
    get: {
      summary: 'Get current subscription for logged-in society',
      description:
        "Society Admin only. Get the current subscription details for the logged-in society admin's society.",
      tags: ['v1 - Subscriptions'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Current subscription retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SubscriptionResponse',
              },
              example: {
                success: true,
                message: 'Current subscription retrieved successfully',
                data: {
                  subscription: {
                    id: 1,
                    societyId: 1,
                    planId: 2,
                    status: 'ACTIVE',
                    startDate: '2024-01-01',
                    expiryDate: '2024-02-01',
                    graceDays: 3,
                    createdAt: '2024-01-01T00:00:00.000Z',
                    plan: {
                      id: 2,
                      code: 'MONTHLY',
                      name: 'Monthly Plan',
                      price: 800,
                      durationMonths: 1,
                      billingCycle: 'MONTHLY',
                    },
                    society: {
                      id: 1,
                      name: 'Green Valley Apartments',
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'User is not associated with a society',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'No subscription found for your society',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - SOCIETY_ADMIN only',
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
  '/api/v1/subscriptions/buy': {
    post: {
      summary: 'Buy/Activate a subscription plan',
      description:
        "Society Admin only. Purchase and activate a subscription plan for the logged-in society admin's society. This is the MVP version without payment gateway integration. Payment gateway (Razorpay) can be integrated later.",
      tags: ['v1 - Subscriptions'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BuySubscriptionRequest',
            },
            example: {
              planId: 2,
              paymentMode: 'UPI',
              transactionId: 'TXN-12345678',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Subscription activated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SubscriptionResponse',
              },
              example: {
                success: true,
                message: 'Subscription activated successfully',
                data: {
                  subscription: {
                    id: 1,
                    societyId: 1,
                    planId: 2,
                    status: 'ACTIVE',
                    startDate: '2024-01-01',
                    expiryDate: '2024-02-01',
                    graceDays: 3,
                    createdAt: '2024-01-01T00:00:00.000Z',
                    plan: {
                      id: 2,
                      code: 'MONTHLY',
                      name: 'Monthly Plan',
                      price: 800,
                      durationMonths: 1,
                      billingCycle: 'MONTHLY',
                    },
                    society: {
                      id: 1,
                      name: 'Green Valley Apartments',
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error or invalid plan',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              examples: {
                invalidPlanId: {
                  value: {
                    success: false,
                    message: 'planId is required',
                  },
                },
                planNotActive: {
                  value: {
                    success: false,
                    message: 'This plan is not available for purchase',
                  },
                },
                noSociety: {
                  value: {
                    success: false,
                    message: 'User is not associated with a society',
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Plan not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        401: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - SOCIETY_ADMIN only',
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
