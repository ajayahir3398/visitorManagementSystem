export default {
  RegisterFcmTokenRequest: {
    type: 'object',
    required: ['token'],
    properties: {
      token: {
        type: 'string',
        description: 'FCM token from the mobile app',
        example: 'fcm_token_here',
      },
      deviceId: {
        type: 'string',
        description: 'Optional device identifier',
        example: 'device_unique_id',
      },
      platform: {
        type: 'string',
        enum: ['ANDROID', 'IOS'],
        description: 'Platform type',
        example: 'ANDROID',
      },
    },
  },
  FcmTokenResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'FCM token registered successfully',
      },
      data: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1,
          },
          token: {
            type: 'string',
            example: 'fcm_token_here',
          },
          platform: {
            type: 'string',
            example: 'ANDROID',
          },
          isActive: {
            type: 'boolean',
            example: true,
          },
        },
      },
    },
  },
  FcmTokensListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        type: 'object',
        properties: {
          userId: {
            type: 'integer',
            example: 1,
          },
          tokens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'integer',
                  example: 1,
                },
                token: {
                  type: 'string',
                  example: 'fcm_token_here',
                },
                deviceId: {
                  type: 'string',
                  example: 'device_unique_id',
                },
                platform: {
                  type: 'string',
                  example: 'ANDROID',
                },
                isActive: {
                  type: 'boolean',
                  example: true,
                },
                createdAt: {
                  type: 'string',
                  format: 'date-time',
                },
                updatedAt: {
                  type: 'string',
                  format: 'date-time',
                },
              },
            },
          },
          count: {
            type: 'integer',
            example: 2,
          },
        },
      },
    },
  },
  SendNotificationRequest: {
    type: 'object',
    required: ['title', 'body'],
    properties: {
      userId: {
        type: 'integer',
        description: 'User ID to send notification to (optional, defaults to authenticated user)',
        example: 1,
      },
      title: {
        type: 'string',
        description: 'Notification title',
        example: 'New Visitor',
      },
      body: {
        type: 'string',
        description: 'Notification body/message',
        example: 'You have a new visitor at the gate',
      },
      data: {
        type: 'object',
        description: 'Additional data payload (optional)',
        additionalProperties: {
          type: 'string',
        },
        example: {
          screen: 'visitor_logs',
          visitorLogId: '123',
        },
      },
    },
  },
  SendNotificationResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Notification sent to 2 device(s)',
      },
      data: {
        type: 'object',
        properties: {
          userId: {
            type: 'integer',
            example: 1,
          },
          successCount: {
            type: 'integer',
            example: 2,
          },
          failureCount: {
            type: 'integer',
            example: 0,
          },
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tokenId: {
                  type: 'integer',
                  example: 1,
                },
                success: {
                  type: 'boolean',
                  example: true,
                },
                messageId: {
                  type: 'string',
                  example: 'message_id_from_fcm',
                },
              },
            },
          },
        },
      },
    },
  },
  SendBulkNotificationRequest: {
    type: 'object',
    required: ['userIds', 'title', 'body'],
    properties: {
      userIds: {
        type: 'array',
        items: {
          type: 'integer',
        },
        description: 'Array of user IDs to send notification to',
        example: [1, 2, 3],
      },
      title: {
        type: 'string',
        description: 'Notification title',
        example: 'Maintenance Notice',
      },
      body: {
        type: 'string',
        description: 'Notification body/message',
        example: 'Monthly maintenance bill is due',
      },
      data: {
        type: 'object',
        description: 'Additional data payload (optional)',
        additionalProperties: {
          type: 'string',
        },
        example: {
          screen: 'maintenance',
          billId: '456',
        },
      },
    },
  },
  BulkNotificationResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Notification sent to 5 device(s)',
      },
      data: {
        type: 'object',
        properties: {
          totalTokens: {
            type: 'integer',
            example: 5,
          },
          successCount: {
            type: 'integer',
            example: 5,
          },
          failureCount: {
            type: 'integer',
            example: 0,
          },
        },
      },
    },
  },
  SendNotificationByRoleRequest: {
    type: 'object',
    required: ['role', 'title', 'body'],
    properties: {
      role: {
        type: 'string',
        enum: ['SUPER_ADMIN', 'SOCIETY_ADMIN', 'SECURITY', 'RESIDENT'],
        description: 'Role to send notification to',
        example: 'RESIDENT',
      },
      title: {
        type: 'string',
        description: 'Notification title',
        example: 'Emergency Alert',
      },
      body: {
        type: 'string',
        description: 'Notification body/message',
        example: 'Please evacuate the building immediately',
      },
      data: {
        type: 'object',
        description: 'Additional data payload (optional)',
        additionalProperties: {
          type: 'string',
        },
        example: {
          screen: 'EMERGENCY',
          emergencyId: '789',
        },
      },
    },
  },
  RoleNotificationResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Notification sent to 10 device(s)',
      },
      data: {
        type: 'object',
        properties: {
          role: {
            type: 'string',
            example: 'RESIDENT',
          },
          totalUsers: {
            type: 'integer',
            example: 8,
          },
          totalTokens: {
            type: 'integer',
            example: 10,
          },
          successCount: {
            type: 'integer',
            example: 10,
          },
          failureCount: {
            type: 'integer',
            example: 0,
          },
        },
      },
    },
  },
  SendNotificationBySocietyRequest: {
    type: 'object',
    required: ['title', 'body'],
    properties: {
      societyId: {
        type: 'integer',
        description: 'Society ID (optional, defaults to authenticated user society)',
        example: 1,
      },
      title: {
        type: 'string',
        description: 'Notification title',
        example: 'Society Notice',
      },
      body: {
        type: 'string',
        description: 'Notification body/message',
        example: 'General body meeting scheduled for next week',
      },
      data: {
        type: 'object',
        description: 'Additional data payload (optional)',
        additionalProperties: {
          type: 'string',
        },
        example: {
          screen: 'notices',
          noticeId: '101',
        },
      },
    },
  },
  SocietyNotificationResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      message: {
        type: 'string',
        example: 'Notification sent to 25 device(s)',
      },
      data: {
        type: 'object',
        properties: {
          societyId: {
            type: 'integer',
            example: 1,
          },
          totalUsers: {
            type: 'integer',
            example: 20,
          },
          totalTokens: {
            type: 'integer',
            example: 25,
          },
          successCount: {
            type: 'integer',
            example: 25,
          },
          failureCount: {
            type: 'integer',
            example: 0,
          },
        },
      },
    },
  },
  Notification: {
    type: 'object',
    properties: {
      id: {
        type: 'integer',
        example: 1,
      },
      userId: {
        type: 'integer',
        example: 1,
      },
      title: {
        type: 'string',
        example: 'New Visitor',
      },
      body: {
        type: 'string',
        example: 'You have a new visitor at the gate',
      },
      data: {
        type: 'object',
        example: {
          screen: 'visitor_logs',
          visitorLogId: '123',
        },
      },
      isRead: {
        type: 'boolean',
        example: false,
      },
      type: {
        type: 'string',
        example: 'SYSTEM',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
  NotificationListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        type: 'object',
        properties: {
          notifications: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Notification',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                example: 10,
              },
              page: {
                type: 'integer',
                example: 1,
              },
              limit: {
                type: 'integer',
                example: 20,
              },
              totalPages: {
                type: 'integer',
                example: 1,
              },
            },
          },
          unreadCount: {
            type: 'integer',
            example: 5,
          },
        },
      },
    },
  },
  UnreadCountResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        type: 'object',
        properties: {
          count: {
            type: 'integer',
            example: 5,
          },
        },
      },
    },
  },
};
