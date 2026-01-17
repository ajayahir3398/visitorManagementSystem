# Maintenance API Documentation

Complete documentation for Maintenance Plan and Payment API endpoints with React Native integration examples.

## Base URL

```
http://localhost:1111/api/v1
```

**Production**: Replace `localhost:1111` with your production server URL.

---

## Authentication

All endpoints require authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## Overview

The Maintenance module allow residents to view available maintenance plans for their society and pay their maintenance dues. Society admins can define maintenance plans (Monthly/Yearly) for the entire society.

### Key Features

- ✅ **Maintenance Plans**: Define MONTHLY or YEARLY amounts for the society.
- ✅ **Automated Billing**: A daily cron job generates **Upcoming Dues** (Temporary Bills) for residents.
- ✅ **Financial Year Logic**: Follows the April 1 – March 31 cycle; April allows both Monthly and Yearly payments.
- ✅ **Automatic Bill Generation**: Paying an upcoming due creates a final bill and payment record.
- ✅ **Payment History**: Residents can view their historical and currently paid bills.

---

## API Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| **Maintenance Plans** | | | |
| GET | `/maintenance-plans` | Get all maintenance plans | RESIDENT, SOCIETY_ADMIN |
| GET | `/maintenance-plans/:id` | Get plan by ID | RESIDENT, SOCIETY_ADMIN |
| POST | `/maintenance-plans` | Create a new plan | SOCIETY_ADMIN |
| PUT | `/maintenance-plans/:id` | Update plan (amount/active) | SOCIETY_ADMIN |
| DELETE | `/maintenance-plans/:id` | Deactivate plan | SOCIETY_ADMIN |
| **Maintenance Operations** | | | |
| POST | `/maintenance/custom-bill` | Create custom bill (Ad-hoc) | SOCIETY_ADMIN |
| GET | `/maintenance/upcoming` | Get upcoming & outstanding dues | RESIDENT |
| POST | `/maintenance/pay` | Pay bill | RESIDENT |
| GET | `/maintenance/my-bills` | Get payment history | RESIDENT |

---

## 1. Get Maintenance Plans

Retrieve available maintenance plans for your society.

### Endpoint
`GET /api/v1/maintenance-plans`

### Success Response (200)

```json
{
  "success": true,
  "message": "Maintenance plans retrieved successfully",
  "data": {
    "plans": [
      {
        "id": 1,
        "societyId": 5,
        "planType": "MONTHLY",
        "amount": 2500,
        "isActive": true
      },
      {
        "id": 2,
        "societyId": 5,
        "planType": "YEARLY",
        "amount": 28000,
        "isActive": true
      }
    ]
  }
}
```

---

## 2. Create Maintenance Plan

Define a new maintenance charge structure for the society.

### Endpoint
`POST /api/v1/maintenance-plans`

### Authorization
- `SOCIETY_ADMIN`

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `planType` | string | Yes | `MONTHLY` or `YEARLY` |
| `amount` | integer | Yes | Amount in ₹ (e.g., 2500) |

```json
{
  "planType": "MONTHLY",
  "amount": 2500
}
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Maintenance plan created successfully",
  "data": {
    "plan": {
      "id": 1,
      "societyId": 5,
      "planType": "MONTHLY",
      "amount": 2500,
      "isActive": true
    }
  }
}
```

---

## 3. Update Maintenance Plan

Modify the amount or status of an existing plan.

### Endpoint
`PUT /api/v1/maintenance-plans/:id`

### Authorization
- `SOCIETY_ADMIN`

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | integer | No | New amount in ₹ |
| `isActive` | boolean | No | Set `false` to deactivate |

```json
{
  "amount": 2600,
  "isActive": true
}
```

---

## 4. Create Custom/Ad-hoc Bill

Manually generate a bill for a specific unit (e.g., Penalty, Repair Charge).

### Endpoint
`POST /api/v1/maintenance/custom-bill`

### Authorization
- `SOCIETY_ADMIN`

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `unitId` | integer | Yes | ID of the target unit |
| `amount` | integer | Yes | Amount in ₹ |
| `dueDate` | string | Yes | ISO 8601 Date (e.g., "2025-05-15") |
| `description` | string | Yes | Reason for the charge |

```json
{
  "unitId": 10,
  "amount": 500,
  "dueDate": "2025-05-15",
  "description": "Penalty for late garbage disposal"
}
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Custom maintenance bill created successfully",
  "data": {
    "tempBill": {
      "id": 15,
      "period": "ADHOC-1714000000000",
      "amount": 500,
      "description": "Penalty for late garbage disposal",
      "unitId": 10
    }
  }
}
```

---

## 5. Get Upcoming Maintenance

Retrieve temporary bills (Upcoming) and unpaid final bills (Outstanding) for the resident's units.

### Endpoint
`GET /api/v1/maintenance/upcoming`

### Authorization
- `RESIDENT`

### Success Response (200)

```json
{
  "success": true,
  "message": "Upcoming and outstanding maintenance retrieved successfully",
  "data": {
    "upcoming": [
      {
        "id": 1,
        "unitId": 10,
        "billCycle": "MONTHLY",
        "period": "2025-04",
        "amount": 2500,
        "dueDate": "2025-04-10T00:00:00.000Z",
        "description": "Monthly Maintenance",
        "unit": { "unitNo": "A-101" }
      }
    ],
    "outstanding": [
      {
        "id": 5,
        "unitId": 10,
        "billCycle": "MONTHLY",
        "period": "2025-03",
        "amount": 2500,
        "dueDate": "2025-03-10T00:00:00.000Z",
        "status": "UNPAID",
        "description": "Monthly Maintenance",
        "unit": { "unitNo": "A-101" }
      }
    ]
  }
}
```

---

## 6. Pay Maintenance

Pay for a specific maintenance plan (Final Bill or Temp Bill).

### Endpoint
`POST /api/v1/maintenance/pay`

### Authorization
- `RESIDENT`

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `tempBillId` | integer | Yes | ID of the upcoming temporary bill to pay |
| `paymentMode` | string | Yes | `ONLINE`, `UPI`, `CASH` |
| `transactionId` | string | No | External Gateway ID |

```json
{
  "tempBillId": 1,
  "paymentMode": "UPI",
  "transactionId": "TXN_12345678"
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Maintenance paid successfully",
  "data": {
    "bill": {
      "id": 101,
      "status": "PAID",
      "amount": 2500
    },
    "payment": {
      "id": 55,
      "transactionId": "TXN_12345678",
      "status": "SUCCESS"
    }
  }
}
```

---

## 7. Get My Bills (History)

Retrieve payment history.

### Endpoint
`GET /api/v1/maintenance/my-bills`

### Authorization
- `RESIDENT`

### Query Parameters
- `page` (default 1)
- `limit` (default 10)
- `status` (optional: `PAID`, `UNPAID`)

### Success Response (200)

```json
{
  "success": true,
  "message": "My maintenance bills retrieved successfully",
  "data": {
    "bills": [
      {
        "id": 101,
        "period": "2025-04",
        "amount": 2500,
        "status": "PAID",
        "unit": { "unitNo": "A-101" },
        "payments": [
          {
            "amount": 2500,
            "paymentMode": "UPI",
            "paidAt": "2025-04-05T10:00:00Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## React Native Integration

### Maintenance Service (`services/maintenanceService.js`)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://YOUR_API_URL/api/v1';

const getHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const maintenanceService = {
    // 1. Get available society plans
    getPlans: async () => {
        try {
            const headers = await getHeaders();
            const response = await axios.get(`${BASE_URL}/maintenance-plans`, { headers });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // 2. Get upcoming and outstanding maintenance dues
    getUpcoming: async () => {
        try {
            const headers = await getHeaders();
            const response = await axios.get(`${BASE_URL}/maintenance/upcoming`, { headers });
            return response.data.data; // Returns { upcoming: [], outstanding: [] }
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // 3. Pay an upcoming bill
    payMaintenance: async (tempBillId, paymentMode, transactionId = null) => {
        try {
            const headers = await getHeaders();
            const payload = {
                tempBillId,
                paymentMode,
                transactionId
            };
            const response = await axios.post(`${BASE_URL}/maintenance/pay`, payload, { headers });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // 4. Get payment history
    getMyBills: async (page = 1, status = null) => {
        try {
            const headers = await getHeaders();
            const params = { page, limit: 10 };
            if (status) params.status = status;
            
            const response = await axios.get(`${BASE_URL}/maintenance/my-bills`, { 
                headers, 
                params 
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};
```
