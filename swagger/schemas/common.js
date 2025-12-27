export default {
  Error: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false,
      },
      message: {
        type: 'string',
        example: 'Error message',
      },
      errors: {
        type: 'array',
        items: {
          type: 'object',
        },
      },
    },
  },
  Success: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Success message',
      },
      data: {
        type: 'object',
      },
    },
  },
};

