
export default {
    type: 'object',
    properties: {
        id: { type: 'integer', example: 1 },
        societyId: { type: 'integer', example: 101 },
        title: { type: 'string', example: 'No delivery after 10 PM' },
        description: { type: 'string', example: 'Delivery boys not allowed after 10PM for security reasons' },
        category: { type: 'string', example: 'Security' },
        priority: { type: 'string', example: 'High' },
        violationPenalty: { type: 'string', example: 'Fine ₹500' },
        isActive: { type: 'boolean', example: true },
        createdBy: { type: 'integer', example: 5 },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
    },
};
