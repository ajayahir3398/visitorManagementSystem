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
            ],
            responses: {
                200: {
                    description: 'Notices retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
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
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                noticeType: { type: 'string' },
                                priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
                                audience: { type: 'string', enum: ['All', 'Owners', 'Tenants', 'Security'] },
                                startDate: { type: 'string', format: 'date-time' },
                                endDate: { type: 'string', format: 'date-time' },
                                attachmentUrl: { type: 'string' },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Notice created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            notice: { $ref: '#/components/schemas/Notice' },
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
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            notice: { $ref: '#/components/schemas/Notice' },
                                        },
                                    },
                                },
                            },
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
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                title: { type: 'string' },
                                description: { type: 'string' },
                                noticeType: { type: 'string' },
                                priority: { type: 'string' },
                                audience: { type: 'string' },
                                startDate: { type: 'string', format: 'date-time' },
                                endDate: { type: 'string', format: 'date-time' },
                                attachmentUrl: { type: 'string' },
                                isActive: { type: 'boolean' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Notice updated successfully' },
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
                200: { description: 'Notice deactivated successfully' },
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
                200: { description: 'Notice marked as read' },
                500: { description: 'Server error' },
            },
        },
    },
};
