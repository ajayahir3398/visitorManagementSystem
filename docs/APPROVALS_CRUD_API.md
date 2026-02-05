# Approvals API Documentation

Complete documentation for Approvals API endpoints with React Native integration examples.

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
| GET | `/approvals/pending` | Get pending visitor entries waiting for approval | RESIDENT |
| POST | `/approvals/visitor-logs/:id/approve` | Approve a visitor entry | RESIDENT |
| POST | `/approvals/visitor-logs/:id/reject` | Reject a visitor entry | RESIDENT |

---

## 1. Get Pending Approvals

Get a list of pending visitor entries that are waiting for approval from the resident's units.

### Endpoint

```
GET /api/v1/approvals/pending
```

### Authorization

- **Required Role**: `RESIDENT` only
- **Note**: Returns only visitor logs for units where the resident is a member

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number for pagination |
| `limit` | integer | No | 10 | Number of items per page |

### Success Response (200)

```json
{
  "success": true,
  "message": "Pending approvals retrieved successfully",
  "data": {
    "visitorLogs": [
      {
        "id": 1,
        "societyId": 1,
        "gateId": 1,
        "visitorId": 1,
        "unitId": 5,
        "flatNo": null,
        "purpose": "Delivery",
        "entryTime": "2024-01-01T10:00:00.000Z",
        "exitTime": null,
        "status": "pending",
        "createdBy": 3,
        "createdAt": "2024-01-01T10:00:00.000Z",
        "visitor": {
          "id": 1,
          "name": "John Doe",
          "mobile": "1234567890",
          "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
        },
        "unit": {
          "id": 5,
          "unitNo": "A-101",
          "unitType": "2BHK"
        },
        "gate": {
          "id": 1,
          "name": "Main Gate"
        },
        "createdByUser": {
          "id": 3,
          "name": "Security Guard"
        },
        "_count": {
          "approvals": 0
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `visitorLogs` | array | Array of pending visitor log entries |
| `visitorLogs[].id` | integer | Visitor log ID |
| `visitorLogs[].status` | string | Status: "pending" |
| `visitorLogs[].visitor` | object | Visitor information (id, name, mobile, photoBase64) |
| `visitorLogs[].unit` | object | Unit information (id, unitNo, unitType) |
| `visitorLogs[].gate` | object | Gate information (id, name) |
| `visitorLogs[].purpose` | string | Purpose of visit |
| `visitorLogs[].entryTime` | string (ISO 8601) | Entry time |
| `visitorLogs[]._count.approvals` | integer | Number of approvals for this log |
| `pagination` | object | Pagination information |

### Empty Response (200) - No Units

If the resident is not a member of any units:

```json
{
  "success": true,
  "message": "Pending approvals retrieved successfully",
  "data": {
    "visitorLogs": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "pages": 0
    }
  }
}
```

### Error Responses

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Not a RESIDENT role
```json
{
  "success": false,
  "message": "Access denied. RESIDENT role required."
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to retrieve pending approvals",
  "error": "Error message"
}
```

---

## 2. Approve Visitor Entry

Approve a pending visitor entry. This updates the visitor log status to "approved" and creates or updates an approval record.

### Endpoint

```
POST /api/v1/approvals/visitor-logs/:id/approve
```

### Authorization

- **Required Role**: `RESIDENT` only
- **Note**: Resident must be a member of the unit associated with the visitor log

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Visitor log ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitor entry approved successfully",
  "data": {
    "visitorLog": {
      "id": 1,
      "societyId": 1,
      "gateId": 1,
      "visitorId": 1,
      "unitId": 5,
      "flatNo": null,
      "purpose": "Delivery",
      "entryTime": "2024-01-01T10:00:00.000Z",
      "exitTime": null,
      "status": "approved",
      "createdBy": 3,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "visitor": {
        "id": 1,
        "name": "John Doe",
        "mobile": "1234567890",
        "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
      },
      "unit": {
        "id": 5,
        "unitNo": "A-101",
        "unitType": "2BHK"
      },
      "gate": {
        "id": 1,
        "name": "Main Gate"
      },
      "approvals": [
        {
          "id": 1,
          "visitorLogId": 1,
          "residentId": 5,
          "decision": "approved",
          "decisionTime": "2024-01-01T10:05:00.000Z",
          "resident": {
            "id": 5,
            "name": "Jane Resident",
            "mobile": "9876543210"
          }
        }
      ]
    },
    "approval": {
      "id": 1,
      "visitorLogId": 1,
      "residentId": 5,
      "decision": "approved",
      "decisionTime": "2024-01-01T10:05:00.000Z",
      "resident": {
        "id": 5,
        "name": "Jane Resident",
        "mobile": "9876543210"
      }
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `visitorLog` | object | Updated visitor log with status "approved" |
| `visitorLog.status` | string | Status: "approved" |
| `visitorLog.approvals` | array | Array of approval records (ordered by decisionTime desc) |
| `approval` | object | The approval record created/updated by this request |

### Error Responses

**400 Bad Request** - Invalid visitor log ID
```json
{
  "success": false,
  "message": "Invalid visitor log ID"
}
```

**400 Bad Request** - Visitor already approved
```json
{
  "success": false,
  "message": "Visitor entry is already approved",
  "data": {
    "visitorLog": { /* visitor log object */ }
  }
}
```

**400 Bad Request** - Visitor already rejected
```json
{
  "success": false,
  "message": "Visitor entry is already rejected",
  "data": {
    "visitorLog": { /* visitor log object */ }
  }
}
```

**400 Bad Request** - Visitor already exited
```json
{
  "success": false,
  "message": "Visitor has already exited. Cannot approve/reject.",
  "data": {
    "visitorLog": { /* visitor log object */ }
  }
}
```

**400 Bad Request** - No valid unit or flat number
```json
{
  "success": false,
  "message": "Visitor log does not have a valid unit or flat number."
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Not a RESIDENT role
```json
{
  "success": false,
  "message": "Access denied. RESIDENT role required."
}
```

**403 Forbidden** - Not a member of the unit
```json
{
  "success": false,
  "message": "Access denied. You can only approve visitors for your units."
}
```

**403 Forbidden** - Visitor log belongs to different society
```json
{
  "success": false,
  "message": "Access denied. This visitor log does not belong to your society."
}
```

**404 Not Found** - Visitor log not found
```json
{
  "success": false,
  "message": "Visitor log not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to approve visitor entry",
  "error": "Error message"
}
```

---

## 3. Reject Visitor Entry

Reject a pending visitor entry. This updates the visitor log status to "rejected" and creates or updates an approval record.

### Endpoint

```
POST /api/v1/approvals/visitor-logs/:id/reject
```

### Authorization

- **Required Role**: `RESIDENT` only
- **Note**: Resident must be a member of the unit associated with the visitor log

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Visitor log ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitor entry rejected successfully",
  "data": {
    "visitorLog": {
      "id": 1,
      "societyId": 1,
      "gateId": 1,
      "visitorId": 1,
      "unitId": 5,
      "flatNo": null,
      "purpose": "Delivery",
      "entryTime": "2024-01-01T10:00:00.000Z",
      "exitTime": null,
      "status": "rejected",
      "createdBy": 3,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "visitor": {
        "id": 1,
        "name": "John Doe",
        "mobile": "1234567890",
        "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
      },
      "unit": {
        "id": 5,
        "unitNo": "A-101",
        "unitType": "2BHK"
      },
      "gate": {
        "id": 1,
        "name": "Main Gate"
      },
      "approvals": [
        {
          "id": 1,
          "visitorLogId": 1,
          "residentId": 5,
          "decision": "rejected",
          "decisionTime": "2024-01-01T10:05:00.000Z",
          "resident": {
            "id": 5,
            "name": "Jane Resident",
            "mobile": "9876543210"
          }
        }
      ]
    },
    "approval": {
      "id": 1,
      "visitorLogId": 1,
      "residentId": 5,
      "decision": "rejected",
      "decisionTime": "2024-01-01T10:05:00.000Z",
      "resident": {
        "id": 5,
        "name": "Jane Resident",
        "mobile": "9876543210"
      }
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `visitorLog` | object | Updated visitor log with status "rejected" |
| `visitorLog.status` | string | Status: "rejected" |
| `visitorLog.approvals` | array | Array of approval records (ordered by decisionTime desc) |
| `approval` | object | The approval record created/updated by this request |

### Error Responses

**400 Bad Request** - Invalid visitor log ID
```json
{
  "success": false,
  "message": "Invalid visitor log ID"
}
```

**400 Bad Request** - Visitor already approved
```json
{
  "success": false,
  "message": "Visitor entry is already approved",
  "data": {
    "visitorLog": { /* visitor log object */ }
  }
}
```

**400 Bad Request** - Visitor already rejected
```json
{
  "success": false,
  "message": "Visitor entry is already rejected",
  "data": {
    "visitorLog": { /* visitor log object */ }
  }
}
```

**400 Bad Request** - Visitor already exited
```json
{
  "success": false,
  "message": "Visitor has already exited. Cannot approve/reject.",
  "data": {
    "visitorLog": { /* visitor log object */ }
  }
}
```

**400 Bad Request** - No valid unit or flat number
```json
{
  "success": false,
  "message": "Visitor log does not have a valid unit or flat number."
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Not a RESIDENT role
```json
{
  "success": false,
  "message": "Access denied. RESIDENT role required."
}
```

**403 Forbidden** - Not a member of the unit
```json
{
  "success": false,
  "message": "Access denied. You can only reject visitors for your units."
}
```

**403 Forbidden** - Visitor log belongs to different society
```json
{
  "success": false,
  "message": "Access denied. This visitor log does not belong to your society."
}
```

**404 Not Found** - Visitor log not found
```json
{
  "success": false,
  "message": "Visitor log not found"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Failed to reject visitor entry",
  "error": "Error message"
}
```

---

## React Native Integration

### Setup

1. Install required dependencies (if not already installed):
```bash
npm install axios
# or
yarn add axios
```

2. Create an API service file for approvals:

### Approval Service (`services/approvalService.js`)

```javascript
import axios from 'axios';
import { getAccessToken } from './authService'; // Your auth service

const BASE_URL = 'http://localhost:1111/api/v1'; // Replace with your production URL

const approvalService = {
  /**
   * Get pending approvals
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} Response with visitorLogs and pagination
   */
  async getPendingApprovals(page = 1, limit = 10) {
    try {
      const token = await getAccessToken();
      const response = await axios.get(`${BASE_URL}/approvals/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page,
          limit,
        },
      });

      return response.data.data;
    } catch (error) {
      if (error.response) {
        // Server responded with error
        const { status, data } = error.response;
        if (status === 401) {
          // Handle unauthorized - redirect to login
          throw new Error('Session expired. Please login again.');
        } else if (status === 403) {
          throw new Error('Access denied. RESIDENT role required.');
        } else {
          throw new Error(data.message || 'Failed to fetch pending approvals');
        }
      } else {
        // Network error
        throw new Error('Network error. Please check your connection.');
      }
    }
  },

  /**
   * Approve a visitor entry
   * @param {number} visitorLogId - Visitor log ID
   * @returns {Promise<Object>} Response with updated visitorLog and approval
   */
  async approveVisitor(visitorLogId) {
    try {
      const token = await getAccessToken();
      const response = await axios.post(
        `${BASE_URL}/approvals/visitor-logs/${visitorLogId}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (status === 403) {
          throw new Error(data.message || 'Access denied. You can only approve visitors for your units.');
        } else if (status === 400) {
          throw new Error(data.message || 'Cannot approve this visitor entry.');
        } else if (status === 404) {
          throw new Error('Visitor log not found.');
        } else {
          throw new Error(data.message || 'Failed to approve visitor entry');
        }
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },

  /**
   * Reject a visitor entry
   * @param {number} visitorLogId - Visitor log ID
   * @returns {Promise<Object>} Response with updated visitorLog and approval
   */
  async rejectVisitor(visitorLogId) {
    try {
      const token = await getAccessToken();
      const response = await axios.post(
        `${BASE_URL}/approvals/visitor-logs/${visitorLogId}/reject`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (status === 403) {
          throw new Error(data.message || 'Access denied. You can only reject visitors for your units.');
        } else if (status === 400) {
          throw new Error(data.message || 'Cannot reject this visitor entry.');
        } else if (status === 404) {
          throw new Error('Visitor log not found.');
        } else {
          throw new Error(data.message || 'Failed to reject visitor entry');
        }
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },
};

export default approvalService;
```

### React Native Component Example

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import approvalService from '../services/approvalService';

const PendingApprovalsScreen = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await approvalService.getPendingApprovals(pageNum, 10);
      
      if (refresh || pageNum === 1) {
        setPendingApprovals(result.visitorLogs);
      } else {
        setPendingApprovals(prev => [...prev, ...result.visitorLogs]);
      }

      setPagination(result.pagination);
      setHasMore(result.pagination.page < result.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (visitorLogId) => {
    Alert.alert(
      'Approve Visitor',
      'Are you sure you want to approve this visitor entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await approvalService.approveVisitor(visitorLogId);
              Alert.alert('Success', 'Visitor entry approved successfully');
              // Refresh the list
              loadPendingApprovals(1, true);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (visitorLogId) => {
    Alert.alert(
      'Reject Visitor',
      'Are you sure you want to reject this visitor entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await approvalService.rejectVisitor(visitorLogId);
              Alert.alert('Success', 'Visitor entry rejected successfully');
              // Refresh the list
              loadPendingApprovals(1, true);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPendingApprovals(page + 1);
    }
  };

  const onRefresh = () => {
    loadPendingApprovals(1, true);
  };

  const renderApprovalItem = ({ item }) => (
    <View style={styles.approvalCard}>
      <View style={styles.visitorInfo}>
        <Text style={styles.visitorName}>{item.visitor.name}</Text>
        <Text style={styles.visitorMobile}>{item.visitor.mobile}</Text>
        <Text style={styles.unitInfo}>Unit: {item.unit.unitNo}</Text>
        <Text style={styles.purpose}>Purpose: {item.purpose || 'N/A'}</Text>
        <Text style={styles.entryTime}>
          Entry: {new Date(item.entryTime).toLocaleString()}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleApprove(item.id)}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleReject(item.id)}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && pendingApprovals.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingApprovals}
        renderItem={renderApprovalItem}
        keyExtractor={item => item.id.toString()}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No pending approvals</Text>
          </View>
        }
        ListFooterComponent={
          loading && pendingApprovals.length > 0 ? (
            <ActivityIndicator style={styles.footerLoader} />
          ) : null
        }
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvalCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visitorInfo: {
    marginBottom: 15,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  visitorMobile: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  unitInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  purpose: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  entryTime: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 50,
  },
  footerLoader: {
    marginVertical: 20,
  },
};

export default PendingApprovalsScreen;
```

### Using the Service in Your App

```javascript
import approvalService from './services/approvalService';

// Get pending approvals
const loadApprovals = async () => {
  try {
    const result = await approvalService.getPendingApprovals(1, 10);
    console.log('Pending approvals:', result.visitorLogs);
    console.log('Pagination:', result.pagination);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Approve a visitor
const approveVisitor = async (visitorLogId) => {
  try {
    const result = await approvalService.approveVisitor(visitorLogId);
    console.log('Approved:', result.visitorLog);
    console.log('Approval record:', result.approval);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Reject a visitor
const rejectVisitor = async (visitorLogId) => {
  try {
    const result = await approvalService.rejectVisitor(visitorLogId);
    console.log('Rejected:', result.visitorLog);
    console.log('Approval record:', result.approval);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

## Role-Based Access Summary

| Operation | SUPER_ADMIN | SOCIETY_ADMIN | SECURITY | RESIDENT |
|-----------|-------------|---------------|----------|----------|
| Get Pending Approvals | ❌ | ❌ | ❌ | ✅ (own units only) |
| Approve Visitor | ❌ | ❌ | ❌ | ✅ (own units only) |
| Reject Visitor | ❌ | ❌ | ❌ | ✅ (own units only) |

---

## Special Notes

### Unit Membership Requirement

- Residents can only approve/reject visitor entries for units where they are members
- The system checks unit membership via the `UnitMember` table
- If a resident is not a member of any units, the pending approvals list will be empty

### Visitor Log Status Flow

1. **pending** → Visitor entry created, waiting for approval
2. **approved** → Resident approved the entry
3. **rejected** → Resident rejected the entry
4. **exited** → Visitor has exited (cannot be approved/rejected)

### Approval Record Behavior

- If a resident approves/rejects a visitor log they previously acted on, the existing approval record is updated (not duplicated)
- The `decisionTime` is updated to the current time
- Multiple residents can approve/reject the same visitor log (each creates their own approval record)

### Status Validation

- Cannot approve/reject if status is already "approved"
- Cannot approve/reject if status is already "rejected"
- Cannot approve/reject if status is "exited"
- Only "pending" status can be approved or rejected

### Society Validation

- Residents can only see and act on visitor logs from their own society
- The system validates `req.user.society_id` matches `visitorLog.societyId`

### Backward Compatibility

- The system supports both `unitId` (new) and `flatNo` (legacy) fields
- If `unitId` is present, membership is checked via `UnitMember` table
- If only `flatNo` is present, membership is checked by matching unit numbers

### Pagination

- Default page size is 10 items
- Use `page` and `limit` query parameters to control pagination
- Response includes pagination metadata: `page`, `limit`, `total`, `pages`

### Empty States

- If resident has no unit memberships, returns empty array with pagination showing 0 total
- If no pending approvals exist, returns empty array with pagination metadata

### Real-time Updates

- After approving/rejecting, refresh the pending approvals list to see updated status
- Consider implementing WebSocket or polling for real-time updates in production

---

## Testing with Swagger UI

You can test all endpoints using Swagger UI:

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:1111/api-docs`
3. Navigate to **v1 - Approvals** section
4. Click "Authorize" and enter your Bearer token
5. Test each endpoint

---

## Next Steps

1. Set up authentication in your React Native app (see [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md))
2. Implement the approval service in your app
3. Create UI components for:
   - List of pending approvals
   - Approve/Reject buttons
   - Visitor details display
   - Pull-to-refresh functionality
   - Pagination/infinite scroll
4. Add proper error handling and loading states
5. Implement push notifications for new pending approvals (optional)
6. Add confirmation dialogs before approve/reject actions
7. Show approval history for each visitor log
8. Test with multiple scenarios:
   - Resident with multiple units
   - Resident with no units
   - Already approved/rejected entries
   - Exited visitor entries
   - Different society visitor logs

---

## Related Documentation

- **Visitor Logs API**: [VISITOR_LOGS_CRUD_API.md](./VISITOR_LOGS_CRUD_API.md) - Visitor logs are the entries that need approval
- **Units API**: [UNITS_CRUD_API.md](./UNITS_CRUD_API.md) - Units are associated with visitor logs
- **Visitors API**: [VISITORS_CRUD_API.md](./VISITORS_CRUD_API.md) - Visitor information is included in approval responses
- **Users API**: [USERS_CRUD_API.md](./USERS_CRUD_API.md) - Resident information is included in approval records
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

---

## Support

- **Swagger UI**: `http://localhost:1111/api-docs`
- **API Base URL**: `http://localhost:1111/api/v1`
- **Authentication Docs**: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

