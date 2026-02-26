export default {
  '/api/v2/health': {
    get: {
      summary: 'Health check endpoint',
      tags: ['v2 - Health'],
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
