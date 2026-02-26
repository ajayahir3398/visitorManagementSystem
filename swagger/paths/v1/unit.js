export default {
  '/api/v1/units': {
    post: {
      summary: 'Create a new unit (flat/office)',
      tags: ['v1 - Units'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateUnitRequest',
            },
            example: {
              unitNo: 'A-302',
              societyId: 1,
              block: 'A',
              unitType: 'FLAT',
              status: 'ACTIVE',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Unit created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnitResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error or duplicate unit',
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
    get: {
      summary: 'Get all units',
      tags: ['v1 - Units'],
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
          name: 'societyId',
          in: 'query',
          schema: { type: 'integer' },
          description: 'Filter by society ID',
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE'],
          },
          description: 'Filter by status',
        },
        {
          name: 'unitType',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['FLAT', 'OFFICE', 'SHOP'],
          },
          description: 'Filter by unit type',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Search by unit number',
        },
      ],
      responses: {
        200: {
          description: 'Units retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnitsListResponse',
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
  '/api/v1/units/bulk-upload': {
    post: {
      summary: 'Bulk upload units via CSV',
      tags: ['v1 - Units'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                  description:
                    'CSV file containing units (columns: unit_no, unit_type, floor, block)',
                },
              },
              required: ['file'],
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Bulk upload completed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Bulk upload completed' },
                  data: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            unitNo: { type: 'string' },
                            unitType: { type: 'string' },
                            floor: { type: 'integer' },
                            block: { type: 'string' },
                          },
                        },
                      },
                      failed: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            unitNo: { type: 'string' },
                            reason: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error or invalid file',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - Only Society Admins',
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
  '/api/v1/units/{id}': {
    get: {
      summary: 'Get unit by ID',
      tags: ['v1 - Units'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Unit ID',
        },
      ],
      responses: {
        200: {
          description: 'Unit retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnitResponse',
              },
            },
          },
        },
        404: {
          description: 'Unit not found',
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
      summary: 'Update unit',
      tags: ['v1 - Units'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Unit ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateUnitRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Unit updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnitResponse',
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
          description: 'Unit not found',
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
      summary: 'Delete unit',
      tags: ['v1 - Units'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Unit ID',
        },
      ],
      responses: {
        200: {
          description: 'Unit deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Unit deleted successfully' },
                },
              },
            },
          },
        },
        400: {
          description: 'Cannot delete unit with members or visitor logs',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Unit not found',
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
  '/api/v1/units/{id}/members': {
    post: {
      summary: 'Add member to unit',
      description: 'Add a resident (user) to a unit. Can set as primary member.',
      tags: ['v1 - Units'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Unit ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AddUnitMemberRequest',
            },
            example: {
              userId: 5,
              role: 'OWNER',
              isPrimary: true,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Member added to unit successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Member added to unit successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      member: {
                        $ref: '#/components/schemas/UnitMember',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Validation error or user already a member',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Unit or user not found',
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
  '/api/v1/units/{id}/members/{memberId}': {
    delete: {
      summary: 'Remove member from unit',
      tags: ['v1 - Units'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Unit ID',
        },
        {
          name: 'memberId',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Member ID',
        },
      ],
      responses: {
        200: {
          description: 'Member removed from unit successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Member removed from unit successfully' },
                },
              },
            },
          },
        },
        404: {
          description: 'Member not found',
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
};
