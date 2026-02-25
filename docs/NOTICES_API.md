# Notices API Documentation

Complete documentation for Notices API with React Native integration examples.

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

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| POST | `/notices` | Create a new notice | SOCIETY_ADMIN |
| GET | `/notices` | Get all notices (scoped by audience) | All Roles |
| GET | `/notices/:id` | Get notice details | All Roles |
| POST | `/notices/:id/read` | Mark notice as read | All Roles |
| PUT | `/notices/:id` | Update notice | SOCIETY_ADMIN |
| DELETE | `/notices/:id` | Deactivate/Soft delete notice | SOCIETY_ADMIN |

---

## Notice Types & Enums

### Notice Types
- `General`
- `Maintenance`
- `Emergency`
- `Event`

### Priority Levels
- `High`
- `Medium`
- `Low`

### Audience Types
- `All` - Visible to everyone
- `Residents` - Visible to Owners and Tenants
- `Owners` - Visible only to Owners
- `Tenants` - Visible only to Tenants
- `Security` - Visible only to Security guards

---

## 1. Create Notice

Create a new digital notice for the society.

### Endpoint

```
POST /api/v1/notices
```

### Authorization

- **Required Role**: `SOCIETY_ADMIN`

### Request Body

```json
{
  "title": "Water Tank Cleaning",
  "description": "Water supply will be interrupted due to tank cleaning.",
  "noticeType": "Maintenance",
  "priority": "High",
  "audience": "Residents",
  "startDate": "2024-03-01T10:00:00.000Z",
  "endDate": "2024-03-01T18:00:00.000Z",
  "photoBase64": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Notice title (max 200 chars) |
| `description` | string | No | Detailed description |
| `noticeType` | string | Yes | `General`, `Maintenance`, `Emergency`, `Event` |
| `priority` | string | No | `High`, `Medium` (default), `Low` |
| `audience` | string | Yes | `All`, `Residents`, `Owners`, `Tenants`, `Security` |
| `startDate` | iso8601 | Yes | Start date/time of the notice |
| `endDate` | iso8601 | Yes | End date/time (notice is hidden after this) |
| `photoBase64` | string | No | Base64 encoded notice image |

### Success Response (201)

```json
{
  "success": true,
  "message": "Notice created successfully",
  "data": {
    "notice": {
      "id": 1,
      "societyId": 1,
      "title": "Water Tank Cleaning",
      "noticeType": "Maintenance",
      "priority": "High",
      "audience": "Residents",
      "startDate": "2024-03-01T10:00:00.000Z",
      "endDate": "2024-03-01T18:00:00.000Z",
      "isActive": true,
      "createdAt": "2024-02-28T09:00:00.000Z"
    }
  }
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const createNotice = async (noticeData) => {
  try {
    const response = await apiClient.post('/notices', noticeData);
    if (response.data.success) {
      return response.data.data.notice;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      // Handle validation errors
      Alert.alert('Validation Error', error.response.data.message);
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'Only Admins can create notices');
    } else {
      Alert.alert('Error', 'Failed to create notice');
    }
    throw error;
  }
};
```

---

## 2. Get All Notices

Retrieve all active notices for the signed-in user based on their role and society.

### Endpoint

```
GET /api/v1/notices
```

### Authorization

- **All Authenticated Users**
- **Note**: The backend automatically filters notices based on:
  1. User's Society
  2. Notice `audience` (e.g., Security guards won't see 'Residents' notices)
  3. Notice `startDate` & `endDate` (must be currently active)

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `noticeType` | string | Filter by type (`General`, `Maintenance`, etc.) |
| `priority` | string | Filter by priority (`High`, `Medium`, `Low`) |
| `isRead` | boolean | Filter by read status (`true` for already read, `false` for unread) |

### Success Response (200)

```json
{
  "success": true,
  "message": "Notices retrieved successfully",
  "data": {
    "notices": [
      {
        "id": 1,
        "title": "Water Tank Cleaning",
        "noticeType": "Maintenance",
        "priority": "High",
        "audience": "Residents",
        "startDate": "2024-03-01T10:00:00.000Z",
        "endDate": "2024-03-01T18:00:00.000Z",
        "isRead": false,
        "createdAt": "2024-02-28T09:00:00.000Z"
      }
    ]
  }
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { FlatList, View, Text } from 'react-native';

const useNotices = () => {
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/notices');
            if (response.data.success) {
                setNotices(response.data.data.notices);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotices();
    }, []);

    return { notices, loading, refetch: fetchNotices };
};
```

---

## 3. Get Notice By ID

Retrieve details for a single notice.

### Endpoint

```
GET /api/v1/notices/:id
```

### Authorization

- **All Authenticated Users** (must belong to same society)

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Water Tank Cleaning",
    "description": "Full description here...",
    "photoBase64": "data:image/jpeg;base64,/9j/4AAQ...",
    "isRead": true,
    "reads": [] // Full read history usually not sent to non-admins
  }
}
```

### React Native Example

```javascript
const getNotice = async (id) => {
    const response = await apiClient.get(`/notices/${id}`);
    return response.data.data;
};
```

---

## 4. Mark Notice as Read

Mark a notice as read for the current user. Used for tracking engagement.

### Endpoint

```
POST /api/v1/notices/:id/read
```

### Authorization

- **All Authenticated Users**

### Success Response (200)

```json
{
  "success": true,
  "message": "Notice marked as read"
}
```

### React Native Example

```javascript
const markAsRead = async (id) => {
    try {
        await apiClient.post(`/notices/${id}/read`);
    } catch (error) {
        console.error('Failed to mark read', error);
    }
};

// Usage: Call this when opening notice details
useEffect(() => {
    if (noticeId && !isRead) {
        markAsRead(noticeId);
    }
}, [noticeId]);
```

---

## 5. Update Notice

Update details of an existing notice.

### Endpoint

```
PUT /api/v1/notices/:id
```

### Authorization

- **Required Role**: `SOCIETY_ADMIN`

### Request Body

Include only fields to change.

```json
{
  "title": "Updated Title",
  "endDate": "2024-03-02T12:00:00.000Z"
}
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Notice updated successfully"
}
```

### React Native Example

```javascript
const updateNotice = async (id, data) => {
    const response = await apiClient.put(`/notices/${id}`, data);
    return response.data;
};
```

---

## 6. Deactivate Notice

Soft delete a notice (sets `isActive: false`).

### Endpoint

```
DELETE /api/v1/notices/:id
```

### Authorization

- **Required Role**: `SOCIETY_ADMIN`

### Success Response (200)

```json
{
  "success": true,
  "message": "Notice deactivated successfully"
}
```

### React Native Example

```javascript
const deleteNotice = async (id) => {
    const response = await apiClient.delete(`/notices/${id}`);
    return response.data;
};
```

---

## Role-Based Access Summary

| Operation | SOCIETY_ADMIN | RESIDENT | SECURITY |
|-----------|---------------|----------|----------|
| Create Notice | ✅ | ❌ | ❌ |
| View Notices | ✅ | ✅ | ✅ |
| Update Notice | ✅ | ❌ | ❌ |
| Delete Notice | ✅ | ❌ | ❌ |
| Mark Read | ✅ | ✅ | ✅ |

---

## Data Services Example

Here is a complete service file `src/services/noticeService.ts`:

```typescript
import apiClient from './authService';

export const noticeService = {
  create: async (data: any) => {
    const response = await apiClient.post('/notices', data);
    return response.data.data;
  },

  getAll: async () => {
    const response = await apiClient.get('/notices');
    return response.data.data.notices;
  },

  getById: async (id: number) => {
    const response = await apiClient.get(`/notices/${id}`);
    return response.data.data;
  },

  markRead: async (id: number) => {
    await apiClient.post(`/notices/${id}/read`);
  },

  update: async (id: number, data: any) => {
    const response = await apiClient.put(`/notices/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await apiClient.delete(`/notices/${id}`);
    return response.data;
  }
};
```
