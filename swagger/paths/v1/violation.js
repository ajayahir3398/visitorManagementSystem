export default {
    '/api/v1/violations': {
        get: {
            tags: ['v1 - Violations'],
            summary: 'Get all violations',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'status',
                    in: 'query',
                    schema: { type: 'string', enum: ['PENDING', 'RESOLVED', 'DISMISSED', 'PAID'] },
                },
                {
                    name: 'unitId',
                    in: 'query',
                    schema: { type: 'integer' },
                },
            ],
            responses: {
                200: {
                    description: 'Violations retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    success: { type: 'boolean', example: true },
                                    data: {
                                        type: 'object',
                                        properties: {
                                            violations: {
                                                type: 'array',
                                                items: { $ref: '#/components/schemas/RuleViolation' },
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
            tags: ['v1 - Violations'],
            summary: 'Report a violation',
            security: [{ bearerAuth: [] }],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                ruleId: { type: 'integer' },
                                violatorUserId: { type: 'integer' },
                                violatorUnitId: { type: 'integer' },
                                description: { type: 'string' },
                                proofImage: { type: 'string' },
                                penaltyAmount: { type: 'number' },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Violation reported successfully',
                },
                400: { description: 'Validation error' },
            },
        },
    },
    '/api/v1/violations/{id}/status': {
        put: {
            tags: ['v1 - Violations'],
            summary: 'Update violation status',
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
                                status: { type: 'string', enum: ['PENDING', 'RESOLVED', 'DISMISSED', 'PAID'] },
                                penaltyAmount: { type: 'number' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: { description: 'Status updated successfully' },
                404: { description: 'Violation not found' },
            },
        },
    },
};
