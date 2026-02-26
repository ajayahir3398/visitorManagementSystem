# How to Extend Trial Period

This guide explains how to extend trial periods for societies in the Visitor Management System.

## Overview

You can extend trial periods in two ways:

1. **By Subscription ID** - Extend a specific subscription
2. **By Society ID** - Extend the latest subscription for a society (recommended)

## API Endpoints

### 1. Extend by Society ID (Recommended)

**Endpoint**: `POST /api/v1/subscriptions/society/:societyId/extend`

**Access**: SUPER_ADMIN only

**Request Body**:

```json
{
  "additionalDays": 30
}
```

**Example**:

```bash
POST /api/v1/subscriptions/society/1/extend
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "additionalDays": 30
}
```

**Response**:

```json
{
  "success": true,
  "message": "Subscription extended by 30 days successfully",
  "data": {
    "subscription": {
      "id": 1,
      "societyId": 1,
      "status": "TRIAL",
      "startDate": "2024-01-01",
      "expiryDate": "2024-04-01",
      "plan": {
        "name": "TRIAL",
        "price": 0
      },
      "society": {
        "id": 1,
        "name": "Green Valley Apartments"
      }
    }
  }
}
```

### 2. Extend by Subscription ID

**Endpoint**: `POST /api/v1/subscriptions/:id/extend`

**Access**: SUPER_ADMIN only

**Example**:

```bash
POST /api/v1/subscriptions/5/extend
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "additionalDays": 15
}
```

## How It Works

### Extension Logic

1. **If subscription is NOT expired**:
   - Extends from the current expiry date
   - Example: Expires on Jan 30, extend 30 days → New expiry: Feb 29

2. **If subscription is EXPIRED** (LOCKED/GRACE):
   - Extends from today's date
   - Automatically reactivates subscription (changes status from LOCKED/GRACE to TRIAL or ACTIVE)
   - Example: Expired on Jan 15, extend 30 days today (Jan 20) → New expiry: Feb 19

### Status Updates

- **LOCKED** subscriptions → Reactivated to **TRIAL** (if TRIAL plan) or **ACTIVE** (if paid plan)
- **GRACE** subscriptions → Reactivated to **TRIAL** or **ACTIVE**
- **TRIAL/ACTIVE** subscriptions → Status remains the same, only expiry date extended

## View Subscription

Before extending, you can check the current subscription status:

**Endpoint**: `GET /api/v1/subscriptions/society/:societyId`

**Access**: SUPER_ADMIN, SOCIETY_ADMIN (own society only)

**Example**:

```bash
GET /api/v1/subscriptions/society/1
Authorization: Bearer <token>
```

**Response**:

```json
{
  "success": true,
  "message": "Subscription retrieved successfully",
  "data": {
    "subscription": {
      "id": 1,
      "status": "TRIAL",
      "expiryDate": "2024-03-01",
      "plan": {
        "name": "TRIAL"
      }
    }
  }
}
```

## Use Cases

### Case 1: Extend Active Trial

Society has 10 days left in trial, needs 30 more days:

```bash
POST /api/v1/subscriptions/society/1/extend
{
  "additionalDays": 30
}
```

Result: Trial extended by 30 days from current expiry date.

### Case 2: Reactivate Expired Trial

Society's trial expired 5 days ago, needs 30 more days:

```bash
POST /api/v1/subscriptions/society/1/extend
{
  "additionalDays": 30
}
```

Result:

- Subscription reactivated (status: LOCKED → TRIAL)
- New expiry: 30 days from today
- Society can immediately use the system again

### Case 3: Multiple Extensions

You can extend multiple times:

```bash
# First extension: +15 days
POST /api/v1/subscriptions/society/1/extend
{ "additionalDays": 15 }

# Later, extend again: +30 days
POST /api/v1/subscriptions/society/1/extend
{ "additionalDays": 30 }
```

Result: Total extension = 45 days from original expiry (or from today if expired).

## Validation

- `additionalDays` must be a positive integer (minimum: 1)
- Only SUPER_ADMIN can extend subscriptions
- Subscription must exist (returns 404 if not found)

## Error Responses

### Invalid Days

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "additionalDays must be a positive integer",
      "param": "additionalDays"
    }
  ]
}
```

### Subscription Not Found

```json
{
  "success": false,
  "message": "No subscription found for this society"
}
```

### Unauthorized

```json
{
  "success": false,
  "message": "Insufficient permissions. Required role: SUPER_ADMIN"
}
```

## Swagger Documentation

Full API documentation is available at:

- `http://localhost:1111/api-docs` (or your configured port)
- Look for **"v1 - Subscriptions"** section

## Notes

- Extending a subscription does NOT change the plan type (TRIAL remains TRIAL)
- Status is automatically recalculated after extension
- All extensions are logged in the database (expiryDate is updated)
- The system will continue to auto-update statuses daily via cron job
