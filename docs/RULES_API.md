# Rules API Documentation

Complete documentation for Rules API with React Native integration examples.

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

| Method | Endpoint     | Description                 | Required Role |
| ------ | ------------ | --------------------------- | ------------- |
| POST   | `/rules`     | Create a new rule           | SOCIETY_ADMIN |
| GET    | `/rules`     | Get all rules               | All Roles     |
| GET    | `/rules/:id` | Get rule details            | All Roles     |
| PUT    | `/rules/:id` | Update rule                 | SOCIETY_ADMIN |
| DELETE | `/rules/:id` | Deactivate/Soft delete rule | SOCIETY_ADMIN |

---

## Rule Priorities & Categories

### Priority Levels

- `High`
- `Medium`
- `Low`

### Common Categories

- `Parking`
- `General`
- `Noise`
- `Safety`
- `Amenities`

---

## 1. Create Rule

Define a new rule for the society.

### Endpoint

```
POST /api/v1/rules
```

### Authorization

- **Required Role**: `SOCIETY_ADMIN`

### Request Body

```json
{
  "title": "No Parking in Driveway",
  "description": "Vehicles must be parked in designated spots only.",
  "category": "Parking",
  "priority": "High",
  "violationPenalty": "Fine of ₹500"
}
```

### Field Descriptions

| Field              | Type   | Required | Description                       |
| ------------------ | ------ | -------- | --------------------------------- |
| `title`            | string | Yes      | Rule title (max 200 chars)        |
| `description`      | string | No       | Detailed description              |
| `category`         | string | Yes      | e.g. "Parking", "General"         |
| `priority`         | string | No       | `High`, `Medium` (default), `Low` |
| `violationPenalty` | string | No       | Text description of penalty       |

### Success Response (201)

```json
{
  "success": true,
  "message": "Rule created successfully",
  "data": {
    "rule": {
      "id": 1,
      "societyId": 1,
      "title": "No Parking in Driveway",
      "category": "Parking",
      "priority": "High",
      "isActive": true,
      "createdAt": "2024-02-28T09:00:00.000Z"
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
  "errors": [
    {
      "msg": "Title is required",
      "param": "title",
      "location": "body"
    }
  ]
}
```

**403 Forbidden** - Access denied

```json
{
  "success": false,
  "message": "Access denied. Only SOCIETY_ADMIN can perform this action."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const createRule = async (ruleData) => {
  try {
    const response = await apiClient.post('/rules', ruleData);
    if (response.data.success) {
      return response.data.data.rule;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert('Validation Error', error.response.data.message);
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'Only Admins can create rules');
    } else {
      Alert.alert('Error', 'Failed to create rule');
    }
    throw error;
  }
};
```

---

## 2. Get All Rules

Retrieve all active rules for the society.

### Endpoint

```
GET /api/v1/rules
```

### Authorization

- **All Authenticated Users**

### Query Parameters

| Name       | Type    | Description                             |
| ---------- | ------- | --------------------------------------- |
| `category` | string  | Filter by category                      |
| `isActive` | boolean | Filter by active status (default: true) |

### Success Response (200)

```json
{
  "success": true,
  "message": "Rules retrieved successfully",
  "data": {
    "rules": [
      {
        "id": 1,
        "title": "No Parking in Driveway",
        "category": "Parking",
        "priority": "High",
        "violationPenalty": "Fine of ₹500",
        "isActive": true
      }
    ]
  }
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';

const useRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/rules');
      if (response.data.success) {
        setRules(response.data.data.rules);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return { rules, loading, refetch: fetchRules };
};
```

---

## 3. Get Rule By ID

Retrieve details for a single rule.

### Endpoint

```
GET /api/v1/rules/:id
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "rule": {
      "id": 1,
      "title": "No Parking",
      "description": "Details...",
      "isActive": true
    }
  }
}
```

### Error Responses

**404 Not Found**

```json
{
  "success": false,
  "message": "Rule not found"
}
```

---

## 4. Update Rule

Update details of an existing rule.

### Endpoint

```
PUT /api/v1/rules/:id
```

### Authorization

- **Required Role**: `SOCIETY_ADMIN`

### Request Body

```json
{
  "title": "No Parking (Updated)",
  "priority": "Medium"
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Rule updated successfully",
  "data": {
    "rule": { "id": 1, "title": "No Parking (Updated)" }
  }
}
```

### React Native Example

```javascript
const updateRule = async (id, data) => {
  try {
    const response = await apiClient.put(`/rules/${id}`, data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      Alert.alert('Error', 'Rule not found');
    }
    throw error;
  }
};
```

---

## 5. Delete Rule

Soft delete a rule (sets `isActive: false`).

### Endpoint

```
DELETE /api/v1/rules/:id
```

### Authorization

- **Required Role**: `SOCIETY_ADMIN`

### Success Response (200)

```json
{
  "success": true,
  "message": "Rule deactivated successfully"
}
```

### React Native Example

```javascript
const deleteRule = async (id) => {
  const response = await apiClient.delete(`/rules/${id}`);
  return response.data;
};
```

---

## Data Services Example

Here is a complete service file `src/services/ruleService.ts`:

```typescript
import apiClient from './authService';

interface Rule {
  id: number;
  title: string;
  description?: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  violationPenalty?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateRuleData {
  title: string;
  description?: string;
  category: string;
  priority?: string;
  violationPenalty?: string;
}

export const ruleService = {
  create: async (data: CreateRuleData) => {
    const response = await apiClient.post('/rules', data);
    return response.data.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/rules');
    return response.data.data.rules;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/rules/${id}`);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateRuleData>) => {
    const response = await apiClient.put(`/rules/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/rules/${id}`);
    return response.data;
  },
};
```
