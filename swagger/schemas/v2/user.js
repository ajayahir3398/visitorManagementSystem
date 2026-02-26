export default {
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
      email: {
        type: 'string',
        example: 'john@example.com',
      },
      mobile: {
        type: 'string',
        example: '1234567890',
      },
      role: {
        type: 'string',
        enum: ['SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'],
        example: 'RESIDENT',
      },
      society_id: {
        type: 'integer',
        nullable: true,
        example: 1,
      },
      status: {
        type: 'string',
        enum: ['active', 'blocked'],
        example: 'active',
      },
      photoBase64: {
        type: 'string',
        description: 'Base64 encoded user photo',
        nullable: true,
      },
    },
  },
};
