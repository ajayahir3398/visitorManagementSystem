export default {
    type: 'object',
    properties: {
        id: { type: 'integer', example: 1 },
        societyId: { type: 'integer', example: 101 },
        ruleId: { type: 'integer', example: 5 },
        violatorUserId: { type: 'integer', example: 50 },
        violatorUnitId: { type: 'integer', example: 20 },
        reportedByUserId: { type: 'integer', example: 10 },
        description: { type: 'string', example: 'Loud noise past 11 pm' },
        proofImage: { type: 'string', example: 'https://example.com/image.jpg' },
        status: { type: 'string', enum: ['PENDING', 'RESOLVED', 'DISMISSED', 'PAID'], example: 'PENDING' },
        penaltyAmount: { type: 'number', format: 'float', example: 500.00 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        rule: { $ref: '#/components/schemas/Rule' },
    },
};

