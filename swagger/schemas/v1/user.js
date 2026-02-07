export default {
  BulkUploadResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Bulk upload processing completed' },
      data: {
        type: 'object',
        properties: {
          success: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                unitNo: { type: 'string' },
                name: { type: 'string' },
                mobile: { type: 'string' },
                status: { type: 'string' },
              },
            },
          },
          failed: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                row: { type: 'object' },
                error: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  CreateUserRequest: {
    type: 'object',
    required: ['name', 'roleId', 'societyId'],
    properties: {
      name: { type: 'string', example: 'John Doe' },
      email: { type: 'string', format: 'email', example: 'john@example.com' },
      mobile: { type: 'string', example: '1234567890' },
      password: { type: 'string', example: 'password123' },
      societyId: { type: 'integer', example: 1 },
      roleId: { type: 'integer', example: 2 },
      status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
      photoBase64: { type: 'string', description: 'Base64 encoded user photo', nullable: true },
    },
  },
  UpdateUserRequest: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      mobile: { type: 'string' },
      password: { type: 'string' },
      status: { type: 'string', enum: ['active', 'inactive', 'blocked'] },
      roleId: { type: 'integer' },
      photoBase64: { type: 'string', description: 'Base64 encoded user photo', nullable: true },
    },
  },
  UserResponse: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'John Doe' },
      email: { type: 'string', example: 'john@example.com' },
      mobile: { type: 'string', example: '1234567890' },
      photoBase64: { type: 'string', description: 'Base64 encoded user photo', nullable: true },
      societyId: { type: 'integer', example: 1 },
      roleId: { type: 'integer', example: 2 },
      status: { type: 'string', example: 'active' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      role: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          name: { type: 'string', example: 'SOCIETY_ADMIN' },
        },
      },
    },
  },
  UsersListResponse: {
    type: 'object',
    properties: {
      users: {
        type: 'array',
        items: { $ref: '#/components/schemas/UserResponse' },
      },
      pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          page: { type: 'integer' },
          limit: { type: 'integer' },
          pages: { type: 'integer' },
        },
      },
    },
  },
};
