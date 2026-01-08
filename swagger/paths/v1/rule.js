export default {
    '/api/v1/rules': {
        get: {
            tags: ['v1 - Rules'],
            summary: 'Get all rules for the society',
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
                { name: 'isActive', in: 'query', schema: { type: 'boolean' }, description: 'Filter by status' },
            ],
            responses: {
                200: {
                    description: 'Rules retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RulesListResponse' },
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
                        schema: { $ref: '#/components/schemas/CreateRuleRequest' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Rule created successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RuleResponse' },
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
                { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            ],
            responses: {
                200: {
                    description: 'Rule retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RuleResponse' },
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
                { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/UpdateRuleRequest' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Rule updated successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RuleResponse' },
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
                { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            ],
            responses: {
                200: {
                    description: 'Rule deactivated successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/RuleResponse' },
                        },
                    },
                },
                403: { description: 'Access denied (SOCIETY_ADMIN only)' },
                404: { description: 'Rule not found' },
            },
        },
    },
};
