export default {
    RequestOTPRequest: {
        type: 'object',
        required: ['mobile'],
        properties: {
            mobile: {
                type: 'string',
                pattern: '^[0-9]{10}$',
                example: '9876543210',
                description: '10-digit mobile number'
            }
        }
    },
    RequestOTPResponse: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'OTP sent successfully'
            },
            data: {
                type: 'object',
                properties: {
                    mobile: {
                        type: 'string',
                        example: '9876543210'
                    },
                    expiresIn: {
                        type: 'string',
                        example: '10 minutes'
                    }
                }
            }
        }
    },
    RegisterSocietyRequest: {
        type: 'object',
        required: ['mobile', 'otp', 'societyName', 'societyType', 'adminName', 'password'],
        properties: {
            mobile: {
                type: 'string',
                pattern: '^[0-9]{10}$',
                example: '9876543210',
                description: '10-digit mobile number'
            },
            otp: {
                type: 'string',
                pattern: '^[0-9]{6}$',
                example: '123456',
                description: '6-digit OTP'
            },
            societyName: {
                type: 'string',
                minLength: 2,
                example: 'Green Valley Apartments',
                description: 'Name of the society'
            },
            societyType: {
                type: 'string',
                enum: ['apartment', 'office'],
                example: 'apartment',
                description: 'Type of society (apartment or office)'
            },
            city: {
                type: 'string',
                example: 'Ahmedabad',
                description: 'City name'
            },
            adminName: {
                type: 'string',
                minLength: 2,
                example: 'Ramesh Patel',
                description: 'Name of the society admin'
            },
            password: {
                type: 'string',
                minLength: 6,
                example: 'securePass123',
                description: 'Password for society admin account'
            },
            email: {
                type: 'string',
                format: 'email',
                example: 'admin@greenvalley.com',
                description: 'Email address of the admin (optional)'
            }
        }
    },
    RegisterSocietyResponse: {
        type: 'object',
        properties: {
            success: {
                type: 'boolean',
                example: true
            },
            message: {
                type: 'string',
                example: 'Society registered successfully! Your 14-day trial has started.'
            },
            data: {
                type: 'object',
                properties: {
                    society: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'Green Valley Apartments' },
                            type: { type: 'string', example: 'apartment' },
                            city: { type: 'string', example: 'Ahmedabad' },
                            source: { type: 'string', example: 'SELF_REGISTERED' }
                        }
                    },
                    user: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer', example: 1 },
                            name: { type: 'string', example: 'Ramesh Patel' },
                            mobile: { type: 'string', example: '9876543210' },
                            email: { type: 'string', example: 'admin@greenvalley.com' },
                            society_id: { type: 'integer', example: 1 },
                            role: { type: 'string', example: 'SOCIETY_ADMIN' },
                            status: { type: 'string', example: 'active' }
                        }
                    },
                    subscription: {
                        type: 'object',
                        properties: {
                            id: { type: 'integer', example: 1 },
                            status: { type: 'string', example: 'TRIAL' },
                            plan: { type: 'string', example: 'Trial Plan' },
                            startDate: { type: 'string', format: 'date-time' },
                            expiryDate: { type: 'string', format: 'date-time' },
                            trialDaysLeft: { type: 'integer', example: 14 }
                        }
                    },
                    accessToken: { type: 'string', description: 'JWT Access Token' },
                    refreshToken: { type: 'string', description: 'JWT Refresh Token' }
                }
            }
        }
    }
};
