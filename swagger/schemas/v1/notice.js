export default {
  Notice: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      societyId: { type: 'integer', example: 1 },
      title: { type: 'string', example: 'Water Tank Cleaning' },
      description: { type: 'string', example: 'Water supply will be interrupted...' },
      noticeType: {
        type: 'string',
        enum: ['General', 'Maintenance', 'Emergency', 'Event'],
        example: 'Maintenance',
      },
      priority: { type: 'string', enum: ['High', 'Medium', 'Low'], example: 'High' },
      audience: {
        type: 'string',
        enum: ['All', 'Residents', 'Owners', 'Tenants', 'Security'],
        example: 'Residents',
      },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      photoBase64: { type: 'string' },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  CreateNoticeRequest: {
    type: 'object',
    properties: {
      title: { type: 'string', example: 'Water Tank Cleaning' },
      description: {
        type: 'string',
        example: 'Water supply will be interrupted due to tank cleaning.',
      },
      noticeType: {
        type: 'string',
        enum: ['General', 'Maintenance', 'Emergency', 'Event'],
        example: 'Maintenance',
      },
      priority: { type: 'string', enum: ['High', 'Medium', 'Low'], example: 'High' },
      audience: {
        type: 'string',
        enum: ['All', 'Residents', 'Owners', 'Tenants', 'Security'],
        example: 'Residents',
      },
      startDate: { type: 'string', format: 'date-time', example: '2024-03-01T10:00:00.000Z' },
      endDate: { type: 'string', format: 'date-time', example: '2024-03-01T18:00:00.000Z' },
      photoBase64: { type: 'string', example: 'data:image/jpeg;base64,/9j/4AAQ...' },
    },
    required: ['title', 'noticeType', 'audience', 'startDate', 'endDate'],
  },
  UpdateNoticeRequest: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      noticeType: { type: 'string', enum: ['General', 'Maintenance', 'Emergency', 'Event'] },
      priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
      audience: { type: 'string', enum: ['All', 'Residents', 'Owners', 'Tenants', 'Security'] },
      startDate: { type: 'string', format: 'date-time' },
      endDate: { type: 'string', format: 'date-time' },
      photoBase64: { type: 'string' },
      isActive: { type: 'boolean' },
    },
  },
  NoticeResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Notice processed successfully' },
      data: {
        type: 'object',
        properties: {
          notice: { $ref: '#/components/schemas/Notice' },
        },
      },
    },
  },
  NoticesListResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Notices retrieved successfully' },
      data: {
        type: 'object',
        properties: {
          notices: {
            type: 'array',
            items: { $ref: '#/components/schemas/Notice' },
          },
        },
      },
    },
  },
};
