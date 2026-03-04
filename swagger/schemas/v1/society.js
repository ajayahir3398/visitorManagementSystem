export default {
  Society: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      name: {
        type: 'string',
        example: 'Green Valley Apartments',
      },
      type: {
        type: 'string',
        enum: ['APARTMENT', 'OFFICE'],
        example: 'APARTMENT',
      },
      address: {
        type: 'string',
        nullable: true,
        example: '123 Main Street',
      },
      city: {
        type: 'string',
        nullable: true,
        example: 'Mumbai',
      },
      state: {
        type: 'string',
        nullable: true,
        example: 'Maharashtra',
      },
      pincode: {
        type: 'string',
        nullable: true,
        example: '400001',
      },
      razorpayKey: {
        type: 'string',
        nullable: true,
        description: 'Razorpay API key for society maintenance account',
        example: 'rzp_live_xxxxxxxxxxxxx',
      },
      subscriptionId: {
        type: 'integer',
        nullable: true,
        example: 1,
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'expired'],
        example: 'ACTIVE',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
      },
    },
  },
  CreateSocietyRequest: {
    type: 'object',
    required: ['name', 'type'],
    properties: {
      name: {
        type: 'string',
        example: 'Green Valley Apartments',
      },
      type: {
        type: 'string',
        enum: ['APARTMENT', 'OFFICE'],
        example: 'APARTMENT',
      },
      address: {
        type: 'string',
        nullable: true,
        example: '123 Main Street',
      },
      city: {
        type: 'string',
        nullable: true,
        example: 'Mumbai',
      },
      state: {
        type: 'string',
        nullable: true,
        example: 'Maharashtra',
      },
      pincode: {
        type: 'string',
        nullable: true,
        example: '400001',
      },
      razorpayKey: {
        type: 'string',
        nullable: true,
        description: 'Razorpay API key for society maintenance account',
        example: 'rzp_live_xxxxxxxxxxxxx',
      },
      subscriptionId: {
        type: 'integer',
        nullable: true,
        example: 1,
      },
    },
  },
  UpdateSocietyRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Green Valley Apartments',
      },
      type: {
        type: 'string',
        enum: ['APARTMENT', 'OFFICE'],
        example: 'APARTMENT',
      },
      address: {
        type: 'string',
        nullable: true,
        example: '123 Main Street',
      },
      city: {
        type: 'string',
        nullable: true,
        example: 'Mumbai',
      },
      state: {
        type: 'string',
        nullable: true,
        example: 'Maharashtra',
      },
      pincode: {
        type: 'string',
        nullable: true,
        example: '400001',
      },
      razorpayKey: {
        type: 'string',
        nullable: true,
        description: 'Razorpay API key for society maintenance account',
        example: 'rzp_live_xxxxxxxxxxxxx',
      },
      subscriptionId: {
        type: 'integer',
        nullable: true,
        example: 1,
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'expired'],
        example: 'ACTIVE',
      },
    },
  },
  SocietyResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Society retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          society: {
            $ref: '#/components/schemas/Society',
          },
        },
      },
    },
  },
  SocietiesListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Societies retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          societies: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Society',
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
};
