export default {
  '/api/v1/public/society/request-otp': {
    post: {
      tags: ['v1 - Public'],
      summary: 'Request OTP for society registration',
      description:
        'Sends an OTP to the provided mobile number for verifying society registration request.',
      operationId: 'requestRegistrationOTP',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RequestOTPRequest',
            },
            example: {
              mobile: '9876543210',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'OTP sent successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RequestOTPResponse',
              },
            },
          },
        },
        400: {
          description: 'Invalid input',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        409: {
          description: 'Mobile already registered',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  '/api/v1/public/society/register': {
    post: {
      tags: ['v1 - Public'],
      summary: 'Complete society self-registration',
      description: 'Verifies OTP and creates a new society, admin user, and trial subscription.',
      operationId: 'registerSociety',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RegisterSocietyRequest',
            },
            example: {
              mobile: '9876543210',
              otp: '123456',
              societyName: 'Green Valley Apartments',
              societyType: 'apartment',
              adminName: 'Ramesh Patel',
              password: 'securePass123',
              email: 'admin@greenvalley.com',
              city: 'Ahmedabad',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Society registered successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterSocietyResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error or invalid OTP',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        409: {
          description: 'Mobile or Email already registered',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
};
