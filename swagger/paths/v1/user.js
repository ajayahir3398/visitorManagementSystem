export default {
  '/api/v1/users': {
    post: {
      summary: 'Create a new user (Society Admin)',
      tags: ['v1 - Users'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateUserRequest',
            },
            example: {
              name: 'John Doe',
              email: 'john@example.com',
              mobile: '1234567890',
              password: 'password123',
              societyId: 1,
              roleId: 2,
              status: 'ACTIVE',
              photoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error or duplicate user',
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
    get: {
      summary: 'Get all users',
      tags: ['v1 - Users'],
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
          schema: { type: 'string', enum: ['ACTIVE', 'BLOCKED'] },
          description: 'Filter by status',
        },
        {
          name: 'roleId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by role ID',
        },
        {
          name: 'societyId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by society ID',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search by name, email, or mobile',
        },
      ],
      responses: {
        200: {
          description: 'Users retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UsersListResponse',
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
  },
  '/api/v1/users/{id}': {
    get: {
      summary: 'Get user by ID',
      tags: ['v1 - Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'User ID',
        },
      ],
      responses: {
        200: {
          description: 'User retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserResponse',
              },
            },
          },
        },
        404: {
          description: 'User not found',
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
    put: {
      summary: 'Update user',
      tags: ['v1 - Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'User ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateUserRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'User updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserResponse',
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
          description: 'User not found',
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
    delete: {
      summary: 'Delete user',
      tags: ['v1 - Users'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'User ID',
        },
      ],
      responses: {
        200: {
          description: 'User deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'User deleted successfully' },
                },
              },
            },
          },
        },
        403: {
          description: 'Cannot delete SUPER_ADMIN',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'User not found',
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
      },
    },
  },
  '/api/v1/users/bulk-upload-residents': {
    post: {
      summary: 'Bulk create resident users',
      tags: ['v1 - Users'],
      description:
        'Upload a CSV file to create residents and assign them to units. Columns required -> unit_no, name, mobile. Optional -> block, email, role.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Bulk upload completed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BulkUploadResponse',
              },
            },
          },
        },
        400: {
          description: 'Bad request or no file',
        },
        403: {
          description: 'Access denied (only SOCIETY_ADMIN)',
        },
        500: {
          description: 'Server error',
        },
      },
    },
  },
};
