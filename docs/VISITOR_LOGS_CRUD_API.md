# Visitor Logs CRUD Operations API Documentation

Complete documentation for Visitor Logs CRUD operations with React Native integration examples.

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
| POST | `/visitor-logs` | Create a new visitor entry | SECURITY |
| PUT | `/visitor-logs/:id/exit` | Mark visitor exit | SECURITY |
| GET | `/visitor-logs/active` | Get active entries (visitors currently inside) | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY |
| GET | `/visitor-logs` | Get all visitor logs (with pagination & filters) | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT |
| GET | `/visitor-logs/:id` | Get visitor log by ID | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT |

---

## 1. Create Visitor Entry

Create a new visitor entry log when a visitor enters the premises. This is typically done by security guards.

### Endpoint

```
POST /api/v1/visitor-logs
```

### Authorization

- **Required Role**: `SECURITY` only
- **Note**: Security guard must be associated with a society

### Request Body

```json
{
  "visitorId": 1,
  "gateId": 1,
  "unitId": 5,
  "purpose": "Delivery",
  "entryTime": "2024-01-01T10:00:00.000Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `visitorId` | integer | Yes | Visitor ID |
| `gateId` | integer | Yes | Gate ID where visitor entered |
| `unitId` | integer | Conditional | Unit ID (required if `flatNo` not provided) |
| `flatNo` | string | Conditional | Flat/Unit number (required if `unitId` not provided, for backward compatibility) |
| `purpose` | string | No | Purpose of visit |
| `entryTime` | string (ISO 8601) | No | Entry time (defaults to current time if not provided) |

**Note**: Either `unitId` or `flatNo` must be provided.

### Success Response (201)

```json
{
  "success": true,
  "message": "Visitor entry logged successfully",
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
      "status": "pending",
      "createdBy": 3,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "visitor": {
        "id": 1,
        "name": "John Doe",
        "mobile": "1234567890",
        "photoUrl": "https://example.com/photo.jpg"
      },
      "gate": {
        "id": 1,
        "name": "Main Gate"
      },
      "createdByUser": {
        "id": 3,
        "name": "Security Guard"
      },
      "society": {
        "id": 1,
        "name": "Green Valley Apartments"
      }
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
      "msg": "visitorId is required",
      "param": "visitorId",
      "location": "body"
    }
  ]
}
```

**400 Bad Request** - Missing unitId or flatNo
```json
{
  "success": false,
  "message": "Either unitId or flatNo is required"
}
```

**400 Bad Request** - Visitor already has active entry
```json
{
  "success": false,
  "message": "Visitor already has an active entry. Please mark exit first.",
  "data": {
    "visitorLog": {
      "id": 1,
      "entryTime": "2024-01-01T09:00:00.000Z",
      "status": "approved"
    }
  }
}
```

**403 Forbidden** - Security guard not associated with society
```json
{
  "success": false,
  "message": "Security guard must be associated with a society"
}
```

**403 Forbidden** - Gate doesn't belong to security's society
```json
{
  "success": false,
  "message": "Gate does not belong to your society"
}
```

**404 Not Found** - Visitor not found
```json
{
  "success": false,
  "message": "Visitor not found"
}
```

**404 Not Found** - Gate not found
```json
{
  "success": false,
  "message": "Gate not found"
}
```

**404 Not Found** - Unit not found
```json
{
  "success": false,
  "message": "Unit not found"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const createVisitorEntry = async (entryData) => {
  try {
    const payload = {
      visitorId: entryData.visitorId,
      gateId: entryData.gateId,
      purpose: entryData.purpose || null,
      ...(entryData.entryTime && { entryTime: entryData.entryTime }),
    };

    // Either unitId or flatNo must be provided
    if (entryData.unitId) {
      payload.unitId = entryData.unitId;
    } else if (entryData.flatNo) {
      payload.flatNo = entryData.flatNo;
    } else {
      throw new Error('Either unitId or flatNo is required');
    }

    const response = await apiClient.post('/visitor-logs', payload);

    if (response.data.success) {
      console.log('Visitor entry created:', response.data.data.visitorLog);
      return response.data.data.visitorLog;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      if (error.response.data.errors) {
        const errors = error.response.data.errors;
        Alert.alert('Validation Error', errors[0]?.msg || 'Invalid data');
      } else if (error.response.data.data?.visitorLog) {
        // Visitor already has active entry
        Alert.alert(
          'Active Entry Exists',
          error.response.data.message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'View Entry',
              onPress: () => {
                // Navigate to visitor log detail
                navigation.navigate('VisitorLogDetail', {
                  logId: error.response.data.data.visitorLog.id,
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', error.response.data.message);
      }
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', error.response.data.message);
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', error.response.data.message);
    } else {
      Alert.alert('Error', 'Failed to create visitor entry');
    }
    throw error;
  }
};

// Usage
const handleCreateEntry = async () => {
  try {
    const entry = await createVisitorEntry({
      visitorId: 1,
      gateId: 1,
      unitId: 5,
      purpose: 'Delivery',
      entryTime: new Date().toISOString(),
    });
    Alert.alert('Success', 'Visitor entry logged successfully');
    // Navigate or refresh list
  } catch (error) {
    // Error already handled in createVisitorEntry
  }
};
```

### React Native Form Example

```javascript
import { useState } from 'react';
import { View, TextInput, Button, Alert, ActivityIndicator, Picker } from 'react-native';
import apiClient from '../services/authService';

const CreateEntryScreen = ({ navigation, route }) => {
  const { visitor } = route.params; // Visitor selected from previous screen
  const [gateId, setGateId] = useState(null);
  const [unitId, setUnitId] = useState(null);
  const [flatNo, setFlatNo] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [gates, setGates] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    // Load gates and units
    loadGates();
    loadUnits();
  }, []);

  const loadGates = async () => {
    try {
      const response = await apiClient.get('/gates');
      if (response.data.success) {
        setGates(response.data.data.gates);
      }
    } catch (error) {
      console.error('Failed to load gates:', error);
    }
  };

  const loadUnits = async () => {
    try {
      const response = await apiClient.get('/units');
      if (response.data.success) {
        setUnits(response.data.data.units);
      }
    } catch (error) {
      console.error('Failed to load units:', error);
    }
  };

  const handleSubmit = async () => {
    if (!gateId) {
      Alert.alert('Error', 'Please select a gate');
      return;
    }

    if (!unitId && !flatNo.trim()) {
      Alert.alert('Error', 'Please select a unit or enter flat number');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        visitorId: visitor.id,
        gateId: parseInt(gateId),
        purpose: purpose.trim() || null,
        entryTime: new Date().toISOString(),
      };

      if (unitId) {
        payload.unitId = parseInt(unitId);
      } else {
        payload.flatNo = flatNo.trim();
      }

      const response = await apiClient.post('/visitor-logs', payload);

      if (response.data.success) {
        Alert.alert('Success', 'Visitor entry logged successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        if (error.response.data.data?.visitorLog) {
          // Active entry exists
          Alert.alert(
            'Active Entry',
            error.response.data.message,
            [
              { text: 'OK' },
              {
                text: 'View Entry',
                onPress: () => {
                  navigation.navigate('VisitorLogDetail', {
                    logId: error.response.data.data.visitorLog.id,
                  });
                },
              },
            ]
          );
        } else {
          Alert.alert('Error', error.response.data.message);
        }
      } else {
        Alert.alert('Error', 'Failed to create visitor entry');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Visitor: {visitor.name}
      </Text>

      <Text style={{ marginTop: 15, marginBottom: 5 }}>Gate *</Text>
      <Picker
        selectedValue={gateId}
        onValueChange={setGateId}
        enabled={!loading}
      >
        <Picker.Item label="Select Gate" value={null} />
        {gates.map((gate) => (
          <Picker.Item key={gate.id} label={gate.name} value={gate.id} />
        ))}
      </Picker>

      <Text style={{ marginTop: 15, marginBottom: 5 }}>Unit</Text>
      <Picker
        selectedValue={unitId}
        onValueChange={(value) => {
          setUnitId(value);
          if (value) setFlatNo(''); // Clear flatNo if unit selected
        }}
        enabled={!loading}
      >
        <Picker.Item label="Select Unit" value={null} />
        {units.map((unit) => (
          <Picker.Item key={unit.id} label={unit.unitNo} value={unit.id} />
        ))}
      </Picker>

      <Text style={{ marginTop: 15, marginBottom: 5 }}>OR Flat Number</Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
        placeholder="Enter flat number"
        value={flatNo}
        onChangeText={(text) => {
          setFlatNo(text);
          if (text) setUnitId(null); // Clear unitId if flatNo entered
        }}
        editable={!loading && !unitId}
      />

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
        placeholder="Purpose of visit (optional)"
        value={purpose}
        onChangeText={setPurpose}
        editable={!loading}
      />

      <Button
        title={loading ? 'Logging Entry...' : 'Log Entry'}
        onPress={handleSubmit}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
};
```

---

## 2. Mark Visitor Exit

Mark a visitor's exit when they leave the premises.

### Endpoint

```
PUT /api/v1/visitor-logs/:id/exit
```

### Authorization

- **Required Role**: `SECURITY` only
- **Note**: Security guard must be associated with a society

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Visitor Log ID |

### Request Body

All fields are optional.

```json
{
  "exitTime": "2024-01-01T12:00:00.000Z"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `exitTime` | string (ISO 8601) | No | Exit time (defaults to current time if not provided) |

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitor exit marked successfully",
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
      "exitTime": "2024-01-01T12:00:00.000Z",
      "status": "exited",
      "createdBy": 3,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "visitor": {
        "id": 1,
        "name": "John Doe",
        "mobile": "1234567890",
        "photoUrl": "https://example.com/photo.jpg"
      },
      "gate": {
        "id": 1,
        "name": "Main Gate"
      },
      "unit": {
        "id": 5,
        "unitNo": "A-302",
        "unitType": "FLAT"
      },
      "createdByUser": {
        "id": 3,
        "name": "Security Guard"
      },
      "society": {
        "id": 1,
        "name": "Green Valley Apartments"
      }
    }
  }
}
```

### Error Responses

**400 Bad Request** - Invalid visitor log ID
```json
{
  "success": false,
  "message": "Invalid visitor log ID"
}
```

**400 Bad Request** - Visitor already exited
```json
{
  "success": false,
  "message": "Visitor has already exited",
  "data": {
    "visitorLog": {
      "id": 1,
      "exitTime": "2024-01-01T12:00:00.000Z",
      "status": "exited"
    }
  }
}
```

**403 Forbidden** - Security guard not associated with society
```json
{
  "success": false,
  "message": "Security guard must be associated with a society"
}
```

**403 Forbidden** - Visitor log doesn't belong to security's society
```json
{
  "success": false,
  "message": "Access denied. This visitor log does not belong to your society."
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Visitor log not found"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const markVisitorExit = async (logId, exitTime = null) => {
  try {
    const payload = {};
    if (exitTime) {
      payload.exitTime = exitTime;
    }

    const response = await apiClient.put(`/visitor-logs/${logId}/exit`, payload);

    if (response.data.success) {
      console.log('Visitor exit marked:', response.data.data.visitorLog);
      return response.data.data.visitorLog;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert('Error', error.response.data.message);
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', error.response.data.message);
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Visitor log does not exist');
    } else {
      Alert.alert('Error', 'Failed to mark visitor exit');
    }
    throw error;
  }
};

// Usage
const handleMarkExit = async (logId) => {
  Alert.alert(
    'Mark Exit',
    'Are you sure the visitor has exited?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Mark Exit',
        onPress: async () => {
          try {
            await markVisitorExit(logId);
            Alert.alert('Success', 'Visitor exit marked successfully');
            // Refresh list
          } catch (error) {
            // Error already handled
          }
        },
      },
    ]
  );
};
```

---

## 3. Get Active Entries

Get all visitors who are currently inside the premises (have not exited yet).

### Endpoint

```
GET /api/v1/visitor-logs/active
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`
- **Note**: `SOCIETY_ADMIN` and `SECURITY` users can only see active entries from their own society

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `gateId` | integer | - | Filter by gate ID |

### Example Request

```
GET /api/v1/visitor-logs/active?page=1&limit=10&gateId=1
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Active entries retrieved successfully",
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
        "status": "approved",
        "createdBy": 3,
        "createdAt": "2024-01-01T10:00:00.000Z",
        "visitor": {
          "id": 1,
          "name": "John Doe",
          "mobile": "1234567890",
          "photoUrl": "https://example.com/photo.jpg"
        },
        "gate": {
          "id": 1,
          "name": "Main Gate"
        },
        "unit": {
          "id": 5,
          "unitNo": "A-302",
          "unitType": "FLAT"
        },
        "createdByUser": {
          "id": 3,
          "name": "Security Guard"
        }
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

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { FlatList, View, Text, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';

const useActiveEntries = (filters = {}) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  const fetchActiveEntries = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: filters.limit || 10,
        ...(filters.gateId && { gateId: filters.gateId }),
      };

      const response = await apiClient.get('/visitor-logs/active', { params });

      if (response.data.success) {
        if (page === 1) {
          setEntries(response.data.data.visitorLogs);
        } else {
          setEntries(prev => [...prev, ...response.data.data.visitorLogs]);
        }
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch active entries');
      console.error('Failed to fetch active entries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveEntries(1);
  }, [filters.gateId]);

  const loadMore = () => {
    if (!loading && pagination && pagination.page < pagination.pages) {
      fetchActiveEntries(pagination.page + 1);
    }
  };

  const refresh = () => {
    fetchActiveEntries(1);
  };

  return { entries, loading, error, pagination, loadMore, refresh };
};

// Usage in Component
const ActiveEntriesScreen = ({ navigation }) => {
  const { entries, loading, error, pagination, loadMore, refresh } = useActiveEntries({
    limit: 10,
  });

  const handleMarkExit = async (logId) => {
    Alert.alert(
      'Mark Exit',
      'Are you sure the visitor has exited?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Mark Exit',
          onPress: async () => {
            try {
              const response = await apiClient.put(`/visitor-logs/${logId}/exit`, {});
              if (response.data.success) {
                Alert.alert('Success', 'Visitor exit marked successfully');
                refresh(); // Refresh the list
              }
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to mark exit');
            }
          },
        },
      ]
    );
  };

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', padding: 15 }}>
        Active Entries ({pagination?.total || 0})
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ padding: 15, borderBottomWidth: 1 }}
            onPress={() => navigation.navigate('VisitorLogDetail', { logId: item.id })}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  {item.visitor.name}
                </Text>
                <Text>Mobile: {item.visitor.mobile}</Text>
                <Text>
                  Unit: {item.unit ? item.unit.unitNo : item.flatNo || 'N/A'}
                </Text>
                <Text>Gate: {item.gate.name}</Text>
                <Text>Status: {item.status}</Text>
                <Text style={{ color: 'gray', fontSize: 12 }}>
                  Entered: {new Date(item.entryTime).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  padding: 10,
                  backgroundColor: '#ff4444',
                  borderRadius: 5,
                  alignSelf: 'center',
                }}
                onPress={() => handleMarkExit(item.id)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Exit</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && pagination?.page > 1 ? (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={loading && pagination?.page === 1} onRefresh={refresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text>No active entries</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
```

---

## 4. Get All Visitor Logs

Retrieve a paginated list of visitor logs with optional filtering.

### Endpoint

```
GET /api/v1/visitor-logs
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`, `RESIDENT`
- **Note**: 
  - `SOCIETY_ADMIN` and `SECURITY` users can only see logs from their own society
  - `RESIDENT` users can only see logs for their units

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `status` | string | - | Filter by status: `"pending"`, `"approved"`, `"rejected"`, `"exited"` |
| `gateId` | integer | - | Filter by gate ID |
| `visitorId` | integer | - | Filter by visitor ID |
| `flatNo` | string | - | Filter by flat/unit number |
| `date` | string (YYYY-MM-DD) | - | Filter by date (e.g., "2024-01-01") |
| `search` | string | - | Search by visitor name, mobile, flat number, or purpose |

### Example Request

```
GET /api/v1/visitor-logs?page=1&limit=10&status=approved&date=2024-01-01&search=John
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitor logs retrieved successfully",
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
        "exitTime": "2024-01-01T12:00:00.000Z",
        "status": "exited",
        "createdBy": 3,
        "createdAt": "2024-01-01T10:00:00.000Z",
        "visitor": {
          "id": 1,
          "name": "John Doe",
          "mobile": "1234567890",
          "photoUrl": "https://example.com/photo.jpg"
        },
        "gate": {
          "id": 1,
          "name": "Main Gate"
        },
        "unit": {
          "id": 5,
          "unitNo": "A-302",
          "unitType": "FLAT"
        },
        "createdByUser": {
          "id": 3,
          "name": "Security Guard"
        },
        "society": {
          "id": 1,
          "name": "Green Valley Apartments"
        },
        "_count": {
          "approvals": 1
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

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { FlatList, View, Text, ActivityIndicator, RefreshControl, TextInput } from 'react-native';

const useVisitorLogs = (filters = {}) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: filters.limit || 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.gateId && { gateId: filters.gateId }),
        ...(filters.visitorId && { visitorId: filters.visitorId }),
        ...(filters.flatNo && { flatNo: filters.flatNo }),
        ...(filters.date && { date: filters.date }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await apiClient.get('/visitor-logs', { params });

      if (response.data.success) {
        if (page === 1) {
          setLogs(response.data.data.visitorLogs);
        } else {
          setLogs(prev => [...prev, ...response.data.data.visitorLogs]);
        }
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch visitor logs');
      console.error('Failed to fetch visitor logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [filters.status, filters.gateId, filters.date, filters.search]);

  const loadMore = () => {
    if (!loading && pagination && pagination.page < pagination.pages) {
      fetchLogs(pagination.page + 1);
    }
  };

  const refresh = () => {
    fetchLogs(1);
  };

  return { logs, loading, error, pagination, loadMore, refresh };
};

// Usage in Component
const VisitorLogsScreen = ({ navigation }) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { logs, loading, error, pagination, loadMore, refresh } = useVisitorLogs({
    status: statusFilter || undefined,
    search: searchQuery || undefined,
    limit: 10,
  });

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          margin: 15,
          borderRadius: 5,
        }}
        placeholder="Search..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ padding: 15, borderBottomWidth: 1 }}
            onPress={() => navigation.navigate('VisitorLogDetail', { logId: item.id })}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              {item.visitor.name}
            </Text>
            <Text>Unit: {item.unit ? item.unit.unitNo : item.flatNo || 'N/A'}</Text>
            <Text>Gate: {item.gate.name}</Text>
            <Text>Status: {item.status}</Text>
            <Text style={{ color: 'gray', fontSize: 12 }}>
              {new Date(item.entryTime).toLocaleString()}
              {item.exitTime && ` - ${new Date(item.exitTime).toLocaleString()}`}
            </Text>
          </TouchableOpacity>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && pagination?.page > 1 ? (
            <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={loading && pagination?.page === 1} onRefresh={refresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text>No visitor logs found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
```

---

## 5. Get Visitor Log by ID

Retrieve a specific visitor log by its ID.

### Endpoint

```
GET /api/v1/visitor-logs/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`, `RESIDENT`
- **Note**: 
  - `SOCIETY_ADMIN` and `SECURITY` users can only access logs from their own society
  - `RESIDENT` users can only access logs for their units

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Visitor Log ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitor log retrieved successfully",
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
      "exitTime": "2024-01-01T12:00:00.000Z",
      "status": "exited",
      "createdBy": 3,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "visitor": {
        "id": 1,
        "name": "John Doe",
        "mobile": "1234567890",
        "photoUrl": "https://example.com/photo.jpg"
      },
      "gate": {
        "id": 1,
        "name": "Main Gate"
      },
      "unit": {
        "id": 5,
        "unitNo": "A-302",
        "unitType": "FLAT"
      },
      "createdByUser": {
        "id": 3,
        "name": "Security Guard"
      },
      "society": {
        "id": 1,
        "name": "Green Valley Apartments"
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
    }
  }
}
```

### Error Responses

**400 Bad Request** - Invalid visitor log ID
```json
{
  "success": false,
  "message": "Invalid visitor log ID"
}
```

**403 Forbidden** - Access denied
```json
{
  "success": false,
  "message": "Access denied. This visitor log does not belong to your society."
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Visitor log not found"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Image, Alert } from 'react-native';

const useVisitorLog = (logId) => {
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLog = async () => {
    if (!logId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/visitor-logs/${logId}`);
      
      if (response.data.success) {
        setLog(response.data.data.visitorLog);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Visitor log not found');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to fetch visitor log');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
  }, [logId]);

  return { log, loading, error, refetch: fetchLog };
};

// Usage in Component
const VisitorLogDetailScreen = ({ route, navigation }) => {
  const { logId } = route.params;
  const { log, loading, error } = useVisitorLog(logId);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;
  if (!log) return <Text>Visitor log not found</Text>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#f44336';
      case 'pending': return '#FF9800';
      case 'exited': return '#2196F3';
      default: return '#757575';
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        {log.visitor.photoUrl && (
          <Image
            source={{ uri: log.visitor.photoUrl }}
            style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 10 }}
          />
        )}
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{log.visitor.name}</Text>
        <Text style={{ fontSize: 16, color: 'gray' }}>{log.visitor.mobile}</Text>
      </View>

      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Details</Text>
        <Text>Unit: {log.unit ? log.unit.unitNo : log.flatNo || 'N/A'}</Text>
        <Text>Gate: {log.gate.name}</Text>
        <Text>Purpose: {log.purpose || 'N/A'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <Text>Status: </Text>
          <View
            style={{
              backgroundColor: getStatusColor(log.status),
              paddingHorizontal: 10,
              paddingVertical: 2,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: 'white', textTransform: 'capitalize' }}>
              {log.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginBottom: 15 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Timing</Text>
        <Text>Entry Time: {new Date(log.entryTime).toLocaleString()}</Text>
        {log.exitTime && (
          <Text>Exit Time: {new Date(log.exitTime).toLocaleString()}</Text>
        )}
        {log.exitTime && (
          <Text>
            Duration: {Math.round((new Date(log.exitTime) - new Date(log.entryTime)) / 60000)} minutes
          </Text>
        )}
      </View>

      {log.approvals && log.approvals.length > 0 && (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Approvals ({log.approvals.length})
          </Text>
          {log.approvals.map((approval) => (
            <View
              key={approval.id}
              style={{
                padding: 10,
                backgroundColor: '#f5f5f5',
                borderRadius: 5,
                marginBottom: 5,
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>{approval.resident.name}</Text>
              <Text>
                Decision: {approval.decision} at {new Date(approval.decisionTime).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Log Info</Text>
        <Text>Created By: {log.createdByUser.name}</Text>
        <Text>Created At: {new Date(log.createdAt).toLocaleString()}</Text>
        <Text>Society: {log.society.name}</Text>
      </View>
    </ScrollView>
  );
};
```

---

## Complete React Native Service Example

Here's a complete service file for Visitor Logs operations:

```javascript
// services/visitorLogService.js
import apiClient from './authService';
import { Alert } from 'react-native';

export const visitorLogService = {
  /**
   * Create a new visitor entry
   */
  createEntry: async (visitorId, gateId, options = {}) => {
    try {
      const payload = {
        visitorId: parseInt(visitorId),
        gateId: parseInt(gateId),
        ...(options.unitId && { unitId: parseInt(options.unitId) }),
        ...(options.flatNo && { flatNo: options.flatNo }),
        ...(options.purpose && { purpose: options.purpose }),
        ...(options.entryTime && { entryTime: options.entryTime }),
      };

      const response = await apiClient.post('/visitor-logs', payload);

      if (response.data.success) {
        return response.data.data.visitorLog;
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'create entry');
      throw error;
    }
  },

  /**
   * Mark visitor exit
   */
  markExit: async (logId, exitTime = null) => {
    try {
      const payload = {};
      if (exitTime) {
        payload.exitTime = exitTime;
      }

      const response = await apiClient.put(`/visitor-logs/${logId}/exit`, payload);

      if (response.data.success) {
        return response.data.data.visitorLog;
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'mark exit');
      throw error;
    }
  },

  /**
   * Get active entries (visitors currently inside)
   */
  getActiveEntries: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = {
        page,
        limit,
        ...(filters.gateId && { gateId: filters.gateId }),
      };

      const response = await apiClient.get('/visitor-logs/active', { params });

      if (response.data.success) {
        return {
          logs: response.data.data.visitorLogs,
          pagination: response.data.data.pagination,
        };
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'fetch active entries');
      throw error;
    }
  },

  /**
   * Get all visitor logs with pagination and filters
   */
  getAll: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = {
        page,
        limit,
        ...(filters.status && { status: filters.status }),
        ...(filters.gateId && { gateId: filters.gateId }),
        ...(filters.visitorId && { visitorId: filters.visitorId }),
        ...(filters.flatNo && { flatNo: filters.flatNo }),
        ...(filters.date && { date: filters.date }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await apiClient.get('/visitor-logs', { params });

      if (response.data.success) {
        return {
          logs: response.data.data.visitorLogs,
          pagination: response.data.data.pagination,
        };
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'fetch');
      throw error;
    }
  },

  /**
   * Get visitor log by ID
   */
  getById: async (logId) => {
    try {
      const response = await apiClient.get(`/visitor-logs/${logId}`);

      if (response.data.success) {
        return response.data.data.visitorLog;
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'fetch');
      throw error;
    }
  },
};

/**
 * Handle API errors with user-friendly messages
 */
const handleError = (error, operation) => {
  if (!error.response) {
    Alert.alert('Network Error', 'Please check your internet connection');
    return;
  }

  const status = error.response.status;
  const data = error.response.data;

  switch (status) {
    case 400:
      if (data.errors) {
        const errorMsg = data.errors.map(e => e.msg).join('\n');
        Alert.alert('Validation Error', errorMsg);
      } else if (data.data?.visitorLog) {
        // Active entry exists or already exited
        Alert.alert('Notice', data.message);
      } else {
        Alert.alert('Error', data.message || 'Invalid request');
      }
      break;
    case 403:
      Alert.alert('Access Denied', data.message || 'You do not have permission to perform this action');
      break;
    case 404:
      Alert.alert('Not Found', data.message || 'Resource not found');
      break;
    case 500:
      Alert.alert('Server Error', 'An error occurred on the server. Please try again later.');
      break;
    default:
      Alert.alert('Error', data.message || `Failed to ${operation}`);
  }
};
```

### Usage Example

```javascript
import { visitorLogService } from '../services/visitorLogService';
import { useState, useEffect } from 'react';

const VisitorLogsScreen = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const result = await visitorLogService.getAll(1, 10, {
        status: 'approved',
        date: '2024-01-01',
      });
      setLogs(result.logs);
    } catch (error) {
      // Error already handled in service
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async () => {
    try {
      const entry = await visitorLogService.createEntry(1, 1, {
        unitId: 5,
        purpose: 'Delivery',
      });
      setLogs([entry, ...logs]);
    } catch (error) {
      // Error already handled
    }
  };

  const handleMarkExit = async (logId) => {
    try {
      await visitorLogService.markExit(logId);
      // Refresh list
      loadLogs();
    } catch (error) {
      // Error already handled
    }
  };

  // ... rest of component
};
```

---

## Role-Based Access Summary

| Operation | SUPER_ADMIN | SOCIETY_ADMIN | SECURITY | RESIDENT |
|-----------|-------------|---------------|----------|----------|
| Create Entry | ❌ | ❌ | ✅ (own society) | ❌ |
| Mark Exit | ❌ | ❌ | ✅ (own society) | ❌ |
| Get Active Entries | ✅ | ✅ (own society) | ✅ (own society) | ❌ |
| Get All Logs | ✅ | ✅ (own society) | ✅ (own society) | ✅ (own units) |
| Get Log by ID | ✅ | ✅ (own society) | ✅ (own society) | ✅ (own units) |

---

## Special Notes

### Visitor Entry Status

Visitor logs have the following statuses:
- **pending**: Entry created, awaiting resident approval
- **approved**: Entry approved by resident
- **rejected**: Entry rejected by resident
- **exited**: Visitor has left the premises

### Active Entries

An entry is considered "active" if:
- Status is not `"exited"`
- `exitTime` is `null`

Visitors cannot have multiple active entries. If a visitor tries to enter again while they have an active entry, the API will return an error.

### Unit vs Flat Number

- **unitId**: Preferred method - links to a Unit record
- **flatNo**: Legacy method - stored as string for backward compatibility
- Either `unitId` or `flatNo` must be provided when creating an entry
- If both are provided, `unitId` takes precedence

### Entry and Exit Times

- `entryTime`: Automatically set to current time if not provided
- `exitTime`: Automatically set to current time when marking exit if not provided
- Times should be in ISO 8601 format (e.g., `"2024-01-01T10:00:00.000Z"`)

### RESIDENT Access Restrictions

- `RESIDENT` users can only see visitor logs for units where they are members
- This is enforced by checking `UnitMember` records
- If a resident is not a member of any unit, they will see an empty list
- Access is checked both in list and detail views

### Security Guard Requirements

- Security guards must be associated with a society to create entries or mark exits
- Security guards can only create entries for gates in their society
- Security guards can only mark exits for logs in their society

### Search Functionality

The search parameter searches across:
- Visitor name (case-insensitive)
- Visitor mobile number
- Flat number (case-insensitive)
- Unit number (case-insensitive)
- Purpose (case-insensitive)

### Date Filtering

- Date filter uses `createdAt` field (when the log was created)
- Format: `YYYY-MM-DD` (e.g., `"2024-01-01"`)
- Filters logs created on that specific date

### Approvals

- Visitor logs can have multiple approvals (from different residents)
- Approvals are included in the detail view (`getVisitorLogById`)
- Approval count is included in list view (`_count.approvals`)
- See [Approvals API](./APPROVALS_CRUD_API.md) for managing approvals

---

## Testing with Swagger UI

You can test all endpoints using Swagger UI:

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:1111/api-docs`
3. Navigate to **v1 - Visitor Logs** section
4. Click "Authorize" and enter your Bearer token
5. Test each endpoint

---

## Next Steps

1. Set up authentication in your React Native app (see [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md))
2. Implement the visitor log service in your app
3. Create UI components for:
   - Creating visitor entries (security guard interface)
   - Viewing active entries
   - Marking visitor exits
   - Viewing visitor log history
   - Filtering and searching logs
4. Add proper error handling and loading states
5. Integrate with visitor selection (from Visitors API)
6. Integrate with gate selection (from Gates API)
7. Integrate with unit selection (from Units API)
8. Implement approval system (see Approvals API)
9. Add real-time updates for active entries (consider WebSockets)
10. Add notifications for residents when visitors arrive
11. Test with multiple scenarios (entry, exit, approvals, rejections)

---

## Related Documentation

- **Visitors API**: [VISITORS_CRUD_API.md](./VISITORS_CRUD_API.md)
- **Gates API**: [GATES_CRUD_API.md](./GATES_CRUD_API.md)
- **Units API**: [UNITS_CRUD_API.md](./UNITS_CRUD_API.md)
- **Approvals API**: Visitor logs are linked to approvals for resident approval workflow
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

---

## Support

- **Swagger UI**: `http://localhost:1111/api-docs`
- **API Base URL**: `http://localhost:1111/api/v1`
- **Authentication Docs**: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

