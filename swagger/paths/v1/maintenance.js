export default {
    '/api/v1/maintenance/plans': {
        post: {
            summary: 'Create or Update Maintenance Plan',
            tags: ['v1 - Maintenance'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateMaintenancePlanRequest' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Plan updated successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/StandardResponse' },
                        },
                    },
                },
                400: { description: 'Validation error' },
                401: { description: 'Unauthorized' },
                403: { description: 'Forbidden - Only Society Admin' },
            },
        },
        get: {
            summary: 'Get Maintenance Plans',
            tags: ['v1 - Maintenance'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Plans retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MaintenancePlansListResponse' },
                        },
                    },
                },
                401: { description: 'Unauthorized' },
            },
        },
    },
    '/api/v1/maintenance/bills/generate': {
        post: {
            summary: 'Generate Bulk Bills for units',
            tags: ['v1 - Maintenance'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/GenerateBulkBillRequest' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Bills generated successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/StandardResponse' },
                        },
                    },
                },
                400: { description: 'Validation error or plan not found' },
                403: { description: 'Forbidden' },
            },
        },
    },
    '/api/v1/maintenance/bills/single': {
        post: {
            summary: 'Generate a single maintenance bill',
            tags: ['v1 - Maintenance'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/GenerateSingleBillRequest' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Bill created successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MaintenanceBillResponse' },
                        },
                    },
                },
                400: { description: 'Validation error' },
                403: { description: 'Forbidden (Locked society)' },
                404: { description: 'Unit not found' },
                409: { description: 'Bill already exists for this unit and period' },
            },
        },
    },
    '/api/v1/maintenance/bills/admin': {
        get: {
            summary: 'Get all bills (Admin view)',
            tags: ['v1 - Maintenance'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'status', in: 'query', schema: { type: 'string', enum: ['UNPAID', 'PAID', 'OVERDUE'] } },
                { name: 'unitId', in: 'query', schema: { type: 'integer' } },
                { name: 'billCycle', in: 'query', schema: { type: 'string' } },
                { name: 'period', in: 'query', schema: { type: 'string' } },
                { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            ],
            responses: {
                200: {
                    description: 'Bills retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MaintenanceBillsListResponse' },
                        },
                    },
                },
                403: { description: 'Forbidden' },
            },
        },
    },
    '/api/v1/maintenance/bills/my': {
        get: {
            summary: 'Get my unit bills (Resident view)',
            tags: ['v1 - Maintenance'],
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Bills retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MaintenanceBillsListResponse' },
                        },
                    },
                },
                401: { description: 'Unauthorized' },
            },
        },
    },
    '/api/v1/maintenance/bills/{id}/pay': {
        post: {
            summary: 'Pay a maintenance bill',
            tags: ['v1 - Maintenance'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/PayBillRequest' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Payment recorded successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/StandardResponse' },
                        },
                    },
                },
                400: { description: 'Invalid bill or already paid' },
                403: { description: 'Access denied' },
            },
        },
    },
};
