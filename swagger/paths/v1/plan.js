export default {
  '/api/v1/plans': {
    get: {
      summary: 'Get all available subscription plans',
      description:
        'Public endpoint to retrieve all active subscription plans. No authentication required.',
      tags: ['v1 - Plans'],
      responses: {
        200: {
          description: 'Plans retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PlansListResponse',
              },
              example: {
                success: true,
                message: 'Plans retrieved successfully',
                data: {
                  plans: [
                    {
                      id: 1,
                      code: 'TRIAL',
                      name: 'Trial Plan',
                      price: 0,
                      durationMonths: 0,
                      billingCycle: 'MONTHLY',
                      visitorLimit: null,
                      features: {
                        trial: true,
                        duration_days: 60,
                        unlimited_visitors: true,
                      },
                    },
                    {
                      id: 2,
                      code: 'MONTHLY',
                      name: 'Monthly Plan',
                      price: 800,
                      durationMonths: 1,
                      billingCycle: 'MONTHLY',
                      visitorLimit: null,
                      features: {
                        unlimited_visitors: true,
                      },
                    },
                    {
                      id: 3,
                      code: 'YEARLY',
                      name: 'Yearly Plan',
                      price: 8000,
                      durationMonths: 12,
                      billingCycle: 'YEARLY',
                      visitorLimit: null,
                      features: {
                        unlimited_visitors: true,
                      },
                    },
                  ],
                },
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
    post: {
      summary: 'Create a new subscription plan',
      description:
        'Super Admin only. Create a new subscription plan with code, name, price, duration, and billing cycle.',
      tags: ['v1 - Plans'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreatePlanRequest',
            },
            example: {
              code: 'QUARTERLY',
              name: 'Quarterly Plan',
              price: 2200,
              durationMonths: 3,
              billingCycle: 'MONTHLY',
              visitorLimit: null,
              features: {
                unlimited_visitors: true,
              },
              isActive: true,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Plan created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PlanResponse',
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
        409: {
          description: 'Plan with this code already exists',
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
  '/api/v1/plans/{id}': {
    get: {
      summary: 'Get plan by ID',
      description: 'Public endpoint to retrieve a specific subscription plan by ID.',
      tags: ['v1 - Plans'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Plan ID',
        },
      ],
      responses: {
        200: {
          description: 'Plan retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PlanResponse',
              },
            },
          },
        },
        400: {
          description: 'Invalid plan ID',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
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
      },
    },
    put: {
      summary: 'Update a subscription plan',
      description: 'Super Admin only. Update an existing subscription plan.',
      tags: ['v1 - Plans'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Plan ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdatePlanRequest',
            },
            example: {
              name: 'Updated Monthly Plan',
              price: 900,
              isActive: true,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Plan updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PlanResponse',
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
      },
    },
    delete: {
      summary: 'Delete a subscription plan',
      description:
        'Super Admin only. Delete a subscription plan. Cannot delete plans that are currently in use.',
      tags: ['v1 - Plans'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Plan ID',
        },
      ],
      responses: {
        200: {
          description: 'Plan deleted successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PlanResponse',
              },
            },
          },
        },
        400: {
          description: 'Invalid plan ID or Plan in use',
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
      },
    },
  },
  '/api/v1/plans/{id}/toggle': {
    post: {
      summary: 'Toggle plan status (Enable/Disable)',
      description: 'Super Admin only. Enable or disable a subscription plan.',
      tags: ['v1 - Plans'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Plan ID',
        },
      ],
      responses: {
        200: {
          description: 'Plan status toggled successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PlanResponse',
              },
            },
          },
        },
        400: {
          description: 'Invalid plan ID',
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
      },
    },
  },
  '/api/v1/plans/all': {
    get: {
      summary: 'Get all plans (including inactive)',
      description: 'Super Admin only. Retrieve all subscription plans including inactive ones.',
      tags: ['v1 - Plans'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'All plans retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AllPlansResponse',
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
