# Visitor Approval Push Notifications

This document describes the push notification implementation for the visitor approval workflow.

## Overview

The system sends push notifications in two scenarios:

1. **Security creates visitor entry** → Notifies all residents of the unit
2. **Resident approves/rejects** → Notifies the security user who created the entry

---

## Notification Flow

### 1. Security Creates Visitor Entry

**Trigger:** When a security user creates a visitor log entry via `POST /api/v1/visitor-logs`

**Recipients:** All residents of the unit (unit members)

**Notification Content:**
- **Title:** "New Visitor Request"
- **Body:** "{Visitor Name} is waiting at {Gate Name} for {Unit Number}"
- **Data Payload:**
  ```json
  {
    "screen": "visitor_log_detail",
    "visitorLogId": "123",
    "type": "visitor_request"
  }
  ```

**Implementation:** `controllers/v1/visitorLogController.js` → `createVisitorEntry()`

---

### 2. Resident Approves Visitor

**Trigger:** When a resident approves a visitor via `POST /api/v1/visitor-logs/:id/approve`

**Recipients:** Security user who created the visitor entry (`createdBy`)

**Notification Content:**
- **Title:** "Visitor Approved"
- **Body:** "{Resident Name} approved {Visitor Name} for {Unit Number}"
- **Data Payload:**
  ```json
  {
    "screen": "visitor_log_detail",
    "visitorLogId": "123",
    "type": "visitor_approved"
  }
  ```

**Implementation:** `controllers/v1/approvalController.js` → `approveVisitor()`

---

### 3. Resident Rejects Visitor

**Trigger:** When a resident rejects a visitor via `POST /api/v1/visitor-logs/:id/reject`

**Recipients:** Security user who created the visitor entry (`createdBy`)

**Notification Content:**
- **Title:** "Visitor Rejected"
- **Body:** "{Resident Name} rejected {Visitor Name} for {Unit Number}"
- **Data Payload:**
  ```json
  {
    "screen": "visitor_log_detail",
    "visitorLogId": "123",
    "type": "visitor_rejected"
  }
  ```

**Implementation:** `controllers/v1/approvalController.js` → `rejectVisitor()`

---

## Technical Implementation

### Helper Functions

**File:** `utils/notificationHelper.js`

- `sendNotificationToUser(userId, title, body, data)` - Send to single user
- `sendNotificationToUsers(userIds, title, body, data)` - Send to multiple users
- `sendNotificationToUnitResidents(unitId, title, body, data)` - Send to all unit residents

### Error Handling

- Notifications are sent in try-catch blocks
- Notification failures do not affect the main API response
- Errors are logged to console but don't break the workflow

### Data Payload Structure

All notifications include:
- `screen`: Navigation target screen name
- `visitorLogId`: ID of the visitor log (as string)
- `type`: Notification type for handling logic

---

## React Native Integration

### Handling Notifications

In your React Native app, handle these notification types:

```typescript
// In your notification handler
messaging().onMessage(async (remoteMessage) => {
  const { type, visitorLogId, screen } = remoteMessage.data;
  
  switch (type) {
    case 'visitor_request':
      // Show notification: "New visitor waiting"
      // Navigate to visitor log detail
      navigation.navigate(screen, { id: parseInt(visitorLogId) });
      break;
      
    case 'visitor_approved':
      // Show notification: "Visitor approved"
      // Navigate to visitor log detail
      navigation.navigate(screen, { id: parseInt(visitorLogId) });
      break;
      
    case 'visitor_rejected':
      // Show notification: "Visitor rejected"
      // Navigate to visitor log detail
      navigation.navigate(screen, { id: parseInt(visitorLogId) });
      break;
  }
});
```

---

## Testing

### Test Scenario 1: Security Creates Entry

1. Security user creates visitor entry
2. Check that all unit residents receive notification
3. Verify notification content is correct
4. Test navigation to visitor log detail

### Test Scenario 2: Resident Approves

1. Resident approves visitor entry
2. Check that security user receives notification
3. Verify notification content shows resident name and visitor name
4. Test navigation to visitor log detail

### Test Scenario 3: Resident Rejects

1. Resident rejects visitor entry
2. Check that security user receives notification
3. Verify notification content shows rejection
4. Test navigation to visitor log detail

---

## Requirements

- Users must have registered FCM tokens
- FCM tokens must be active
- Firebase Admin SDK must be configured
- Service account JSON must be set up

---

## Troubleshooting

### Notifications Not Received

1. **Check FCM tokens:** Verify users have registered tokens
   ```bash
   GET /api/v1/notifications/tokens?userId={userId}
   ```

2. **Check Firebase configuration:** Verify service account is set up
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
   ```

3. **Check logs:** Look for notification errors in server logs

4. **Verify permissions:** Ensure users have notification permissions enabled

### Notification Sent But Not Received

1. Check if user's FCM token is active
2. Verify Firebase project configuration
3. Check device notification settings
4. Test with Firebase Console directly

---

## Future Enhancements

- [ ] Add notification preferences (users can opt-out)
- [ ] Add notification history/logging
- [ ] Support for notification templates
- [ ] Batch notification sending optimization
- [ ] Notification retry mechanism
