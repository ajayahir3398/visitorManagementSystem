export default {
    '/api/v1/maintenance/custom-bill': {
        post: {
            tags: ['v1 - Maintenance'],
            summary: 'Create custom maintenance bill',
            description: 'Society Admin can create an ad-hoc bill for a unit.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateCustomBillRequest' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Custom bill created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Custom maintenance bill created successfully' },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            tempBill: { $ref: '#/components/schemas/TempMaintenanceBill' }
                                        }
                                    }
                                }
                            },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                500: { $ref: '#/components/responses/InternalServer' },
            },
        },
    },
    '/api/v1/maintenance/upcoming': {
        get: {
            tags: ['v1 - Maintenance'],
            summary: 'Get upcoming maintenance (Temp bills)',
            description: 'Retrieve temporary maintenance bills generated for the resident units.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Upcoming bills retrieved',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpcomingMaintenanceResponse' },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                500: { $ref: '#/components/responses/InternalServer' },
            },
        },
    },
    '/api/v1/maintenance/pay': {
        post: {
            tags: ['v1 - Maintenance'],
            summary: 'Pay maintenance and finalize bill',
            description: 'Resident payment for an upcoming temporary maintenance bill. Converts temp bill to final bill.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/PayMaintenanceRequest' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Maintenance paid successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/PayMaintenanceResponse' },
                        },
                    },
                },
                400: { $ref: '#/components/responses/BadRequest' },
                401: { $ref: '#/components/responses/Unauthorized' },
                403: { $ref: '#/components/responses/Forbidden' },
                404: { $ref: '#/components/responses/NotFound' },
                500: { $ref: '#/components/responses/InternalServer' },
            },
        },
    },
    '/api/v1/maintenance/my-bills': {
        get: {
            tags: ['v1 - Maintenance'],
            summary: 'Get current user maintenance bills',
            description: 'Retrieve history of maintenance bills for the units associated with the logged-in resident.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'page',
                    in: 'query',
                    schema: { type: 'integer', default: 1 },
                    description: 'Page number',
                },
                {
                    name: 'limit',
                    in: 'query',
                    schema: { type: 'integer', default: 10 },
                    description: 'Number of items per page',
                },
                {
                    name: 'status',
                    in: 'query',
                    schema: { type: 'string', enum: ['UNPAID', 'PAID', 'OVERDUE'] },
                    description: 'Filter by bill status',
                },
            ],
            responses: {
                200: {
                    description: 'Bills retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MyBillsResponse' },
                        },
                    },
                },
                401: { $ref: '#/components/responses/Unauthorized' },
                500: { $ref: '#/components/responses/InternalServer' },
            },
        },
    },
};
