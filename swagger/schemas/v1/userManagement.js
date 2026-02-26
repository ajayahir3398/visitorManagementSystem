export default {
  CreateUserRequest: {
    type: 'object',
    required: ['name', 'mobile'],
    properties: {
      name: {
        type: 'string',
        example: 'John Doe',
      },
      email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'john@example.com',
      },
      mobile: {
        type: 'string',
        pattern: '^[0-9]{10}$',
        example: '1234567890',
      },
      password: {
        type: 'string',
        format: 'password',
        nullable: true,
        example: 'password123',
        description: 'Required for admin users',
      },
      societyId: {
        type: 'integer',
        nullable: true,
        example: 1,
      },
      roleId: {
        type: 'integer',
        nullable: true,
        example: 2,
        description: 'Default: SOCIETY_ADMIN if not provided',
      },
      status: {
        type: 'string',
        enum: ['active', 'blocked'],
        default: 'active',
        example: 'active',
      },
    },
  },
  UpdateUserRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'John Doe',
      },
      email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'john@example.com',
      },
      mobile: {
        type: 'string',
        pattern: '^[0-9]{10}$',
        example: '1234567890',
      },
      password: {
        type: 'string',
        format: 'password',
        nullable: true,
        example: 'newpassword123',
      },
      societyId: {
        type: 'integer',
        nullable: true,
        example: 1,
      },
      roleId: {
        type: 'integer',
        nullable: true,
        example: 2,
      },
      status: {
        type: 'string',
        enum: ['active', 'blocked'],
        example: 'active',
      },
    },
  },
  UserDetail: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
      email: {
        type: 'string',
        nullable: true,
        example: 'john@example.com',
      },
      mobile: {
        type: 'string',
        example: '1234567890',
      },
      roleId: {
        type: 'integer',
        example: 2,
      },
      role: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          name: { type: 'string', example: 'SOCIETY_ADMIN' },
        },
      },
      societyId: {
        type: 'integer',
        nullable: true,
        example: 1,
      },
      society: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Green Valley Apartments' },
          type: { type: 'string', example: 'apartment' },
        },
      },
      status: {
        type: 'string',
        enum: ['active', 'blocked'],
        example: 'active',
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
  UserResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'User retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/UserDetail',
          },
        },
      },
    },
  },
  UsersListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Users retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserDetail',
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
