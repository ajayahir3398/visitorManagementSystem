export default {
  '/api/v1/pre-approvals': {
    post: {
      summary: 'Create pre-approved guest',
      description:
        'Resident creates a pre-approval with a 6-digit access code. The unit is automatically identified from the token (primary unit or first available unit). Guest can use this code at the gate for instant entry.',
      tags: ['v1 - Pre-Approvals'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreatePreApprovalRequest',
            },
            example: {
              guestName: 'Rahul',
              guestMobile: '9876543210',
              photoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
              validFrom: '2024-01-20T08:00:00.000Z',
              validTill: '2024-01-20T22:00:00.000Z',
              maxUses: 1,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Pre-approval created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PreApprovalResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error or invalid dates',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - RESIDENT role only, or not a member of the unit',
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
      },
    },
    get: {
      summary: 'Get all pre-approvals for resident',
      description:
        'Get list of all pre-approvals created by the resident. Supports pagination and status filtering.',
      tags: ['v1 - Pre-Approvals'],
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
            enum: ['ACTIVE', 'EXPIRED', 'USED', 'REVOKED'],
          },
          description: 'Filter by status',
        },
      ],
      responses: {
        200: {
          description: 'Pre-approvals retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PreApprovalsListResponse',
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
          description: 'Forbidden - RESIDENT role only',
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
  '/api/v1/pre-approvals/{id}': {
    get: {
      summary: 'Get pre-approval by ID',
      description:
        'Get details of a specific pre-approval by ID. Resident can only view their own pre-approvals.',
      tags: ['v1 - Pre-Approvals'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Pre-approval ID',
        },
      ],
      responses: {
        200: {
          description: 'Pre-approval retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PreApprovalResponse',
              },
            },
          },
        },
        404: {
          description: 'Pre-approval not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - Can only view own pre-approvals',
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
  '/api/v1/pre-approvals/access-code/{code}': {
    get: {
      summary: 'Get pre-approval by access code',
      description:
        'Security guard retrieves details of a pre-approval using its 6-digit access code. Read-only — does not consume the code or create a visitor entry.',
      tags: ['v1 - Pre-Approvals'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'code',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: '6-digit access code (e.g., GV-123456)',
        },
      ],
      responses: {
        200: {
          description: 'Pre-approval details retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PreApprovalResponse',
              },
            },
          },
        },
        404: {
          description: 'Pre-approval not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description:
            'Forbidden - Code does not belong to your society, or if resident, not your code',
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
  '/api/v1/pre-approvals/{id}/revoke': {
    post: {
      summary: 'Revoke pre-approval',
      description:
        'Resident revokes a pre-approval, making the access code invalid. Cannot revoke already used or revoked codes.',
      tags: ['v1 - Pre-Approvals'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Pre-approval ID',
        },
      ],
      responses: {
        200: {
          description: 'Pre-approval revoked successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PreApprovalResponse',
              },
            },
          },
        },
        400: {
          description: 'Pre-approval already revoked or used',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Pre-approval not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Forbidden - Can only revoke own pre-approvals',
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
  '/api/v1/pre-approvals/verify': {
    post: {
      summary: 'Verify access code and create visitor entry',
      description:
        'Security guard verifies the 6-digit access code and creates an auto-approved visitor entry. Code must be active, within validity period, and not exceeded max uses.',
      tags: ['v1 - Pre-Approvals'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/VerifyPreApprovalRequest',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Access code verified and entry approved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/VerifyPreApprovalResponse',
              },
            },
          },
        },
        400: {
          description: 'Invalid code, expired, or already used',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Invalid access code or gate not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description:
            'Forbidden - SECURITY role only, or code/gate does not belong to your society',
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
};
