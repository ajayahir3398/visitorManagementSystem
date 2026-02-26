# Violations API Documentation

Complete documentation for Violations API with React Native integration examples.

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

See [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md) for authentication setup.

---

## API Endpoints

| Method | Endpoint                 | Description             | Required Role           |
| ------ | ------------------------ | ----------------------- | ----------------------- |
| POST   | `/violations`            | Report a new violation  | SECURITY, SOCIETY_ADMIN |
| GET    | `/violations`            | Get all violations      | All Roles               |
| PUT    | `/violations/:id/status` | Update violation status | SOCIETY_ADMIN           |

---

## Violation Statuses

- `PENDING` - Reported but not yet reviewed
- `RESOLVED` - Issue fixed or penalty paid
- `DISMISSED` - Violation report rejected
- `PAID` - Penalty paid (if applicable)

---

## 1. Report Violation

Report a rule violation by a resident or unit.

### Endpoint

```
POST /api/v1/violations
```

### Authorization

- **Required Role**: `SECURITY`, `SOCIETY_ADMIN`

### Request Body

```json
{
  "ruleId": 5,
  "violatorUserId": 10,
  "violatorUnitId": 2,
  "description": "Playing loud music after allowed hours",
  "photoBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "penaltyAmount": 500.0
}
```

### Field Descriptions

| Field            | Type    | Required | Description                        |
| ---------------- | ------- | -------- | ---------------------------------- | -------------------------- |
| `ruleId`         | integer | Yes      | ID of the rule violated            |
| `violatorUserId` | integer | No       | User ID of the violator (if known) |
| `violatorUnitId` | number  | No\*     | Unit ID of violator                |
| `description`    | string  | No       | Details of violation               |
| `photoBase64`    | string  | No       | Base64 encoded proof image         |
| `penaltyAmount`  | number  | No       | Proposed penalty amount            | (defaults to rule penalty) |

### Success Response (201)

```json
{
  "success": true,
  "message": "Violation reported successfully",
  "data": {
    "violation": {
      "id": 1,
      "societyId": 1,
      "ruleId": 5,
      "violatorUserId": 10,
      "violatorUnitId": 12,
      "reportedByUserId": 2,
      "description": "Parked in No Parking zone",
      "status": "PENDING",
      "penaltyAmount": 500,
      "createdAt": "2024-02-28T10:00:00.000Z"
    }
  }
}
```

### Error Responses

**400 Bad Request** - Validation error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "msg": "Rule ID is required", "param": "ruleId" }]
}
```

**403 Forbidden**

```json
{
  "success": false,
  "message": "Access denied"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const reportViolation = async (data) => {
  try {
    const response = await apiClient.post('/violations', data);
    if (response.data.success) {
      return response.data.data.violation;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert('Error', error.response.data.message);
    } else {
      Alert.alert('Error', 'Failed to report violation');
    }
    throw error;
  }
};
```

---

## 2. Get All Violations

Retrieve a list of violations.

### Endpoint

```
GET /api/v1/violations
```

### Authorization

- **All Authenticated Users**

### Query Parameters

| Name     | Type    | Description                                    |
| -------- | ------- | ---------------------------------------------- |
| `status` | string  | Filter by status (`PENDING`, `RESOLVED`, etc.) |
| `unitId` | integer | Filter by specific unit                        |

### Success Response (200)

```json
{
  "success": true,
  "message": "Violations retrieved successfully",
  "data": {
    "violations": [
      {
        "id": 1,
        "ruleId": 5,
        "description": "No Parking",
        "status": "PENDING",
        "penaltyAmount": 500,
        "violatorUnitId": 12,
        "createdAt": "2024-02-28T10:00:00.000Z"
      }
    ]
  }
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';

const useViolations = (filters = {}) => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchViolations = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      const response = await apiClient.get('/violations', { params });
      if (response.data.success) {
        setViolations(response.data.data.violations);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();
  }, [JSON.stringify(filters)]);

  return { violations, loading, refetch: fetchViolations };
};
```

---

## 3. Update Violation Status

Update the status of a violation (e.g., mark as RESOLVED or PAID).

### Endpoint

```
PUT /api/v1/violations/:id/status
```

### Authorization

- **Required Role**: `SOCIETY_ADMIN`

### Request Body

```json
{
  "status": "RESOLVED",
  "penaltyAmount": 500.0
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Status updated successfully",
  "data": {
    "violation": {
      "id": 1,
      "status": "RESOLVED",
      "updatedAt": "2024-02-28T12:00:00.000Z"
    }
  }
}
```

### Error Responses

**404 Not Found**

```json
{
  "success": false,
  "message": "Violation not found"
}
```

### React Native Example

```javascript
const updateViolationStatus = async (id, status) => {
  try {
    const response = await apiClient.put(`/violations/${id}/status`, { status });
    return response.data;
  } catch (error) {
    Alert.alert('Error', 'Failed to update status');
    throw error;
  }
};
```

---

## Data Services Example

Here is a complete service file `src/services/violationService.ts`:

```typescript
import apiClient from './authService';

interface Violation {
  id: number;
  ruleId: number;
  violatorUnitId: number;
  violatorUserId?: number;
  description?: string;
  photoBase64?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED' | 'PAID';
  penaltyAmount: number;
  createdAt: string;
}

interface ReportViolationData {
  ruleId: number;
  violatorUnitId: number;
  violatorUserId?: number;
  description?: string;
  photoBase64?: string;
  penaltyAmount?: number;
}

export const violationService = {
  report: async (data: ReportViolationData) => {
    const response = await apiClient.post('/violations', data);
    return response.data.data;
  },

  getAll: async (filters?: { status?: string; unitId?: number }) => {
    const response = await apiClient.get('/violations', { params: filters });
    return response.data.data.violations;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await apiClient.put(`/violations/${id}/status`, { status });
    return response.data;
  },
};
```
