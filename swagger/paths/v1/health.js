export default {
  '/api/v1/health': {
    get: {
      summary: 'Health check endpoint',
      tags: ['v1 - Health'],
      responses: {
        200: {
          description: 'API is running',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'API running',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

