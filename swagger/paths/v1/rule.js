export default {
    '/api/v1/rules': {
        get: {
            tags: ['v1 - Rules'],
            summary: 'Get all rules for the society',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'category',
                    in: 'query',
                    schema: { type: 'string' },
                    description: 'Filter by category',
                },
                {
                    name: 'isActive',
                    in: 'query',
                    schema: { type: 'boolean' },
                    description: 'Filter by status',
                },
            ],
            responses: {
                200: {
                    description: 'Rules retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            rules: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/Rule' },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        post: {
            tags: ['v1 - Rules'],
            summary: 'Create a new rule',
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                category: { type: 'string' },
                                priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                                violationPenalty: { type: 'string' },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Rule created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            rule: { $ref: '#/components/schemas/Rule' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { description: 'Access denied (SOCIETY_ADMIN only)' },
            },
        },
    },
    '/api/v1/rules/{id}': {
        get: {
            tags: ['v1 - Rules'],
            summary: 'Get rule by ID',
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
                    description: 'Rule retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            rule: { $ref: '#/components/schemas/Rule' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                404: { description: 'Rule not found' },
            },
        },
        put: {
            tags: ['v1 - Rules'],
            summary: 'Update rule',
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
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                category: { type: 'string' },
                                priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                                violationPenalty: { type: 'string' },
                                isActive: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Rule updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            rule: { $ref: '#/components/schemas/Rule' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                403: { description: 'Access denied (SOCIETY_ADMIN only)' },
                404: { description: 'Rule not found' },
            },
        },
        delete: {
            tags: ['v1 - Rules'],
            summary: 'Delete rule (Deactivate)',
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
                    description: 'Rule deactivated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                403: { description: 'Access denied (SOCIETY_ADMIN only)' },
                404: { description: 'Rule not found' },
            },
        },
    },
};
