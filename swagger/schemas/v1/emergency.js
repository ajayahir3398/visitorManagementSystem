export default {
    EmergencyRequest: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            societyId: { type: 'integer', example: 1 },
            raisedBy: { type: 'integer', example: 5 },
            unitId: { type: 'integer', example: 12 },
            emergencyType: { type: 'string', enum: ['Medical', 'Fire', 'Theft', 'Security', 'Other'], example: 'Medical' },
            notificationType: { type: 'string', enum: ['SIREN', 'CALL', 'PUSH', 'ALL'], example: 'ALL' },
            description: { type: 'string', example: 'Person unconscious' },
            location: { type: 'string', example: 'Flat A-302' },
            status: { type: 'string', enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'], example: 'OPEN' },
            priority: { type: 'string', example: 'HIGH' },
            raisedAt: { type: 'string', format: 'date-time' },
            acknowledgedAt: { type: 'string', format: 'date-time', nullable: true },
            resolvedAt: { type: 'string', format: 'date-time', nullable: true },
        },
    },
    EmergencyActionResponse: {
        type: 'object',
        properties: {
            id: { type: 'integer', example: 1 },
            emergencyId: { type: 'integer', example: 1 },
            responderId: { type: 'integer', example: 3 },
            responseAction: { type: 'string', example: 'Ambulance Called' },
            responseNotes: { type: 'string', example: '108 contacted' },
            responseTime: { type: 'string', format: 'date-time' },
        },
    },
    CreateEmergencyRequest: {
        type: 'object',
        properties: {
            emergencyType: { type: 'string', enum: ['Medical', 'Fire', 'Theft', 'Security', 'Other'], example: 'Medical' },
            notificationType: { type: 'string', enum: ['SIREN', 'CALL', 'PUSH', 'ALL'], example: 'ALL' },
            description: { type: 'string', example: 'Person unconscious in lobby' },
            location: { type: 'string', example: 'Flat A-302' },
            unitId: { type: 'integer', example: 12 },
        },
        required: ['emergencyType', 'notificationType'],
    },
    AddEmergencyResponseRequest: {
        type: 'object',
        properties: {
            responseAction: { type: 'string', example: 'Ambulance Called' },
            responseNotes: { type: 'string', example: '108 contacted, ETA 10 mins' },
        },
        required: ['responseAction'],
    },
    SingleEmergencyResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Emergency processed successfully' },
            data: {
                type: 'object',
                properties: {
                    emergency: { $ref: '#/components/schemas/EmergencyRequest' },
                    responses: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/EmergencyActionResponse' },
                    },
                },
            },
        },
    },
    EmergenciesListResponse: {
        type: 'object',
        properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Emergencies retrieved successfully' },
            data: {
                type: 'object',
                properties: {
                    emergencies: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/EmergencyRequest' },
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
};
