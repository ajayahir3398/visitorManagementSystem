# Plans & Subscriptions API Documentation

Complete API documentation for Subscription Plans and Subscriptions management.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Subscription Plans API](#subscription-plans-api)
3. [Subscriptions API](#subscriptions-api)
4. [Workflow Examples](#workflow-examples)
5. [Error Handling](#error-handling)
6. [Authentication & Authorization](#authentication--authorization)

---

## Overview

### Subscription Plans

Subscription plans define the pricing, duration, and features available to societies. Plans can be:
- **TRIAL**: Free trial plan (60 days, ₹0)
- **MONTHLY**: Monthly subscription (₹800/month)
- **YEARLY**: Yearly subscription (₹8000/year)

### Subscriptions

Subscriptions link societies to plans and track their active status, expiry dates, and access permissions.

### Key Concepts

- **Plan Code**: Unique identifier (MONTHLY, YEARLY, TRIAL)
- **Billing Cycle**: MONTHLY or YEARLY
- **Price**: Stored in smallest unit (₹800 → 800)
- **Duration**: Number of months (1 for monthly, 12 for yearly)
- **Status**: TRIAL, ACTIVE, GRACE, LOCKED, SUSPENDED

---

## Subscription Plans API

### Base URL
```
/api/v1/plans
```

---

### 1. Get All Available Plans (Public)

Get all active subscription plans. **No authentication required.**

**Endpoint:** `GET /api/v1/plans`

**Access:** Public

**Response:**
```json
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": {
    "plans": [
      {
        "id": 1,
        "code": "TRIAL",
        "name": "Trial Plan",
        "price": 0,
        "durationMonths": 0,
        "billingCycle": "MONTHLY",
        "visitorLimit": null,
        "features": {
          "trial": true,
          "duration_days": 60,
          "unlimited_visitors": true
        }
      },
      {
        "id": 2,
        "code": "MONTHLY",
        "name": "Monthly Plan",
        "price": 800,
        "durationMonths": 1,
        "billingCycle": "MONTHLY",
        "visitorLimit": null,
        "features": {
          "unlimited_visitors": true
        }
      },
      {
        "id": 3,
        "code": "YEARLY",
        "name": "Yearly Plan",
        "price": 8000,
        "durationMonths": 12,
        "billingCycle": "YEARLY",
        "visitorLimit": null,
        "features": {
          "unlimited_visitors": true
        }
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:1111/api/v1/plans
```

---

### 2. Get Plan by ID (Public)

Get a specific subscription plan by ID.

**Endpoint:** `GET /api/v1/plans/:id`

**Access:** Public

**Parameters:**
- `id` (path, required): Plan ID

**Response:**
```json
{
  "success": true,
  "message": "Plan retrieved successfully",
  "data": {
    "plan": {
      "id": 2,
      "code": "MONTHLY",
      "name": "Monthly Plan",
      "price": 800,
      "durationMonths": 1,
      "billingCycle": "MONTHLY",
      "visitorLimit": null,
      "features": {
        "unlimited_visitors": true
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:1111/api/v1/plans/2
```

---

### 3. Create Plan (Super Admin Only)

Create a new subscription plan.

**Endpoint:** `POST /api/v1/plans`

**Access:** SUPER_ADMIN only

**Request Body:**
```json
{
  "code": "QUARTERLY",
  "name": "Quarterly Plan",
  "price": 2200,
  "durationMonths": 3,
  "billingCycle": "MONTHLY",
  "visitorLimit": null,
  "features": {
    "unlimited_visitors": true,
    "premium_support": true
  },
  "isActive": true
}
```

**Required Fields:**
- `code` (string, 1-20 chars): Unique plan code
- `name` (string, 1-50 chars): Plan name
- `price` (integer, >= 0): Price in smallest unit
- `durationMonths` (integer, >= 1): Duration in months
- `billingCycle` (string): "MONTHLY" or "YEARLY"

**Optional Fields:**
- `visitorLimit` (integer, >= 1): Visitor limit (null = unlimited)
- `features` (object): Plan features JSON
- `isActive` (boolean): Whether plan is active (default: true)

**Response:**
```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": {
    "plan": {
      "id": 4,
      "code": "QUARTERLY",
      "name": "Quarterly Plan",
      "price": 2200,
      "durationMonths": 3,
      "billingCycle": "MONTHLY",
      "visitorLimit": null,
      "features": {
        "unlimited_visitors": true,
        "premium_support": true
      },
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:1111/api/v1/plans \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "QUARTERLY",
    "name": "Quarterly Plan",
    "price": 2200,
    "durationMonths": 3,
    "billingCycle": "MONTHLY",
    "isActive": true
  }'
```

---

### 4. Update Plan (Super Admin Only)

Update an existing subscription plan.

**Endpoint:** `PUT /api/v1/plans/:id`

**Access:** SUPER_ADMIN only

**Parameters:**
- `id` (path, required): Plan ID

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Monthly Plan",
  "price": 900,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan updated successfully",
  "data": {
    "plan": {
      "id": 2,
      "code": "MONTHLY",
      "name": "Updated Monthly Plan",
      "price": 900,
      "durationMonths": 1,
      "billingCycle": "MONTHLY",
      "isActive": true
    }
  }
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:1111/api/v1/plans/2 \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 900
  }'
```

---

### 5. Toggle Plan Status (Super Admin Only)

Enable or disable a subscription plan.

**Endpoint:** `POST /api/v1/plans/:id/toggle`

**Access:** SUPER_ADMIN only

**Parameters:**
- `id` (path, required): Plan ID

**Response:**
```json
{
  "success": true,
  "message": "Plan deactivated successfully",
  "data": {
    "plan": {
      "id": 2,
      "code": "MONTHLY",
      "name": "Monthly Plan",
      "isActive": false
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:1111/api/v1/plans/2/toggle \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

---

### 6. Get All Plans (Super Admin Only)

Get all subscription plans including inactive ones.

**Endpoint:** `GET /api/v1/plans/all`

**Access:** SUPER_ADMIN only

**Response:**
```json
{
  "success": true,
  "message": "All plans retrieved successfully",
  "data": {
    "plans": [
      {
        "id": 1,
        "code": "TRIAL",
        "name": "Trial Plan",
        "price": 0,
        "durationMonths": 0,
        "billingCycle": "MONTHLY",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "_count": {
          "subscriptions": 5
        }
      }
    ]
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:1111/api/v1/plans/all \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

---

## Subscriptions API

### Base URL
```
/api/v1/subscriptions
```

---

### 1. Get Current Subscription (Society Admin)

Get the current subscription for the logged-in society admin's society.

**Endpoint:** `GET /api/v1/subscriptions/current`

**Access:** SOCIETY_ADMIN only

**Response:**
```json
{
  "success": true,
  "message": "Current subscription retrieved successfully",
  "data": {
    "subscription": {
      "id": 1,
      "societyId": 1,
      "planId": 2,
      "status": "ACTIVE",
      "startDate": "2024-01-01",
      "expiryDate": "2024-02-01",
      "graceDays": 3,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "plan": {
        "id": 2,
        "code": "MONTHLY",
        "name": "Monthly Plan",
        "price": 800,
        "durationMonths": 1,
        "billingCycle": "MONTHLY"
      },
      "society": {
        "id": 1,
        "name": "Green Valley Apartments"
      }
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:1111/api/v1/subscriptions/current \
  -H "Authorization: Bearer YOUR_SOCIETY_ADMIN_TOKEN"
```

---

### 2. Buy/Activate Subscription (Society Admin)

Purchase and activate a subscription plan for the society.

**Endpoint:** `POST /api/v1/subscriptions/buy`

**Access:** SOCIETY_ADMIN only

**Request Body:**
```json
{
  "planId": 2
}
```

**Required Fields:**
- `planId` (integer, >= 1): ID of the subscription plan to purchase

**Response:**
```json
{
  "success": true,
  "message": "Subscription activated successfully",
  "data": {
    "subscription": {
      "id": 1,
      "societyId": 1,
      "planId": 2,
      "status": "ACTIVE",
      "startDate": "2024-01-15",
      "expiryDate": "2024-02-15",
      "graceDays": 3,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "plan": {
        "id": 2,
        "code": "MONTHLY",
        "name": "Monthly Plan",
        "price": 800,
        "durationMonths": 1,
        "billingCycle": "MONTHLY"
      },
      "society": {
        "id": 1,
        "name": "Green Valley Apartments"
      }
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:1111/api/v1/subscriptions/buy \
  -H "Authorization: Bearer YOUR_SOCIETY_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": 2
  }'
```

**Note:** This is the MVP version without payment gateway integration. Razorpay can be integrated later.

---

### 3. Get Subscription by Society ID

Get subscription details for a specific society.

**Endpoint:** `GET /api/v1/subscriptions/society/:societyId`

**Access:** SUPER_ADMIN, SOCIETY_ADMIN (own society only)

**Parameters:**
- `societyId` (path, required): Society ID

**Response:**
```json
{
  "success": true,
  "message": "Subscription retrieved successfully",
  "data": {
    "subscription": {
      "id": 1,
      "societyId": 1,
      "planId": 2,
      "status": "ACTIVE",
      "startDate": "2024-01-01",
      "expiryDate": "2024-02-01",
      "graceDays": 3,
      "plan": {
        "id": 2,
        "code": "MONTHLY",
        "name": "Monthly Plan",
        "price": 800
      },
      "society": {
        "id": 1,
        "name": "Green Valley Apartments"
      }
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:1111/api/v1/subscriptions/society/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 4. Get All Subscriptions (Super Admin)

Get all subscriptions with optional filters and pagination.

**Endpoint:** `GET /api/v1/subscriptions`

**Access:** SUPER_ADMIN only

**Query Parameters:**
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 10): Items per page
- `status` (string, optional): Filter by status (TRIAL, ACTIVE, GRACE, LOCKED, SUSPENDED)
- `societyId` (integer, optional): Filter by society ID
- `planId` (integer, optional): Filter by plan ID

**Response:**
```json
{
  "success": true,
  "message": "Subscriptions retrieved successfully",
  "data": {
    "subscriptions": [
      {
        "id": 1,
        "societyId": 1,
        "planId": 2,
        "status": "ACTIVE",
        "startDate": "2024-01-01",
        "expiryDate": "2024-02-01",
        "plan": {
          "id": 2,
          "code": "MONTHLY",
          "name": "Monthly Plan"
        },
        "society": {
          "id": 1,
          "name": "Green Valley Apartments",
          "type": "apartment"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:1111/api/v1/subscriptions?page=1&limit=10&status=ACTIVE" \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN"
```

---

### 5. Extend Subscription by Subscription ID (Super Admin)

Extend a subscription period by adding additional days.

**Endpoint:** `POST /api/v1/subscriptions/:id/extend`

**Access:** SUPER_ADMIN only

**Parameters:**
- `id` (path, required): Subscription ID

**Request Body:**
```json
{
  "additionalDays": 30
}
```

**Required Fields:**
- `additionalDays` (integer, >= 1): Number of days to extend

**Response:**
```json
{
  "success": true,
  "message": "Subscription extended by 30 days successfully",
  "data": {
    "subscription": {
      "id": 1,
      "societyId": 1,
      "planId": 2,
      "status": "ACTIVE",
      "startDate": "2024-01-01",
      "expiryDate": "2024-03-02",
      "graceDays": 3
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:1111/api/v1/subscriptions/1/extend \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "additionalDays": 30
  }'
```

---

### 6. Extend Subscription by Society ID (Super Admin)

Extend a subscription period for a society by adding additional days.

**Endpoint:** `POST /api/v1/subscriptions/society/:societyId/extend`

**Access:** SUPER_ADMIN only

**Parameters:**
- `societyId` (path, required): Society ID

**Request Body:**
```json
{
  "additionalDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription extended by 30 days successfully",
  "data": {
    "subscription": {
      "id": 1,
      "societyId": 1,
      "planId": 2,
      "status": "ACTIVE",
      "expiryDate": "2024-03-02"
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:1111/api/v1/subscriptions/society/1/extend \
  -H "Authorization: Bearer YOUR_SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "additionalDays": 30
  }'
```

---

## Workflow Examples

### Example 1: Society Admin Purchasing a Monthly Plan

```bash
# Step 1: Get available plans (public, no auth needed)
curl -X GET http://localhost:1111/api/v1/plans

# Response shows MONTHLY plan with id: 2

# Step 2: Purchase the plan (requires society admin auth)
curl -X POST http://localhost:1111/api/v1/subscriptions/buy \
  -H "Authorization: Bearer SOCIETY_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planId": 2}'

# Step 3: Verify subscription
curl -X GET http://localhost:1111/api/v1/subscriptions/current \
  -H "Authorization: Bearer SOCIETY_ADMIN_TOKEN"
```

### Example 2: Super Admin Managing Plans

```bash
# Step 1: Create a new plan
curl -X POST http://localhost:1111/api/v1/plans \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "QUARTERLY",
    "name": "Quarterly Plan",
    "price": 2200,
    "durationMonths": 3,
    "billingCycle": "MONTHLY",
    "isActive": true
  }'

# Step 2: View all plans (including inactive)
curl -X GET http://localhost:1111/api/v1/plans/all \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"

# Step 3: Disable a plan
curl -X POST http://localhost:1111/api/v1/plans/4/toggle \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

### Example 3: Super Admin Extending Trial Period

```bash
# Extend trial by 30 days for a society
curl -X POST http://localhost:1111/api/v1/subscriptions/society/1/extend \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"additionalDays": 30}'
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "planId is required",
      "param": "planId",
      "location": "body"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided. Authorization header required."
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions. Required role: SUPER_ADMIN"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Plan not found"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "message": "Plan with this code already exists"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to retrieve plans",
  "error": "Error message details"
}
```

---

## Authentication & Authorization

### Public Endpoints (No Auth Required)
- `GET /api/v1/plans` - Get all active plans
- `GET /api/v1/plans/:id` - Get plan by ID

### Society Admin Endpoints
- `GET /api/v1/subscriptions/current` - Get current subscription
- `POST /api/v1/subscriptions/buy` - Buy/activate subscription

### Super Admin Endpoints
- `POST /api/v1/plans` - Create plan
- `PUT /api/v1/plans/:id` - Update plan
- `POST /api/v1/plans/:id/toggle` - Toggle plan status
- `GET /api/v1/plans/all` - Get all plans (including inactive)
- `GET /api/v1/subscriptions` - Get all subscriptions
- `GET /api/v1/subscriptions/society/:societyId` - Get subscription by society
- `POST /api/v1/subscriptions/:id/extend` - Extend subscription
- `POST /api/v1/subscriptions/society/:societyId/extend` - Extend subscription by society

### Authentication Header Format
```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Subscription Status Flow

```
TRIAL (60 days)
    ↓
ACTIVE (Paid plan)
    ↓
GRACE (3 days after expiry)
    ↓
LOCKED (No access)
```

### Status Meanings

| Status | Meaning | Access Allowed |
|--------|---------|----------------|
| **TRIAL** | Free trial active | ✅ Yes |
| **ACTIVE** | Paid plan running | ✅ Yes |
| **GRACE** | Expired but temporarily allowed (3 days) | ✅ Yes |
| **LOCKED** | Core features blocked | ❌ No |
| **SUSPENDED** | Manually blocked | ❌ No |

---

## Data Models

### SubscriptionPlan
```typescript
{
  id: number;
  code: string;              // MONTHLY, YEARLY, TRIAL
  name: string;
  price: number;             // In smallest unit (₹800 → 800)
  durationMonths: number;   // 1, 12, etc.
  billingCycle: string;     // MONTHLY, YEARLY
  visitorLimit: number | null;
  features: object | null;
  isActive: boolean;
  createdAt: string;
}
```

### Subscription
```typescript
{
  id: number;
  societyId: number;
  planId: number;
  status: string;           // TRIAL, ACTIVE, GRACE, LOCKED, SUSPENDED
  startDate: string;        // ISO date
  expiryDate: string | null; // ISO date
  graceDays: number;       // Default: 3
  createdAt: string;
  plan: SubscriptionPlan;
  society: {
    id: number;
    name: string;
  };
}
```

---

## Notes

1. **Price Storage**: Prices are stored as integers in the smallest unit (₹800 → 800). No decimal precision needed.

2. **Payment Gateway**: The `buy` endpoint is MVP-ready without payment gateway. Razorpay integration can be added later.

3. **Auto Status Updates**: Subscription statuses are automatically updated based on expiry dates via cron jobs and middleware.

4. **Plan Codes**: Must be unique. Common codes: TRIAL, MONTHLY, YEARLY.

5. **Visitor Limits**: `null` means unlimited visitors. Set a number to limit visitors.

6. **Features**: Stored as JSON object. Can include any custom features like `unlimited_visitors`, `premium_support`, etc.

---

## Related Documentation

- [Subscription System Overview](./SUBSCRIPTION_SYSTEM.md)
- [Migration Guide](./MIGRATION_GUIDE_SUBSCRIPTION_PLANS.md)
- [Extend Trial Guide](./EXTEND_TRIAL_GUIDE.md)

---

## Support

For issues or questions:
- Check Swagger UI: `http://localhost:YOUR_PORT/api-docs`
- Review error messages in responses
- Check server logs for detailed error information

