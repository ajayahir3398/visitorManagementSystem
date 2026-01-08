export default {
    Rule: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            societyId: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'No Parking in Driveway' },
            description: { type: 'string', example: 'Vehicles must be parked in designated spots only.' },
            category: { type: 'string', example: 'Parking' },
            priority: { type: 'string', enum: ['Low', 'Medium', 'High'], example: 'High' },
            violationPenalty: { type: 'string', example: 'Fine of ₹500' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
    CreateRuleRequest: {
        type: 'object',
        properties: {
            title: { type: 'string', example: 'No Parking in Driveway' },
            description: { type: 'string', example: 'Vehicles must be parked in designated spots only.' },
            category: { type: 'string', example: 'Parking' },
            priority: { type: 'string', enum: ['Low', 'Medium', 'High'], example: 'High' },
            violationPenalty: { type: 'string', example: 'Fine of ₹500' },
        },
        required: ['title', 'category'],
    },
    UpdateRuleRequest: {
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
    RuleResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Rule processed successfully' },
            data: {
                type: 'object',
                properties: {
                    rule: { $ref: '#/components/schemas/Rule' },
                },
            },
        },
    },
    RulesListResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Rules retrieved successfully' },
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
};
