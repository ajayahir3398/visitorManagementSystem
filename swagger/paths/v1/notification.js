export default {
  '/api/v1/notifications/register-token': {
    post: {
      summary: 'Register or update FCM token',
      description: 'Register a new FCM token for the authenticated user or update an existing one',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RegisterFcmTokenRequest',
            },
            example: {
              token: 'fcm_token_here',
              deviceId: 'device_unique_id',
              platform: 'android',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'FCM token registered successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/FcmTokenResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        500: {
          description: 'Internal server error',
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
  '/api/v1/notifications/remove-token': {
    delete: {
      summary: 'Remove FCM token',
      description: 'Deactivate an FCM token (e.g., on logout or app uninstall)',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: {
                token: {
                  type: 'string',
                  description: 'FCM token to remove',
                },
              },
            },
            example: {
              token: 'fcm_token_here',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'FCM token removed successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'FCM token not found',
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
  '/api/v1/notifications/tokens': {
    get: {
      summary: 'Get user FCM tokens',
      description: 'Get all FCM tokens for the authenticated user or a specific user (admin only)',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'query',
          description: 'User ID (admin only)',
          required: false,
          schema: {
            type: 'integer',
          },
        },
      ],
      responses: {
        200: {
          description: 'FCM tokens retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/FcmTokensListResponse',
              },
            },
          },
        },
        403: {
          description: 'Permission denied',
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
  '/api/v1/notifications/send': {
    post: {
      summary: 'Send notification to a user',
      description: 'Send a push notification to a single user. Users can send to themselves, admins can send to anyone.',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SendNotificationRequest',
            },
            example: {
              userId: 1,
              title: 'New Visitor',
              body: 'You have a new visitor at the gate',
              data: {
                screen: 'visitor_logs',
                visitorLogId: '123',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Notification sent successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SendNotificationResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Permission denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'No active FCM tokens found',
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
  '/api/v1/notifications/send-bulk': {
    post: {
      summary: 'Send notification to multiple users (Admin only)',
      description: 'Send push notifications to multiple users at once',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SendBulkNotificationRequest',
            },
            example: {
              userIds: [1, 2, 3],
              title: 'Maintenance Notice',
              body: 'Monthly maintenance bill is due',
              data: {
                screen: 'maintenance',
                billId: '456',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Bulk notification sent successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BulkNotificationResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Only admins can send bulk notifications',
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
  '/api/v1/notifications/send-by-role': {
    post: {
      summary: 'Send notification by role (Admin only)',
      description: 'Send push notifications to all users with a specific role',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SendNotificationByRoleRequest',
            },
            example: {
              role: 'RESIDENT',
              title: 'Emergency Alert',
              body: 'Please evacuate the building immediately',
              data: {
                screen: 'emergency',
                emergencyId: '789',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Notification sent successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RoleNotificationResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Only admins can send notifications by role',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'Role not found or no active tokens',
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
  '/api/v1/notifications/send-by-society': {
    post: {
      summary: 'Send notification by society (Admin only)',
      description: 'Send push notifications to all users in a society',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SendNotificationBySocietyRequest',
            },
            example: {
              societyId: 1,
              title: 'Society Notice',
              body: 'General body meeting scheduled for next week',
              data: {
                screen: 'notices',
                noticeId: '101',
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Notification sent successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SocietyNotificationResponse',
              },
            },
          },
        },
        400: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        403: {
          description: 'Only admins can send notifications by society',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        404: {
          description: 'No active FCM tokens found',
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
  '/api/v1/notifications': {
    get: {
      summary: 'Get user notifications',
      description: 'Get paginated list of notifications for the authenticated user',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Page number',
          schema: { type: 'integer', default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Items per page',
          schema: { type: 'integer', default: 20 },
        },
      ],
      responses: {
        200: {
          description: 'Notifications retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotificationListResponse' },
            },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
      },
    },
  },
  '/api/v1/notifications/unread-count': {
    get: {
      summary: 'Get unread notification count',
      description: 'Get the count of unread notifications for the authenticated user',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Unread count retrieved successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UnreadCountResponse' },
            },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
      },
    },
  },
  '/api/v1/notifications/read-all': {
    put: {
      summary: 'Mark all notifications as read',
      description: 'Mark all notifications as read for the authenticated user',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'All notifications marked as read',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
      },
    },
  },
  '/api/v1/notifications/{id}/read': {
    put: {
      summary: 'Mark notification as read',
      description: 'Mark a specific notification as read',
      tags: ['v1 - Notifications'],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Notification ID',
          schema: { type: 'integer' },
        },
      ],
      responses: {
        200: {
          description: 'Notification marked as read',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } },
          },
        },
        404: {
          description: 'Notification not found',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
        500: {
          description: 'Internal server error',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Error' } },
          },
        },
      },
    },
  },
};
