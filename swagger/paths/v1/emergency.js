export default {
    '/api/v1/emergencies': {
        post: {
            summary: 'Raise an Emergency',
            tags: ['v1 - Emergency'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/CreateEmergencyRequest' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Emergency raised successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SingleEmergencyResponse' },
                        },
                    },
                },
                400: { description: 'Validation error' },
                401: { description: 'Unauthorized' },
            },
        },
        get: {
            summary: 'Get Emergencies',
            tags: ['v1 - Emergency'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'status', in: 'query', schema: { type: 'string', enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'] } },
                { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
                { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
            ],
            responses: {
                200: {
                    description: 'Emergencies retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/EmergenciesListResponse' },
                        },
                    },
                },
                401: { description: 'Unauthorized' },
            },
        },
    },
    '/api/v1/emergencies/{id}': {
        get: {
            summary: 'Get Emergency Timeline/Detail',
            tags: ['v1 - Emergency'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            ],
            responses: {
                200: {
                    description: 'Emergency details retrieved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SingleEmergencyResponse' },
                        },
                    },
                },
                403: { description: 'Forbidden' },
                404: { description: 'Not found' },
            },
        },
    },
    '/api/v1/emergencies/{id}/acknowledge': {
        post: {
            summary: 'Acknowledge an Emergency',
            tags: ['v1 - Emergency'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            ],
            responses: {
                200: {
                    description: 'Emergency acknowledged successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SingleEmergencyResponse' },
                        },
                    },
                },
                400: { description: 'Invalid status' },
                403: { description: 'Forbidden' },
                404: { description: 'Not found' },
            },
        },
    },
    '/api/v1/emergencies/{id}/respond': {
        post: {
            summary: 'Add an Emergency Response Action',
            tags: ['v1 - Emergency'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/AddEmergencyResponseRequest' },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Response action logged successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SingleEmergencyResponse' },
                        },
                    },
                },
                400: { description: 'Validation error' },
                403: { description: 'Forbidden' },
            },
        },
    },
    '/api/v1/emergencies/{id}/resolve': {
        post: {
            summary: 'Resolve/Close an Emergency',
            tags: ['v1 - Emergency'],
            security: [{ bearerAuth: [] }],
            parameters: [
                { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
            ],
            responses: {
                200: {
                    description: 'Emergency resolved successfully',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/SingleEmergencyResponse' },
                        },
                    },
                },
                403: { description: 'Forbidden' },
                404: { description: 'Not found' },
            },
        },
    },
};
