# Subscription Management System

## Overview

The subscription management system automatically handles trial subscriptions, status updates, and access control for societies.

## Workflow

```
Super Admin Login
    ↓
Create Society
    ↓
Create Society Admin
    ↓
Auto-Assign TRIAL Plan (60 days)
    ↓
Share Login Credentials with Society Admin
```

## Subscription States

| State | Meaning | Access Allowed |
|-------|---------|----------------|
| **TRIAL** | Free trial active | ✅ Yes |
| **ACTIVE** | Paid plan running | ✅ Yes |
| **GRACE** | Expired but temporarily allowed (3 days) | ✅ Yes |
| **LOCKED** | Core features blocked | ❌ No |
| **SUSPENDED** | Manually blocked (non-payment / abuse) | ❌ No |

## Auto Status Update Logic

The system automatically updates subscription statuses based on expiry dates:

- **T-7 Days (Before Expiry)**: Status remains `ACTIVE` or `TRIAL`
- **T-0 Day (Expiry Day)**: Status changes to `GRACE`
- **T+3 Days (Grace Ends)**: Status changes to `LOCKED`

### Update Schedule

- **Daily Cron Job**: Runs at midnight (00:00) to update all subscription statuses
- **On-Demand**: Status is checked and updated when middleware runs
- **On Server Start**: Updates all expired subscriptions immediately

## Implementation Details

### 1. Auto-Assign TRIAL Plan

When a **Society Admin** is created with a `societyId`, the system automatically:

1. Checks if a TRIAL subscription plan exists (creates if not)
2. Creates a 60-day TRIAL subscription for the society
3. Sets start date to today
4. Sets expiry date to 60 days from today
5. Sets grace period to 3 days

**Location**: `controllers/v1/userController.js` - `createUser` function

### 2. Subscription Service

**File**: `services/subscriptionService.js`

Key functions:
- `getSubscription(societyId)` - Get subscription for a society
- `calculateSubscriptionStatus(subscription)` - Calculate status based on dates
- `updateSubscriptionStatus(subscription)` - Update subscription status
- `updateAllSubscriptionStatuses()` - Update all subscriptions (for cron)
- `createTrialSubscription(societyId, durationDays)` - Create trial subscription
- `isSubscriptionActive(subscription)` - Check if subscription allows access

### 3. Subscription Middleware

**File**: `middleware/subscription.js`

#### `checkSubscription`
- Blocks access if subscription is `LOCKED` or `SUSPENDED`
- Auto-updates subscription status before checking
- Skips check for `SUPER_ADMIN`
- Returns 403 with appropriate message if blocked

**Usage**:
```javascript
import { checkSubscription } from '../middleware/subscription.js';

router.post('/protected-route', authenticate, checkSubscription, controller);
```

#### `attachSubscription`
- Optional middleware that attaches subscription info to request
- Doesn't block access, just provides subscription data
- Useful for displaying subscription status in responses

### 4. Scheduled Updates

**File**: `utils/subscriptionCron.js`

- Uses `node-cron` to schedule daily updates at midnight
- Automatically started when server starts
- Also runs immediately on server start to update expired subscriptions

## API Usage Examples

### Create Society Admin (Auto-Assigns TRIAL)

```bash
POST /api/v1/users
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "1234567890",
  "password": "password123",
  "societyId": 1,
  "roleId": 2  // SOCIETY_ADMIN
}
```

**Response**: User created + TRIAL subscription automatically created

### Protect Routes with Subscription Check

```javascript
// routes/v1/visitorRoutes.js
import { authenticate } from '../../middleware/auth.js';
import { checkSubscription } from '../../middleware/subscription.js';

router.post(
  '/visitors',
  authenticate,
  checkSubscription, // Blocks if LOCKED/SUSPENDED
  createVisitor
);
```

### Check Subscription Status

```javascript
// In any controller
import { getSubscription, updateSubscriptionStatus } from '../services/subscriptionService.js';

const subscription = await getSubscription(societyId);
const updated = await updateSubscriptionStatus(subscription);

console.log(updated.status); // TRIAL, ACTIVE, GRACE, LOCKED, or SUSPENDED
```

## Manual Status Updates

### Update All Subscriptions (Admin)

```javascript
import { updateAllSubscriptionStatuses } from '../services/subscriptionService.js';

const result = await updateAllSubscriptionStatuses();
// Returns: { total: 10, updated: 3 }
```

### Suspend a Subscription

```javascript
await prisma.subscription.update({
  where: { id: subscriptionId },
  data: { status: 'SUSPENDED' }
});
```

**Note**: SUSPENDED subscriptions are not auto-updated by the cron job.

## Error Responses

### Subscription Expired (LOCKED)

```json
{
  "success": false,
  "message": "Your subscription has expired. Please renew to continue using the service.",
  "data": {
    "status": "LOCKED",
    "expiryDate": "2024-01-15T00:00:00.000Z"
  }
}
```

### Subscription Suspended

```json
{
  "success": false,
  "message": "Your subscription has been suspended. Please contact support.",
  "data": {
    "status": "SUSPENDED",
    "expiryDate": "2024-01-15T00:00:00.000Z"
  }
}
```

## Database Schema

### Subscription Model

```prisma
model Subscription {
  id          Int              @id @default(autoincrement())
  societyId   Int              @map("society_id")
  planId      Int              @map("plan_id")
  status      String           @db.VarChar(20) // TRIAL / ACTIVE / GRACE / LOCKED / SUSPENDED
  startDate   DateTime         @map("start_date") @db.Date
  expiryDate  DateTime?        @map("expiry_date") @db.Date
  graceDays   Int              @default(3) @map("grace_days")
  createdAt   DateTime         @default(now()) @map("created_at")
  society     Society          @relation(...)
  plan        SubscriptionPlan @relation(...)
}
```

## Testing

1. **Create Society Admin**: Should auto-create TRIAL subscription
2. **Check Status**: Verify status is `TRIAL`
3. **Test Expiry**: Manually set `expiryDate` to past date
4. **Run Update**: Call `updateSubscriptionStatus()` - should change to `GRACE` or `LOCKED`
5. **Test Middleware**: Try accessing protected route with expired subscription

## Notes

- TRIAL plan is created automatically in seed data
- Grace period is 3 days by default (configurable per subscription)
- SUSPENDED subscriptions require manual intervention
- SUPER_ADMIN bypasses all subscription checks
- Status updates happen automatically, no manual intervention needed

