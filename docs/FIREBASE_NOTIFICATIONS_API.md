# Firebase Push Notifications API Documentation

This document provides a complete guide for implementing and using Firebase Cloud Messaging (FCM) push notifications in the Visitor Management System API.

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Usage Examples](#usage-examples)
5. [Integration with React Native](#integration-with-react-native)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Setup & Configuration

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Cloud Messaging** in the project settings
4. Go to **Project Settings** → **Service Accounts**
5. Click **Generate New Private Key** to download the service account JSON file

### 2. Backend Configuration

Add the following environment variables to your `.env` file:

```env
# Option 1: Path to service account JSON file (recommended)
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# Option 2: Service account JSON as environment variable (alternative)
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Option 3: Use default credentials (for Google Cloud environments)
# No environment variable needed - will use application default credentials
```

**Important:** Store the service account JSON file securely and **never commit it to version control**.

### 3. Database Migration

Run the Prisma migration to create the FCM tokens table:

```bash
npm run db:migrate
```

Or push the schema directly:

```bash
npm run db:push
```

---

## Database Schema

### FcmToken Model

```prisma
model FcmToken {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  token     String   @unique @db.VarChar(500)
  deviceId  String?  @map("device_id") @db.VarChar(255)
  platform  String?  @db.VarChar(20) // android / ios
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Key Points:**
- One user can have multiple FCM tokens (multiple devices)
- Tokens are unique across the system
- Tokens can be deactivated (isActive = false) without deletion
- Tokens are automatically deleted when user is deleted (CASCADE)

---

## API Endpoints

### Base URL
All notification endpoints are under `/api/v1/notifications`

### Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

### 1. Register/Update FCM Token

**Endpoint:** `POST /api/v1/notifications/register-token`

**Description:** Register a new FCM token or update an existing one for the authenticated user.

**Request Body:**
```json
{
  "token": "fcm_token_from_mobile_app",
  "deviceId": "device_unique_id",  // Optional
  "platform": "android"             // Optional: "android" or "ios"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "FCM token registered successfully",
  "data": {
    "id": 1,
    "token": "fcm_token_from_mobile_app",
    "platform": "android",
    "isActive": true
  }
}
```

**When to Call:**
- On app startup (after getting FCM token)
- On user login
- When FCM token is refreshed

---

### 2. Remove FCM Token

**Endpoint:** `DELETE /api/v1/notifications/remove-token`

**Description:** Deactivate an FCM token (e.g., on logout or app uninstall).

**Request Body:**
```json
{
  "token": "fcm_token_to_remove"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "FCM token removed successfully"
}
```

**When to Call:**
- On user logout
- On app uninstall
- When token becomes invalid

---

### 3. Get User FCM Tokens

**Endpoint:** `GET /api/v1/notifications/tokens?userId={userId}`

**Description:** Get all FCM tokens for a user. Users can view their own tokens, admins can view any user's tokens.

**Query Parameters:**
- `userId` (optional): User ID (admin only)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "tokens": [
      {
        "id": 1,
        "token": "fcm_token_1",
        "deviceId": "device_1",
        "platform": "android",
        "isActive": true,
        "createdAt": "2025-01-15T10:00:00.000Z",
        "updatedAt": "2025-01-15T10:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

---

### 4. Send Notification to User

**Endpoint:** `POST /api/v1/notifications/send`

**Description:** Send a push notification to a single user. Users can send to themselves, admins can send to anyone.

**Request Body:**
```json
{
  "userId": 1,                    // Optional, defaults to authenticated user
  "title": "New Visitor",
  "body": "You have a new visitor at the gate",
  "data": {                        // Optional
    "screen": "visitor_logs",
    "visitorLogId": "123"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification sent to 2 device(s)",
  "data": {
    "userId": 1,
    "successCount": 2,
    "failureCount": 0,
    "results": [
      {
        "tokenId": 1,
        "success": true,
        "messageId": "message_id_from_fcm"
      }
    ]
  }
}
```

---

### 5. Send Bulk Notification

**Endpoint:** `POST /api/v1/notifications/send-bulk`

**Description:** Send push notifications to multiple users at once. **Admin only.**

**Access:** SUPER_ADMIN, SOCIETY_ADMIN

**Request Body:**
```json
{
  "userIds": [1, 2, 3],
  "title": "Maintenance Notice",
  "body": "Monthly maintenance bill is due",
  "data": {
    "screen": "maintenance",
    "billId": "456"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification sent to 5 device(s)",
  "data": {
    "totalTokens": 5,
    "successCount": 5,
    "failureCount": 0
  }
}
```

---

### 6. Send Notification by Role

**Endpoint:** `POST /api/v1/notifications/send-by-role`

**Description:** Send push notifications to all users with a specific role. **Admin only.**

**Access:** SUPER_ADMIN, SOCIETY_ADMIN

**Request Body:**
```json
{
  "role": "RESIDENT",
  "title": "Emergency Alert",
  "body": "Please evacuate the building immediately",
  "data": {
    "screen": "emergency",
    "emergencyId": "789"
  }
}
```

**Valid Roles:**
- `SUPER_ADMIN`
- `SOCIETY_ADMIN`
- `SECURITY`
- `RESIDENT`

**Response (200):**
```json
{
  "success": true,
  "message": "Notification sent to 10 device(s)",
  "data": {
    "role": "RESIDENT",
    "totalUsers": 8,
    "totalTokens": 10,
    "successCount": 10,
    "failureCount": 0
  }
}
```

**Note:** SOCIETY_ADMIN can only send to users in their own society.

---

### 7. Send Notification by Society

**Endpoint:** `POST /api/v1/notifications/send-by-society`

**Description:** Send push notifications to all users in a society. **Admin only.**

**Access:** SUPER_ADMIN, SOCIETY_ADMIN

**Request Body:**
```json
{
  "societyId": 1,                  // Optional, defaults to authenticated user's society
  "title": "Society Notice",
  "body": "General body meeting scheduled for next week",
  "data": {
    "screen": "notices",
    "noticeId": "101"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification sent to 25 device(s)",
  "data": {
    "societyId": 1,
    "totalUsers": 20,
    "totalTokens": 25,
    "successCount": 25,
    "failureCount": 0
  }
}
```

**Note:** SOCIETY_ADMIN can only send to their own society.

---

## Usage Examples

### Example 1: Visitor Entry Notification

When a visitor arrives, notify the resident:

```javascript
// In your visitor log controller
import { sendNotification } from '../../services/firebaseService.js';

// After creating visitor log
const resident = await prisma.user.findUnique({
  where: { id: visitorLog.unit.members[0].userId },
  include: { fcmTokens: { where: { isActive: true } } }
});

for (const token of resident.fcmTokens) {
  await sendNotification(
    token.token,
    {
      title: 'New Visitor',
      body: `${visitor.name} is at the gate`,
    },
    {
      screen: 'visitor_logs',
      visitorLogId: visitorLog.id.toString(),
    }
  );
}
```

### Example 2: Emergency Alert to All Residents

```javascript
// Send emergency notification to all residents in a society
const response = await fetch('http://localhost:1111/api/v1/notifications/send-by-role', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    role: 'RESIDENT',
    title: 'Emergency Alert',
    body: 'Please evacuate the building immediately',
    data: {
      screen: 'emergency',
      emergencyId: emergencyId.toString(),
    },
  }),
});
```

### Example 3: Maintenance Bill Notification

```javascript
// Notify all residents about maintenance bill
const response = await fetch('http://localhost:1111/api/v1/notifications/send-by-society', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Maintenance Bill',
    body: 'Your monthly maintenance bill is ready',
    data: {
      screen: 'maintenance',
      billId: billId.toString(),
    },
  }),
});
```

---

## Integration with React Native

> **📱 Complete React Native Implementation Guide Available!**
> 
> For a complete, production-ready React Native implementation with:
> - Full service class with error handling
> - Custom hooks for easy integration
> - Navigation handling
> - Background/foreground/killed state support
> - Complete code examples
> 
> See: **[REACT_NATIVE_FIREBASE_NOTIFICATIONS.md](./REACT_NATIVE_FIREBASE_NOTIFICATIONS.md)**

### Quick Start

#### Step 1: Install Packages
```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
cd ios && pod install && cd ..
```

#### Step 2: Basic Implementation

```typescript
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

// Get FCM token
const token = await messaging().getToken();

// Register with backend
await fetch('http://your-api.com/api/v1/notifications/register-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token,
    platform: Platform.OS,
  }),
});
```

#### Step 3: Handle Notifications

```typescript
// Foreground
messaging().onMessage(async (remoteMessage) => {
  console.log('Notification:', remoteMessage);
  // Handle notification
});

// Background/Killed
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification:', remoteMessage);
});
```

For complete implementation with error handling, navigation, and best practices, see the [full guide](./REACT_NATIVE_FIREBASE_NOTIFICATIONS.md).

---

## Best Practices

### 1. Token Management

✅ **Do:**
- Register token on app startup and login
- Update token when it refreshes
- Remove token on logout
- Handle token refresh automatically

❌ **Don't:**
- Store tokens in local storage only
- Forget to remove tokens on logout
- Send notifications to inactive tokens

### 2. Notification Content

✅ **Do:**
- Keep titles short (≤ 50 characters)
- Keep body concise (≤ 150 characters)
- Use data payload for navigation
- Include relevant IDs in data payload

❌ **Don't:**
- Send too many notifications
- Use generic messages
- Forget to handle notification clicks

### 3. Error Handling

✅ **Do:**
- Handle FCM errors gracefully
- Log failed notifications
- Retry failed notifications (with backoff)
- Clean up invalid tokens

### 4. Security

✅ **Do:**
- Validate user permissions before sending
- Use HTTPS for API calls
- Store service account JSON securely
- Never commit credentials to version control

---

## Troubleshooting

### Issue: Firebase not initialized

**Error:** `Failed to initialize Firebase Admin SDK`

**Solution:**
1. Check that `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` is set
2. Verify the service account JSON file exists and is valid
3. Check file permissions

### Issue: Notification not received

**Possible Causes:**
1. FCM token not registered
2. Token is inactive
3. App is in foreground (needs `onMessage` handler)
4. Invalid FCM token
5. Firebase project not configured correctly

**Solution:**
1. Verify token is registered: `GET /api/v1/notifications/tokens`
2. Check token is active
3. Ensure foreground handler is set up
4. Verify Firebase configuration

### Issue: Permission denied

**Error:** `You do not have permission to send notifications`

**Solution:**
- Check user role (only admins can send bulk/role/society notifications)
- Verify authentication token is valid
- Check user has required permissions

### Issue: Invalid token

**Error:** `Invalid FCM token`

**Solution:**
1. Token may have expired or been revoked
2. Re-register the token from mobile app
3. Remove old token and register new one

---

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase Documentation](https://rnfirebase.io/)
- [FCM HTTP v1 API](https://firebase.google.com/docs/cloud-messaging/migrate-v1)

---

## Support

For issues or questions, please refer to:
- API Documentation: `/api-docs` (Swagger UI)
- Project README: `README.md`
