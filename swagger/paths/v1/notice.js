export default {
  '/api/v1/notices': {
    get: {
      tags: ['v1 - Notices'],
      summary: 'Get all active notices',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'noticeType',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by type',
        },
        {
          name: 'priority',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by priority',
        },
        {
          name: 'isRead',
          in: 'query',
          schema: { type: 'boolean' },
          description: 'Filter by read status (true/false)',
        },
      ],
      responses: {
        200: {
          description: 'Notices retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NoticesListResponse' },
            },
          },
        },
      },
    },
    post: {
      tags: ['v1 - Notices'],
      summary: 'Create a new notice',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateNoticeRequest' },
          },
        },
      },
      responses: {
        201: {
          description: 'Notice created successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NoticeResponse' },
            },
          },
        },
        403: { description: 'Access denied (SOCIETY_ADMIN only)' },
      },
    },
  },
  '/api/v1/notices/{id}': {
    get: {
      tags: ['v1 - Notices'],
      summary: 'Get notice by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Notice retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NoticeResponse' },
            },
          },
        },
        404: { description: 'Notice not found' },
      },
    },
    put: {
      tags: ['v1 - Notices'],
      summary: 'Update notice',
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
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateNoticeRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Notice updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NoticeResponse' },
            },
          },
        },
        403: { description: 'Access denied' },
        404: { description: 'Notice not found' },
      },
    },
    delete: {
      tags: ['v1 - Notices'],
      summary: 'Deactivate notice',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Notice deactivated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NoticeResponse' },
            },
          },
        },
        403: { description: 'Access denied' },
      },
    },
  },
  '/api/v1/notices/{id}/read': {
    post: {
      tags: ['v1 - Notices'],
      summary: 'Mark notice as read',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Notice marked as read',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Notice marked as read' },
                },
              },
            },
          },
        },
        500: { description: 'Server error' },
      },
    },
  },
};
