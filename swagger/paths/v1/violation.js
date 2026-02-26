export default {
  '/api/v1/violations': {
    get: {
      tags: ['v1 - Violations'],
      summary: 'Get all violations',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['PENDING', 'RESOLVED', 'DISMISSED', 'PAID'] },
        },
        {
          name: 'unitId',
          in: 'query',
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Violations retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ViolationsListResponse' },
            },
          },
        },
      },
    },
    post: {
      tags: ['v1 - Violations'],
      summary: 'Report a violation',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ReportViolationRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Violation reported successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ViolationResponse' },
            },
          },
        },
        400: { description: 'Validation error' },
      },
    },
  },
  '/api/v1/violations/{id}/status': {
    put: {
      tags: ['v1 - Violations'],
      summary: 'Update violation status',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateViolationStatusRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Status updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ViolationResponse' },
            },
          },
        },
        404: { description: 'Violation not found' },
      },
    },
  },
};
