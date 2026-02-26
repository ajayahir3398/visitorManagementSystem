# Security Dashboard API Documentation

Complete documentation for Security Dashboard API endpoints with React Native integration examples.

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

## Overview

The Security Dashboard API provides comprehensive data for security guards to manage visitor entries efficiently. The dashboard is designed to be **simple, fast, and action-oriented**, focusing on what security guards need to do right now.

### Key Features

- ✅ **System Status** - Check if system is active, in grace period, or locked
- ✅ **Society & Gate Information** - Display society name and available gates
- ✅ **Today's Statistics** - Quick view of visitor counts, pending approvals, and inside premises
- ✅ **Pending Approvals** - List of visitors waiting for resident approval with waiting time
- ✅ **Active Visitors** - List of visitors currently inside the premises
- ✅ **Guard Information** - Current logged-in guard details

### Dashboard Layout (UI Reference)

The dashboard should display information in this priority order:

1. **Top Bar** - Society Name, Gate Name, Guard Name
2. **System Status Banner** - Shows warning if subscription expired/locked
3. **Primary Action Button** - "NEW VISITOR ENTRY" (big, full-width)
4. **Quick Stats Cards** - Today's numbers at a glance
5. **Pending Approvals List** - Critical items requiring attention
6. **Active Visitors List** - Visitors currently inside (with exit action)
7. **Pre-Approved Code Entry** - Optional (for future implementation)

---

## API Endpoints

| Method | Endpoint              | Description                 | Required Role |
| ------ | --------------------- | --------------------------- | ------------- |
| GET    | `/security/dashboard` | Get security dashboard data | SECURITY      |

---

## 1. Get Security Dashboard

Retrieve comprehensive dashboard data for security guards including system status, society info, gates, statistics, pending approvals, and active visitors.

### Endpoint

```
GET /api/v1/security/dashboard
```

### Authorization

- **Required Role**: `SECURITY` only
- **Note**: Security guard must be associated with a society

### Query Parameters

None

### Success Response (200)

```json
{
  "success": true,
  "message": "Security dashboard data retrieved successfully",
  "data": {
    "systemStatus": "ACTIVE",
    "systemStatusMessage": null,
    "society": {
      "id": 1,
      "name": "Green Valley Apartments",
      "type": "apartment",
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra"
    },
    "gates": [
      {
        "id": 1,
        "name": "Main Gate"
      },
      {
        "id": 2,
        "name": "Back Gate"
      }
    ],
    "guard": {
      "id": 5,
      "name": "Security Guard Name"
    },
    "stats": {
      "todayVisitors": 42,
      "pendingApprovals": 3,
      "insidePremises": 18
    },
    "pendingApprovals": [
      {
        "id": 1,
        "visitor": {
          "id": 1,
          "name": "Rahul",
          "mobile": "9876543210",
          "photoBase64": null
        },
        "unit": {
          "id": 1,
          "unitNo": "A-302",
          "unitType": "FLAT"
        },
        "gate": {
          "id": 1,
          "name": "Main Gate"
        },
        "waitTime": 15,
        "waitTimeBadge": "15m ago",
        "purpose": "Delivery",
        "createdAt": "2024-01-01T10:00:00.000Z"
      },
      {
        "id": 2,
        "visitor": {
          "id": 2,
          "name": "Swiggy",
          "mobile": "9876543211",
          "photoBase64": null
        },
        "unit": {
          "id": 2,
          "unitNo": "B-101",
          "unitType": "FLAT"
        },
        "gate": {
          "id": 1,
          "name": "Main Gate"
        },
        "waitTime": 45,
        "waitTimeBadge": "45m ago",
        "purpose": "Food Delivery",
        "createdAt": "2024-01-01T09:30:00.000Z"
      }
    ],
    "activeVisitors": [
      {
        "id": 3,
        "visitor": {
          "id": 3,
          "name": "Ramesh",
          "mobile": "9876543212",
          "photoBase64": null
        },
        "unit": {
          "id": 3,
          "unitNo": "A-201",
          "unitType": "FLAT"
        },
        "gate": {
          "id": 1,
          "name": "Main Gate"
        },
        "entryTime": "2024-01-01T11:00:00.000Z",
        "status": "approved"
      },
      {
        "id": 4,
        "visitor": {
          "id": 4,
          "name": "Amazon",
          "mobile": "9876543213",
          "photoBase64": null
        },
        "unit": {
          "id": 4,
          "unitNo": "B-405",
          "unitType": "FLAT"
        },
        "gate": {
          "id": 2,
          "name": "Back Gate"
        },
        "entryTime": "2024-01-01T11:30:00.000Z",
        "status": "approved"
      }
    ]
  }
}
```

### Response Field Descriptions

#### Root Level

| Field                 | Type           | Description                                                       |
| --------------------- | -------------- | ----------------------------------------------------------------- |
| `systemStatus`        | string         | System status: `ACTIVE`, `GRACE`, or `LOCKED`                     |
| `systemStatusMessage` | string \| null | Optional message shown when status is `GRACE` or `LOCKED`         |
| `society`             | object         | Society information                                               |
| `gates`               | array          | List of all gates in the society                                  |
| `guard`               | object         | Current logged-in guard information                               |
| `stats`               | object         | Today's statistics                                                |
| `pendingApprovals`    | array          | Top 10 pending approvals (most recent first)                      |
| `activeVisitors`      | array          | Top 10 active visitors currently inside (most recent entry first) |

#### System Status Values

- **`ACTIVE`** - System is fully operational (TRIAL or ACTIVE subscription)
- **`GRACE`** - Subscription expired but within grace period (warning shown)
- **`LOCKED`** - Subscription expired or suspended (system locked)

#### System Status Messages

- When `systemStatus` is `GRACE`: `"Subscription expired. Please inform society admin."`
- When `systemStatus` is `LOCKED`: `"Entry locked. Contact society admin."` or `"System suspended. Contact society admin."`
- When `systemStatus` is `ACTIVE`: `null`

#### Stats Object

| Field              | Type    | Description                                      |
| ------------------ | ------- | ------------------------------------------------ |
| `todayVisitors`    | integer | Total number of visitors logged today            |
| `pendingApprovals` | integer | Number of visitors waiting for resident approval |
| `insidePremises`   | integer | Number of visitors currently inside the premises |

#### Pending Approval Object

| Field           | Type              | Description                                                                   |
| --------------- | ----------------- | ----------------------------------------------------------------------------- |
| `id`            | integer           | Visitor log ID                                                                |
| `visitor`       | object            | Visitor information (id, name, mobile, photoBase64)                           |
| `unit`          | object \| null    | Unit information (id, unitNo, unitType)                                       |
| `gate`          | object            | Gate information (id, name)                                                   |
| `waitTime`      | integer           | Waiting time in minutes                                                       |
| `waitTimeBadge` | string            | Human-readable waiting time badge (e.g., "15m ago", "1h 30m ago", "Just now") |
| `purpose`       | string \| null    | Purpose of visit                                                              |
| `createdAt`     | string (ISO 8601) | When the entry was created                                                    |

#### Active Visitor Object

| Field       | Type                      | Description                                         |
| ----------- | ------------------------- | --------------------------------------------------- |
| `id`        | integer                   | Visitor log ID                                      |
| `visitor`   | object                    | Visitor information (id, name, mobile, photoBase64) |
| `unit`      | object \| null            | Unit information (id, unitNo, unitType)             |
| `gate`      | object                    | Gate information (id, name)                         |
| `entryTime` | string (ISO 8601) \| null | When the visitor entered                            |
| `status`    | string                    | Entry status: `pending`, `approved`, or `rejected`  |

### Error Responses

**401 Unauthorized** - No token provided or invalid token

```json
{
  "success": false,
  "message": "No token provided. Authorization header required."
}
```

**403 Forbidden** - SECURITY role required or security guard not associated with a society

```json
{
  "success": false,
  "message": "Security guard must be associated with a society"
}
```

**403 Forbidden** - Insufficient permissions

```json
{
  "success": false,
  "message": "Insufficient permissions. Required role: SECURITY"
}
```

**404 Not Found** - Society not found

```json
{
  "success": false,
  "message": "Society not found"
}
```

**500 Internal Server Error**

```json
{
  "success": false,
  "message": "Failed to retrieve security dashboard data",
  "error": "Error details"
}
```

---

## React Native Integration Examples

### Fetch Security Dashboard Data

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:1111/api/v1';

// Fetch dashboard data
const fetchSecurityDashboard = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    const response = await axios.get(`${API_BASE_URL}/security/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      const dashboardData = response.data.data;

      // Use the data in your component
      console.log('System Status:', dashboardData.systemStatus);
      console.log('Society:', dashboardData.society.name);
      console.log('Today Visitors:', dashboardData.stats.todayVisitors);
      console.log('Pending Approvals:', dashboardData.pendingApprovals.length);
      console.log('Active Visitors:', dashboardData.activeVisitors.length);

      return dashboardData;
    }
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data.message);
      // Handle specific error codes
      if (error.response.status === 401) {
        // Token expired, redirect to login
      } else if (error.response.status === 403) {
        // Insufficient permissions
      }
    } else {
      console.error('Network error:', error.message);
    }
    throw error;
  }
};
```

### React Native Component Example

```javascript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { fetchSecurityDashboard } from './api/securityAPI';

const SecurityDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await fetchSecurityDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    systemStatus,
    systemStatusMessage,
    society,
    gates,
    guard,
    stats,
    pendingApprovals,
    activeVisitors,
  } = dashboardData;

  return (
    <ScrollView style={styles.container}>
      {/* Top Bar - Society Name, Gate, Guard */}
      <View style={styles.topBar}>
        <Text style={styles.societyName}>{society.name}</Text>
        <Text style={styles.gateName}>{gates[0]?.name || 'Main Gate'}</Text>
        <Text style={styles.guardName}>{guard.name}</Text>
      </View>

      {/* System Status Banner */}
      {systemStatus !== 'ACTIVE' && systemStatusMessage && (
        <View
          style={[
            styles.statusBanner,
            systemStatus === 'LOCKED' ? styles.statusBannerLocked : styles.statusBannerGrace,
          ]}
        >
          <Text style={styles.statusBannerText}>{systemStatusMessage}</Text>
        </View>
      )}

      {/* Primary Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, systemStatus === 'LOCKED' && styles.actionButtonDisabled]}
          disabled={systemStatus === 'LOCKED'}
          onPress={() => navigation.navigate('NewVisitorEntry')}
        >
          <Text style={styles.actionButtonText}>➕ NEW VISITOR ENTRY</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.todayVisitors}</Text>
          <Text style={styles.statLabel}>Today Visitors</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.pendingApprovals}</Text>
          <Text style={styles.statLabel}>Pending Approval</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.insidePremises}</Text>
          <Text style={styles.statLabel}>Inside Premises</Text>
        </View>
      </View>

      {/* Pending Approvals List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Approvals</Text>
        {pendingApprovals.length === 0 ? (
          <Text style={styles.emptyText}>No pending approvals</Text>
        ) : (
          pendingApprovals.map((approval) => (
            <View key={approval.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>{approval.visitor.name}</Text>
                <Text style={styles.listItemUnit}>{approval.unit?.unitNo || 'N/A'}</Text>
              </View>
              <View style={styles.waitTimeBadge}>
                <Text style={styles.waitTimeText}>{approval.waitTimeBadge}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Active Visitors List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inside Premises</Text>
        {activeVisitors.length === 0 ? (
          <Text style={styles.emptyText}>No active visitors</Text>
        ) : (
          activeVisitors.map((visitor) => (
            <View key={visitor.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemName}>{visitor.visitor.name}</Text>
                <Text style={styles.listItemUnit}>{visitor.unit?.unitNo || 'N/A'}</Text>
              </View>
              <TouchableOpacity
                style={styles.exitButton}
                onPress={() => handleMarkExit(visitor.id)}
              >
                <Text style={styles.exitButtonText}>EXIT</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  societyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  gateName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  guardName: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  statusBanner: {
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  statusBannerGrace: {
    backgroundColor: '#fff3cd',
  },
  statusBannerLocked: {
    backgroundColor: '#f8d7da',
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionButtonContainer: {
    padding: 16,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listItemContent: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  listItemUnit: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  waitTimeBadge: {
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  waitTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  exitButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  exitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
    padding: 20,
  },
});

export default SecurityDashboard;
```

### Handle Mark Exit (using visitor logs API)

```javascript
import axios from 'axios';

const markVisitorExit = async (visitorLogId) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    const response = await axios.put(
      `${API_BASE_URL}/visitor-logs/${visitorLogId}/exit`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      // Refresh dashboard after exit
      await loadDashboard();
      return response.data.data.visitorLog;
    }
  } catch (error) {
    console.error('Error marking exit:', error.response?.data?.message || error.message);
    throw error;
  }
};
```

---

## Usage Guidelines

### System Status Handling

1. **ACTIVE** - All features enabled, show normal dashboard
2. **GRACE** - Show warning banner, allow entry but inform admin
3. **LOCKED** - Show error banner, disable "New Visitor Entry" button, allow exit operations

### Pending Approvals

- Display top 10 most recent pending approvals
- Show waiting time badge with color coding:
  - **Green**: Less than 15 minutes
  - **Yellow**: 15-30 minutes
  - **Red**: More than 30 minutes
- Tap to view full details or navigate to approval screen

### Active Visitors

- Display top 10 most recent entries
- Always enable EXIT button (even when system is locked)
- Sort by most recent entry time first

### Refresh Strategy

- Auto-refresh every 30-60 seconds (optional)
- Manual refresh button in header
- Refresh after actions (create entry, mark exit)

### Error Handling

- Handle 401 by redirecting to login
- Handle 403 by showing error message
- Handle network errors with retry mechanism
- Show user-friendly error messages

---

## Best Practices

1. **Performance**
   - Cache dashboard data locally
   - Only refresh when necessary
   - Use pagination for long lists (if implemented)

2. **User Experience**
   - Show loading states during API calls
   - Display empty states when lists are empty
   - Provide clear feedback for all actions

3. **Security**
   - Always validate tokens before API calls
   - Handle token expiration gracefully
   - Never expose sensitive data in logs

4. **Offline Support** (Future)
   - Cache dashboard data for offline viewing
   - Queue actions when offline
   - Sync when connection restored

---

## Related APIs

- [Visitor Logs API](./VISITOR_LOGS_CRUD_API.md) - Create entries, mark exits
- [Visitors API](./VISITORS_CRUD_API.md) - Search/add visitors
- [Pre-Approvals API](./PRE_APPROVALS_API.md) - Verify access codes
- [Approvals API](./APPROVALS_CRUD_API.md) - View approval details

---

## Support

For issues or questions, contact API support or refer to the main API documentation.
