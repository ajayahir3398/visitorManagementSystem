export default {
    // Maintenance Bill Schema
    MaintenanceBill: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            societyId: { type: 'integer', example: 5 },
            unitId: { type: 'integer', example: 10 },
            billCycle: { type: 'string', enum: ['MONTHLY', 'YEARLY', 'SPECIAL'], example: 'MONTHLY' },
            period: { type: 'string', example: '2025-03' },
            amount: { type: 'integer', example: 2500 },
            dueDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['UNPAID', 'PAID', 'OVERDUE'], example: 'PAID' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            unit: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 10 },
                    unitNo: { type: 'string', example: 'A-101' },
                }
            },
            payments: {
                type: 'array',
                items: { $ref: '#/components/schemas/MaintenancePayment' }
            }
        },
    },

    // Maintenance Payment Schema
    MaintenancePayment: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            billId: { type: 'integer', example: 1 },
            paidBy: { type: 'integer', example: 20 },
            amount: { type: 'integer', example: 2500 },
            paymentMode: { type: 'string', enum: ['ONLINE', 'UPI', 'CASH', 'CHEQUE'], example: 'UPI' },
            transactionId: { type: 'string', example: 'TXN123456789' },
            status: { type: 'string', example: 'SUCCESS' },
            paidAt: { type: 'string', format: 'date-time' },
        },
    },

    // Temp Maintenance Bill Schema
    TempMaintenanceBill: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            societyId: { type: 'integer', example: 5 },
            unitId: { type: 'integer', example: 10 },
            billCycle: { type: 'string', enum: ['MONTHLY', 'YEARLY', 'SPECIAL'], example: 'MONTHLY' },
            period: { type: 'string', example: '2025-04' },
            amount: { type: 'integer', example: 2500 },
            dueDate: { type: 'string', format: 'date-time' },
            description: { type: 'string', example: 'Monthly Maintenance' },
            unit: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 10 },
                    unitNo: { type: 'string', example: 'A-101' },
                }
            }
        },
    },

    // Request Schemas
    PayMaintenanceRequest: {
        type: 'object',
        required: ['tempBillId', 'paymentMode'],
        properties: {
            tempBillId: {
                type: 'integer',
                description: 'ID of the temporary maintenance bill',
                example: 1,
            },
            paymentMode: {
                type: 'string',
                enum: ['ONLINE', 'UPI', 'CASH', 'CHEQUE'],
                example: 'UPI',
            },
            transactionId: {
                type: 'string',
                description: 'Optional: Transaction ID from the gateway',
                example: 'TXN_987654321',
            },
        },
    },

    CreateCustomBillRequest: {
        type: 'object',
        required: ['unitId', 'amount', 'description', 'dueDate'],
        properties: {
            unitId: { type: 'integer', example: 10 },
            amount: { type: 'integer', example: 1000 },
            description: { type: 'string', example: 'Penalty for rule violation' },
            dueDate: { type: 'string', format: 'date-time', example: '2024-04-15T00:00:00Z' }
        }
    },

    // Response Schemas
    UpcomingMaintenanceResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Upcoming and outstanding maintenance retrieved successfully' },
            data: {
                type: 'object',
                properties: {
                    upcoming: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/TempMaintenanceBill' },
                    },
                    outstanding: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/MaintenanceBill' },
                    },
                },
            },
        },
    },

    PayMaintenanceResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Maintenance paid successfully' },
            data: {
                type: 'object',
                properties: {
                    bill: { $ref: '#/components/schemas/MaintenanceBill' },
                    payment: { $ref: '#/components/schemas/MaintenancePayment' },
                },
            },
        },
    },

    MyBillsResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'My maintenance bills retrieved successfully' },
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
                            page: { type: 'integer', example: 1 },
                            limit: { type: 'integer', example: 10 },
                            total: { type: 'integer', example: 5 },
                            pages: { type: 'integer', example: 1 },
                        },
                    },
                },
            },
        },
    },
};
