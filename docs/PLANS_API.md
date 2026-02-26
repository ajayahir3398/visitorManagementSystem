# Subscription Plans API Documentation

Complete documentation for Subscription Plans operations with React Native integration examples.

## Base URL

```
http://localhost:1111/api/v1
```

**Production**: Replace `localhost:1111` with your production server URL.

---

## Authentication

Some endpoints require authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## API Endpoints

| Method | Endpoint            | Description                       | Required Role |
| ------ | ------------------- | --------------------------------- | ------------- |
| GET    | `/plans`            | Get all active plans              | Public        |
| GET    | `/plans/:id`        | Get plan by ID                    | Public        |
| GET    | `/plans/all`        | Get all plans (active & inactive) | SUPER_ADMIN   |
| POST   | `/plans`            | Create a new plan                 | SUPER_ADMIN   |
| PUT    | `/plans/:id`        | Update a plan                     | SUPER_ADMIN   |
| POST   | `/plans/:id/toggle` | Toggle plan status                | SUPER_ADMIN   |
| DELETE | `/plans/:id`        | Delete a plan                     | SUPER_ADMIN   |

---

## 1. Get All Active Plans (Public)

Retrieve a list of all currently active subscription plans. Useful for displaying pricing to potential customers.

### Endpoint

```
GET /api/v1/plans
```

### Authorization

- **Public**: No authentication required.

### Success Response (200)

```json
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": {
    "plans": [
      {
        "id": 1,
        "code": "BASIC_MONTHLY",
        "name": "Basic Plan",
        "price": 499,
        "durationMonths": 1,
        "billingCycle": "MONTHLY",
        "visitorLimit": 500,
        "features": {
          "maxGuards": 2,
          "reports": false
        }
      },
      {
        "id": 2,
        "code": "PREMIUM_YEARLY",
        "name": "Premium Plan",
        "price": 4999,
        "durationMonths": 12,
        "billingCycle": "YEARLY",
        "visitorLimit": null,
        "features": {
          "maxGuards": 10,
          "reports": true
        }
      }
    ]
  }
}
```

### React Native Example

```javascript
import apiClient from '../services/apiClient'; // Or use fetch directly if public

const getPublicPlans = async () => {
  try {
    const response = await apiClient.get('/plans');

    if (response.data.success) {
      return response.data.data.plans;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    throw error;
  }
};
```

---

## 2. Get Plan by ID (Public)

Retrieve details of a specific plan.

### Endpoint

```
GET /api/v1/plans/:id
```

### Authorization

- **Public**: No authentication required.

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Plan ID     |

### Success Response (200)

```json
{
  "success": true,
  "message": "Plan retrieved successfully",
  "data": {
    "plan": {
      "id": 1,
      "code": "BASIC_MONTHLY",
      "name": "Basic Plan",
      "price": 499,
      "durationMonths": 1,
      "billingCycle": "MONTHLY",
      "visitorLimit": 500,
      "features": { "maxGuards": 2 },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

## 3. Create Plan (Super Admin)

Create a new subscription plan.

### Endpoint

```
POST /api/v1/plans
```

### Authorization

- **Required Role**: `SUPER_ADMIN`

### Request Body

```json
{
  "code": "ENTERPRISE_YEARLY",
  "name": "Enterprise Plan",
  "price": 9999,
  "durationMonths": 12,
  "billingCycle": "YEARLY",
  "visitorLimit": null,
  "features": {
    "maxGuards": 50,
    "prioritySupport": true
  },
  "isActive": true
}
```

### Field Descriptions

| Field            | Type    | Required | Description                               |
| ---------------- | ------- | -------- | ----------------------------------------- |
| `code`           | string  | Yes      | Unique plan code (1-20 chars)             |
| `name`           | string  | Yes      | Display name (1-50 chars)                 |
| `price`          | integer | Yes      | Price (>= 0)                              |
| `durationMonths` | integer | Yes      | Duration in months (>= 1)                 |
| `billingCycle`   | string  | Yes      | `MONTHLY` or `YEARLY`                     |
| `visitorLimit`   | integer | No       | Max visitors allowed (null for unlimited) |
| `features`       | object  | No       | JSON object for feature flags/limits      |
| `isActive`       | boolean | No       | Default: `true`                           |

### Success Response (201)

```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": { "plan": { ... } }
}
```

---

## 4. Update Plan (Super Admin)

Update an existing plan.

### Endpoint

```
PUT /api/v1/plans/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`

### Request Body

All fields allowed in Create Plan are optional here.

```json
{
  "price": 10999,
  "name": "Enterprise Plus"
}
```

---

## 5. Toggle Plan Status (Super Admin)

Enable or disable a plan.

### Endpoint

```
POST /api/v1/plans/:id/toggle
```

### Authorization

- **Required Role**: `SUPER_ADMIN`

### Success Response (200)

```json
{
  "success": true,
  "message": "Plan deactivated successfully",
  "data": {
    "plan": {
      "id": 1,
      "isActive": false,
      ...
    }
  }
}
```

### React Native Example (Admin Panel)

```javascript
const togglePlan = async (planId) => {
  try {
    const response = await apiClient.post(`/plans/${planId}/toggle`);
    return response.data.data.plan;
  } catch (error) {
    Alert.alert('Error', 'Failed to toggle plan status');
  }
};
```

---

## 6. Delete Plan (Super Admin)

Delete a plan. **Note**: Cannot delete a plan if it has linked subscriptions.

### Endpoint

```
DELETE /api/v1/plans/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`
