export default {
  '/api/v1/approvals/pending': {
    get: {
      summary: 'Get pending approvals for resident',
      description: 'Get list of pending visitor entries waiting for approval from resident\'s units',
      tags: ['v1 - Approvals'],
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
      ],
      responses: {
        200: {
          description: 'Pending approvals retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PendingApprovalsResponse',
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
  '/api/v1/approvals/visitor-logs/{id}/approve': {
    post: {
      summary: 'Approve visitor entry',
      description: 'Resident approves a pending visitor entry. Updates visitor log status to "approved" and creates/updates approval record.',
      tags: ['v1 - Approvals'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Visitor log ID',
        },
      ],
      responses: {
        200: {
          description: 'Visitor entry approved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApprovalResponse',
              },
            },
          },
        },
        400: {
          description: 'Visitor already approved/rejected or exited',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Visitor log not found',
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
          description: 'Forbidden - RESIDENT role only, or not a member of the unit',
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
  '/api/v1/approvals/visitor-logs/{id}/reject': {
    post: {
      summary: 'Reject visitor entry',
      description: 'Resident rejects a pending visitor entry. Updates visitor log status to "rejected" and creates/updates approval record.',
      tags: ['v1 - Approvals'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
          description: 'Visitor log ID',
        },
      ],
      responses: {
        200: {
          description: 'Visitor entry rejected successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApprovalResponse',
              },
            },
          },
        },
        400: {
          description: 'Visitor already approved/rejected or exited',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Visitor log not found',
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
          description: 'Forbidden - RESIDENT role only, or not a member of the unit',
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

