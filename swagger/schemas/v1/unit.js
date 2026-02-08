export default {
  Unit: {
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
      unitNo: {
        type: 'string',
        example: 'A-302',
      },
      unitType: {
        type: 'string',
        nullable: true,
        example: 'FLAT',
        enum: ['FLAT', 'OFFICE', 'SHOP'],
      },
      floor: {
        type: 'integer',
        nullable: true,
        example: 3,
      },
      block: {
        type: 'string',
        example: 'B',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE'],
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
      society: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Green Valley Apartments' },
          type: { type: 'string', example: 'apartment' },
        },
      },
    },
  },
  UnitMember: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      unitId: {
        type: 'integer',
        example: 1,
      },
      userId: {
        type: 'integer',
        example: 5,
      },
      role: {
        type: 'string',
        enum: ['OWNER', 'TENANT', 'EMPLOYEE'],
        example: 'OWNER',
      },
      isPrimary: {
        type: 'boolean',
        example: true,
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-01T00:00:00.000Z',
      },
      user: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          name: { type: 'string', example: 'John Doe' },
          mobile: { type: 'string', example: '1234567890' },
          email: { type: 'string', nullable: true },
        },
      },
      unit: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          unitNo: { type: 'string', example: 'A-302' },
        },
      },
    },
  },
  CreateUnitRequest: {
    type: 'object',
    required: ['unitNo', 'societyId', 'block'],
    properties: {
      unitNo: {
        type: 'string',
        example: 'A-302',
        description: 'Unit number (e.g., A-302, 201, HR-01)',
      },
      societyId: {
        type: 'integer',
        example: 1,
        description: 'Society ID',
      },
      unitType: {
        type: 'string',
        enum: ['FLAT', 'OFFICE', 'SHOP'],
        nullable: true,
        example: 'FLAT',
      },
      floor: {
        type: 'integer',
        nullable: true,
        example: 3,
        description: 'Floor number',
      },
      block: {
        type: 'string',
        example: 'B',
        description: 'Block identifier',
        maxLength: 20,
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE',
        example: 'ACTIVE',
      },
    },
  },
  UpdateUnitRequest: {
    type: 'object',
    properties: {
      unitNo: {
        type: 'string',
        example: 'A-302',
      },
      unitType: {
        type: 'string',
        enum: ['FLAT', 'OFFICE', 'SHOP'],
        nullable: true,
      },
      floor: {
        type: 'integer',
        nullable: true,
      },
      block: {
        type: 'string',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE'],
      },
    },
  },
  AddUnitMemberRequest: {
    type: 'object',
    required: ['userId', 'role'],
    properties: {
      userId: {
        type: 'integer',
        example: 5,
        description: 'User ID (must be a resident)',
      },
      role: {
        type: 'string',
        enum: ['OWNER', 'TENANT', 'EMPLOYEE'],
        example: 'OWNER',
      },
      isPrimary: {
        type: 'boolean',
        default: false,
        example: true,
        description: 'Set as primary member (only one primary per unit)',
      },
    },
  },
  UnitResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Unit retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          unit: {
            $ref: '#/components/schemas/Unit',
          },
        },
      },
    },
  },
  UnitsListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Units retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          units: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Unit',
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

