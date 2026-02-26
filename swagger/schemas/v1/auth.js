export default {
  LoginRequest: {
    type: 'object',
    required: ['password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'admin@example.com',
        description: 'Email address (required if mobile not provided)',
      },
      mobile: {
        type: 'string',
        pattern: '^[0-9]{10}$',
        example: '1234567890',
        description: '10-digit mobile number (required if email not provided)',
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'password123',
        description: 'Password (required for admin login)',
      },
    },
  },
  LoginResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Login successful',
      },
      data: {
        type: 'object',
        properties: {
          user: {
            $ref: '#/components/schemas/User',
          },
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  },
  OTPRequest: {
    type: 'object',
    required: ['mobile'],
    properties: {
      mobile: {
        type: 'string',
        pattern: '^[0-9]{10}$',
        example: '1234567890',
        description: '10-digit mobile number',
      },
    },
  },
  OTPResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'OTP sent successfully',
      },
      data: {
        type: 'object',
        properties: {
          mobile: {
            type: 'string',
            example: '1234567890',
          },
          otp: {
            type: 'string',
            example: '123456',
            description: 'Only returned in development mode',
          },
          expiresIn: {
            type: 'string',
            example: '10 minutes',
          },
        },
      },
    },
  },
  VerifyOTPRequest: {
    type: 'object',
    required: ['mobile', 'otp'],
    properties: {
      mobile: {
        type: 'string',
        pattern: '^[0-9]{10}$',
        example: '1234567890',
      },
      otp: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        example: '123456',
        description: '6-digit OTP code',
      },
    },
  },
  RefreshTokenRequest: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  },
  RefreshTokenResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Token refreshed successfully',
      },
      data: {
        type: 'object',
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  },
  LogoutRequest: {
    type: 'object',
    properties: {
      refreshToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description:
          'Refresh token to invalidate (optional). If not provided and access token is in header, logs out from all devices.',
      },
    },
    description:
      'Request body is optional. Can use either: 1) Access token in Authorization header (recommended), 2) refreshToken in body (fallback), or 3) Both (validates token ownership)',
  },
  LogoutResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Logged out successfully',
        description:
          'Message indicating logout success. May indicate "single device" or "all devices" logout.',
      },
    },
  },
  LogoutAllResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Logged out from all devices successfully',
      },
      data: {
        type: 'object',
        properties: {
          sessionsInvalidated: {
            type: 'integer',
            example: 3,
            description: 'Number of refresh tokens (sessions) that were invalidated',
          },
        },
      },
    },
  },
};
