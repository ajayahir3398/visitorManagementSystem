export default {
    '/api/v1/maintenance-plans': {
        get: {
            tags: ['v1 - Maintenance Plans'],
            summary: 'Get all maintenance plans for the society',
            description: 'Retrieves all maintenance plans (MONTHLY/YEARLY) for the authenticated user\'s society. Accessible by SOCIETY_ADMIN and RESIDENT.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'isActive',
                    in: 'query',
                    schema: { type: 'boolean' },
                    description: 'Filter by active status',
                },
            ],
            responses: {
                200: {
                    description: 'Maintenance plans retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MaintenancePlansListResponse' },
                        },
                    },
                },
                400: { description: 'User not associated with a society' },
                401: { description: 'Unauthorized' },
            },
        },
        post: {
            tags: ['v1 - Maintenance Plans'],
            summary: 'Create a new maintenance plan',
            description: 'Creates a new maintenance plan (MONTHLY or YEARLY) for the society. Only one plan per type per society is allowed.',
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
                201: {
                    description: 'Maintenance plan created successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MaintenancePlanResponse' },
                        },
                    },
                },
                400: { description: 'Validation error or user not associated with a society' },
                403: { description: 'Access denied (SOCIETY_ADMIN only)' },
                409: { description: 'Plan of this type already exists' },
            },
        },
    },
    '/api/v1/maintenance-plans/{id}': {
        get: {
            tags: ['v1 - Maintenance Plans'],
            summary: 'Get maintenance plan by ID',
            description: 'Retrieves a specific maintenance plan by its ID.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'integer' },
                    description: 'Maintenance plan ID',
                },
            ],
            responses: {
                200: {
                    description: 'Maintenance plan retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MaintenancePlanResponse' },
                        },
                    },
                },
                400: { description: 'Invalid plan ID' },
                401: { description: 'Unauthorized' },
                404: { description: 'Maintenance plan not found' },
            },
        },
        put: {
            tags: ['v1 - Maintenance Plans'],
            summary: 'Update maintenance plan',
            description: 'Updates an existing maintenance plan. Can update amount and/or active status.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'integer' },
                    description: 'Maintenance plan ID',
                },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/UpdateMaintenancePlanRequest' },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Maintenance plan updated successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/MaintenancePlanResponse' },
                        },
                    },
                },
                400: { description: 'Validation error or invalid plan ID' },
                403: { description: 'Access denied (SOCIETY_ADMIN only)' },
                404: { description: 'Maintenance plan not found' },
            },
        },
        delete: {
            tags: ['v1 - Maintenance Plans'],
            summary: 'Delete (deactivate) maintenance plan',
            description: 'Soft deletes a maintenance plan by setting isActive to false.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'integer' },
                    description: 'Maintenance plan ID',
                },
            ],
            responses: {
                200: {
                    description: 'Maintenance plan deactivated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    message: { type: 'string', example: 'Maintenance plan deactivated successfully' },
                                },
                            },
                        },
                    },
                },
                400: { description: 'Invalid plan ID' },
                403: { description: 'Access denied (SOCIETY_ADMIN only)' },
                404: { description: 'Maintenance plan not found' },
            },
        },
    },
};
