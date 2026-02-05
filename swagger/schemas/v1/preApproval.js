export default {
  PreApprovedGuest: {
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
      unitId: {
        type: 'integer',
        example: 5,
      },
      residentId: {
        type: 'integer',
        example: 10,
      },
      guestName: {
        type: 'string',
        nullable: true,
        example: 'Rahul',
      },
      guestMobile: {
        type: 'string',
        nullable: true,
        example: '9876543210',
      },
      photoBase64: {
        type: 'string',
        nullable: true,
        example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
        description: 'Base64 data URI for the guest photo (optional)',
      },
      accessCode: {
        type: 'string',
        example: 'GV-483921',
        description: '6-digit access code in format GV-XXXXXX',
      },
      validFrom: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-20T08:00:00.000Z',
      },
      validTill: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-20T22:00:00.000Z',
      },
      maxUses: {
        type: 'integer',
        example: 1,
        description: 'Maximum number of times this code can be used',
      },
      usedCount: {
        type: 'integer',
        example: 0,
        description: 'Number of times this code has been used',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'EXPIRED', 'USED', 'REVOKED'],
        example: 'ACTIVE',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-20T07:00:00.000Z',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-20T07:00:00.000Z',
      },
      unit: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 5 },
          unitNo: { type: 'string', example: 'A-101' },
          unitType: { type: 'string', example: '2BHK' },
        },
      },
      resident: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 10 },
          name: { type: 'string', example: 'John Doe' },
          mobile: { type: 'string', example: '1234567890' },
        },
      },
    },
  },
  CreatePreApprovalRequest: {
    type: 'object',
    required: ['validFrom', 'validTill'],
    description: 'The unit is automatically identified from the logged-in resident\'s profile (primary unit or first available unit).',
    properties: {
      guestName: {
        type: 'string',
        nullable: true,
        example: 'Rahul',
        description: 'Name of the guest (optional)',
      },
      guestMobile: {
        type: 'string',
        nullable: true,
        example: '9876543210',
        description: 'Mobile number of the guest (optional)',
      },
      photoBase64: {
        type: 'string',
        nullable: true,
        example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
        description: 'Base64 data URI for the guest photo (optional)',
      },
      validFrom: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-20T08:00:00.000Z',
        description: 'Code becomes valid from this time',
      },
      validTill: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-20T22:00:00.000Z',
        description: 'Code expires at this time',
      },
      maxUses: {
        type: 'integer',
        default: 1,
        minimum: 1,
        example: 1,
        description: 'Maximum number of times this code can be used',
      },
    },
  },
  PreApprovalResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Pre-approval created successfully',
      },
      data: {
        type: 'object',
        properties: {
          preApproval: {
            $ref: '#/components/schemas/PreApprovedGuest',
          },
        },
      },
    },
  },
  PreApprovalsListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Pre-approvals retrieved successfully',
      },
      data: {
        type: 'object',
        properties: {
          preApprovals: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/PreApprovedGuest',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 10 },
              total: { type: 'integer', example: 5 },
              pages: { type: 'integer', example: 1 },
            },
          },
        },
      },
    },
  },
  VerifyPreApprovalRequest: {
    type: 'object',
    required: ['accessCode', 'gateId'],
    properties: {
      accessCode: {
        type: 'string',
        example: 'GV-483921',
        description: '6-digit access code provided by guest',
      },
      gateId: {
        type: 'integer',
        example: 1,
        description: 'Gate ID where guest is entering',
      },
      visitorId: {
        type: 'integer',
        nullable: true,
        example: 1,
        description: 'Optional: Visitor ID if guest already exists in system',
      },
    },
  },
  VerifyPreApprovalResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Access code verified and entry approved successfully',
      },
      data: {
        type: 'object',
        properties: {
          visitorLog: {
            $ref: '#/components/schemas/VisitorLog',
          },
          preApproval: {
            $ref: '#/components/schemas/PreApprovedGuest',
          },
          unit: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 5 },
              unitNo: { type: 'string', example: 'A-101' },
              unitType: { type: 'string', example: '2BHK' },
            },
          },
        },
      },
    },
  },
};


