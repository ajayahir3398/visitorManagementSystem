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
      description: 'Extends the latest subscription for a society. Useful for extending trial periods.',
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
};

