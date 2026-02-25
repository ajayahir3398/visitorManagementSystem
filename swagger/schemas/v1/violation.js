export default {
    RuleViolation: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            societyId: { type: 'integer', example: 1 },
            ruleId: { type: 'integer', example: 5 },
            violatorUserId: { type: 'integer', example: 10 },
            violatorUnitId: { type: 'integer', example: 12 },
            reportedByUserId: { type: 'integer', example: 5 },
            description: { type: 'string', example: 'Loud music after 11 PM' },
            photoBase64: { type: 'string', example: 'data:image/jpeg;base64,/9j/4AAQ...' },
            status: { type: 'string', enum: ['PENDING', 'RESOLVED', 'DISMISSED', 'PAID'], example: 'PENDING' },
            penaltyAmount: { type: 'number', example: 500.00 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
    ReportViolationRequest: {
        type: 'object',
        properties: {
            ruleId: { type: 'integer', example: 5 },
            violatorUserId: { type: 'integer', example: 10 },
            violatorUnitId: { type: 'integer', example: 2 },
            description: { type: 'string', example: 'Playing loud music after allowed hours' },
            photoBase64: { type: 'string', example: 'data:image/jpeg;base64,/9j/4AAQ...' },
            penaltyAmount: { type: 'number', example: 500.00 },
        },
        required: ['ruleId'],
    },
    UpdateViolationStatusRequest: {
        type: 'object',
        properties: {
            status: { type: 'string', enum: ['PENDING', 'RESOLVED', 'DISMISSED', 'PAID'], example: 'RESOLVED' },
            penaltyAmount: { type: 'number', example: 500.00 },
        },
    },
    ViolationResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Violation processed successfully' },
            data: {
                type: 'object',
                properties: {
                    violation: { $ref: '#/components/schemas/RuleViolation' },
                },
            },
        },
    },
    ViolationsListResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Violations retrieved successfully' },
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
};
