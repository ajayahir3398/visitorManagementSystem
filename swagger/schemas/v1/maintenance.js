export default {
    MaintenancePlan: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            societyId: { type: 'integer', example: 1 },
            planType: { type: 'string', enum: ['MONTHLY', 'YEARLY'], example: 'MONTHLY' },
            amount: { type: 'integer', example: 2500 },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
        },
    },
    MaintenanceBill: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 101 },
            societyId: { type: 'integer', example: 1 },
            unitId: { type: 'integer', example: 12 },
            billCycle: { type: 'string', example: 'MONTHLY' },
            period: { type: 'string', example: '2025-03' },
            amount: { type: 'integer', example: 2500 },
            dueDate: { type: 'string', format: 'date', example: '2025-03-10' },
            status: { type: 'string', enum: ['UNPAID', 'PAID', 'OVERDUE'], example: 'UNPAID' },
            createdBy: { type: 'integer', example: 2 },
            createdAt: { type: 'string', format: 'date-time' },
        },
    },
    CreateMaintenancePlanRequest: {
        type: 'object',
        properties: {
            planType: { type: 'string', enum: ['MONTHLY', 'YEARLY'], example: 'MONTHLY' },
            amount: { type: 'integer', example: 2500 },
        },
        required: ['planType', 'amount'],
    },
    GenerateBulkBillRequest: {
        type: 'object',
        properties: {
            billCycle: { type: 'string', enum: ['MONTHLY', 'YEARLY'], example: 'MONTHLY' },
            period: { type: 'string', example: '2025-03' },
            dueDate: { type: 'string', format: 'date', example: '2025-03-10' },
        },
        required: ['billCycle', 'period', 'dueDate'],
    },
    GenerateSingleBillRequest: {
        type: 'object',
        properties: {
            unitId: { type: 'integer', example: 12 },
            billCycle: { type: 'string', enum: ['MONTHLY', 'YEARLY', 'SPECIAL'], example: 'MONTHLY' },
            period: { type: 'string', example: '2025-03' },
            amount: { type: 'integer', example: 2500 },
            dueDate: { type: 'string', format: 'date', example: '2025-03-10' },
        },
        required: ['unitId', 'billCycle', 'period', 'amount', 'dueDate'],
    },
    PayBillRequest: {
        type: 'object',
        properties: {
            paymentMode: { type: 'string', enum: ['ONLINE', 'UPI', 'CASH', 'CHEQUE'], example: 'UPI' },
            transactionId: { type: 'string', example: 'TXN_123456789' },
        },
        required: ['paymentMode'],
    },
    MaintenancePlansListResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Plans retrieved successfully' },
            data: {
                type: 'object',
                properties: {
                    plans: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/MaintenancePlan' },
                    },
                },
            },
        },
    },
    MaintenanceBillResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Bill processed successfully' },
            data: {
                type: 'object',
                properties: {
                    bill: { $ref: '#/components/schemas/MaintenanceBill' },
                },
            },
        },
    },
    MaintenanceBillsListResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Bills retrieved successfully' },
            data: {
                type: 'object',
                properties: {
                    bills: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/MaintenanceBill' },
                    },
                    pagination: {
                        type: 'object',
                        properties: {
                            total: { type: 'integer' },
                            page: { type: 'integer' },
                            limit: { type: 'integer' },
                            pages: { type: 'integer' },
                        },
                    },
                },
            },
        },
    },
    StandardResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
        },
    },
};
