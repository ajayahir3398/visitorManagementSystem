# Emergency API Documentation

Complete documentation for Emergency Requests and Responses API with React Native integration examples.

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

| Method | Endpoint                       | Description                   | Required Role                     |
| ------ | ------------------------------ | ----------------------------- | --------------------------------- |
| POST   | `/emergencies`                 | Raise an emergency            | RESIDENT, SECURITY, SOCIETY_ADMIN |
| GET    | `/emergencies`                 | Get emergencies (paginated)   | RESIDENT, SECURITY, SOCIETY_ADMIN |
| GET    | `/emergencies/:id`             | Get emergency timeline/detail | RESIDENT, SECURITY, SOCIETY_ADMIN |
| POST   | `/emergencies/:id/acknowledge` | Acknowledge an emergency      | SECURITY, SOCIETY_ADMIN           |
| POST   | `/emergencies/:id/respond`     | Add response action           | SECURITY, SOCIETY_ADMIN           |
| POST   | `/emergencies/:id/resolve`     | Resolve/close emergency       | SOCIETY_ADMIN                     |

---

## Emergency Status Flow

```
OPEN → ACKNOWLEDGED → RESOLVED
```

- **OPEN**: Emergency has been raised and is awaiting response
- **ACKNOWLEDGED**: Security/Admin has acknowledged the emergency
- **RESOLVED**: Emergency has been formally closed by Society Admin

---

## Emergency Types

| Type       | Description                               |
| ---------- | ----------------------------------------- |
| `Medical`  | Medical emergency (health issues, injury) |
| `Fire`     | Fire or smoke related emergency           |
| `Theft`    | Theft or burglary                         |
| `Security` | General security threat                   |
| `Other`    | Any other emergency type                  |

## Notification Types

| Type    | Description                  |
| ------- | ---------------------------- |
| `SIREN` | Trigger siren/alarm          |
| `CALL`  | Phone call notification      |
| `PUSH`  | Push notification to devices |
| `ALL`   | All notification methods     |

---

## 1. Raise Emergency

Raise a new emergency request in the society.

### Endpoint

```
POST /api/v1/emergencies
```

### Authorization

- **Required Role**: `RESIDENT`, `SECURITY`, `SOCIETY_ADMIN`

### Request Body

```json
{
  "emergencyType": "Medical",
  "notificationType": "ALL",
  "description": "Person unconscious in lobby",
  "location": "Flat A-302",
  "unitId": 12
}
```

### Field Descriptions

| Field              | Type    | Required | Description                                                        |
| ------------------ | ------- | -------- | ------------------------------------------------------------------ |
| `emergencyType`    | string  | Yes      | Type of emergency: `Medical`, `Fire`, `Theft`, `Security`, `Other` |
| `notificationType` | string  | Yes      | Notification method: `SIREN`, `CALL`, `PUSH`, `ALL`                |
| `description`      | string  | No       | Detailed description of the emergency                              |
| `location`         | string  | No       | Location within the society                                        |
| `unitId`           | integer | No       | Unit ID if emergency is related to a specific unit                 |

### Success Response (201)

```json
{
  "success": true,
  "message": "Emergency raised successfully",
  "data": {
    "id": 1,
    "societyId": 1,
    "raisedBy": 5,
    "unitId": 12,
    "emergencyType": "Medical",
    "notificationType": "ALL",
    "description": "Person unconscious in lobby",
    "location": "Flat A-302",
    "status": "OPEN",
    "priority": "HIGH",
    "raisedAt": "2024-01-15T10:30:00.000Z",
    "acknowledgedAt": null,
    "resolvedAt": null,
    "user": {
      "name": "John Doe",
      "mobile": "9876543210"
    },
    "unit": {
      "unitNo": "A-302"
    }
  }
}
```

### Error Responses

**400 Bad Request** - Missing required fields

```json
{
  "success": false,
  "message": "emergencyType and notificationType are required"
}
```

**401 Unauthorized**

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const raiseEmergency = async (emergencyData) => {
  try {
    const response = await apiClient.post('/emergencies', {
      emergencyType: emergencyData.emergencyType,
      notificationType: emergencyData.notificationType,
      description: emergencyData.description,
      location: emergencyData.location,
      unitId: emergencyData.unitId,
    });

    if (response.data.success) {
      console.log('Emergency raised:', response.data.data);
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert('Validation Error', error.response.data.message);
    } else if (error.response?.status === 401) {
      Alert.alert('Unauthorized', 'Please log in to raise an emergency');
    } else {
      Alert.alert('Error', 'Failed to raise emergency');
    }
    throw error;
  }
};

// Usage - Quick SOS Button
const handleSOSPress = async () => {
  try {
    const emergency = await raiseEmergency({
      emergencyType: 'Security',
      notificationType: 'ALL',
      description: 'SOS - Immediate help needed',
    });
    Alert.alert('Emergency Raised', 'Help is on the way!');
  } catch (error) {
    // Error already handled
  }
};

// Usage - Detailed Emergency Form
const handleEmergencySubmit = async (formData) => {
  try {
    const emergency = await raiseEmergency({
      emergencyType: formData.type,
      notificationType: formData.notification,
      description: formData.description,
      location: formData.location,
      unitId: formData.unitId,
    });
    Alert.alert('Success', 'Emergency has been reported');
    navigation.goBack();
  } catch (error) {
    // Error already handled
  }
};
```

---

## 2. Get Emergencies

Retrieve a paginated list of emergencies with optional filtering.

### Endpoint

```
GET /api/v1/emergencies
```

### Authorization

- **Required Role**: `RESIDENT`, `SECURITY`, `SOCIETY_ADMIN`
- **Note**: `RESIDENT` users can only see emergencies they raised

### Query Parameters

| Parameter | Type    | Default | Description                                          |
| --------- | ------- | ------- | ---------------------------------------------------- |
| `status`  | string  | -       | Filter by status: `OPEN`, `ACKNOWLEDGED`, `RESOLVED` |
| `page`    | integer | 1       | Page number                                          |
| `limit`   | integer | 10      | Items per page                                       |

### Example Request

```
GET /api/v1/emergencies?status=OPEN&page=1&limit=10
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "emergencies": [
      {
        "id": 1,
        "societyId": 1,
        "raisedBy": 5,
        "unitId": 12,
        "emergencyType": "Medical",
        "notificationType": "ALL",
        "description": "Person unconscious",
        "location": "Flat A-302",
        "status": "OPEN",
        "priority": "HIGH",
        "raisedAt": "2024-01-15T10:30:00.000Z",
        "acknowledgedAt": null,
        "resolvedAt": null,
        "user": {
          "name": "John Doe",
          "mobile": "9876543210"
        },
        "unit": {
          "unitNo": "A-302"
        },
        "_count": {
          "responses": 2
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "pages": 2
    }
  }
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { FlatList, View, Text, RefreshControl, TouchableOpacity } from 'react-native';

const useEmergencies = (filters = {}) => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  const fetchEmergencies = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: filters.limit || 10,
        ...(filters.status && { status: filters.status }),
      };

      const response = await apiClient.get('/emergencies', { params });

      if (response.data.success) {
        if (page === 1) {
          setEmergencies(response.data.data.emergencies);
        } else {
          setEmergencies((prev) => [...prev, ...response.data.data.emergencies]);
        }
        setPagination(response.data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch emergencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergencies(1);
  }, [filters.status]);

  return {
    emergencies,
    loading,
    pagination,
    refresh: () => fetchEmergencies(1),
    loadMore: () => {
      if (pagination && pagination.page < pagination.pages) {
        fetchEmergencies(pagination.page + 1);
      }
    },
  };
};

// Usage in Component
const EmergencyListScreen = () => {
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const { emergencies, loading, pagination, refresh, loadMore } = useEmergencies({
    status: statusFilter,
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return '#FF4444';
      case 'ACKNOWLEDGED':
        return '#FFAA00';
      case 'RESOLVED':
        return '#44AA44';
      default:
        return '#888888';
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Status Filter Tabs */}
      <View style={{ flexDirection: 'row', padding: 10 }}>
        {['OPEN', 'ACKNOWLEDGED', 'RESOLVED'].map((status) => (
          <TouchableOpacity
            key={status}
            onPress={() => setStatusFilter(status)}
            style={{
              flex: 1,
              padding: 10,
              backgroundColor: statusFilter === status ? '#007AFF' : '#EEE',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: statusFilter === status ? '#FFF' : '#333' }}>{status}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={emergencies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ padding: 15, borderBottomWidth: 1, borderColor: '#EEE' }}
            onPress={() => navigation.navigate('EmergencyDetail', { id: item.id })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: getStatusColor(item.status),
                  marginRight: 10,
                }}
              />
              <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.emergencyType}</Text>
            </View>
            <Text style={{ marginTop: 5 }}>{item.description}</Text>
            <Text style={{ color: '#666', marginTop: 5 }}>
              Raised by: {item.user.name} | {item.location || item.unit?.unitNo}
            </Text>
            <Text style={{ color: '#999', fontSize: 12 }}>
              {new Date(item.raisedAt).toLocaleString()}
            </Text>
            {item._count.responses > 0 && (
              <Text style={{ color: '#007AFF', marginTop: 5 }}>
                {item._count.responses} response(s)
              </Text>
            )}
          </TouchableOpacity>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text>No emergencies found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
```

---

## 3. Get Emergency Timeline/Detail

Retrieve detailed information about a specific emergency including all response actions.

### Endpoint

```
GET /api/v1/emergencies/:id
```

### Authorization

- **Required Role**: `RESIDENT`, `SECURITY`, `SOCIETY_ADMIN`
- **Note**: `RESIDENT` users can only view emergencies they raised

### Path Parameters

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Emergency ID |

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "societyId": 1,
    "raisedBy": 5,
    "unitId": 12,
    "emergencyType": "Medical",
    "notificationType": "ALL",
    "description": "Person unconscious in lobby",
    "location": "Flat A-302",
    "status": "ACKNOWLEDGED",
    "priority": "HIGH",
    "raisedAt": "2024-01-15T10:30:00.000Z",
    "acknowledgedAt": "2024-01-15T10:32:00.000Z",
    "resolvedAt": null,
    "user": {
      "name": "John Doe",
      "mobile": "9876543210"
    },
    "unit": {
      "unitNo": "A-302"
    },
    "responses": [
      {
        "id": 1,
        "emergencyId": 1,
        "responderId": 3,
        "responseAction": "Ambulance Called",
        "responseNotes": "108 contacted, ETA 10 mins",
        "responseTime": "2024-01-15T10:33:00.000Z",
        "responder": {
          "name": "Security Guard 1",
          "role": {
            "name": "SECURITY"
          }
        }
      },
      {
        "id": 2,
        "emergencyId": 1,
        "responderId": 2,
        "responseAction": "First Aid Administered",
        "responseNotes": "CPR started",
        "responseTime": "2024-01-15T10:35:00.000Z",
        "responder": {
          "name": "Admin User",
          "role": {
            "name": "SOCIETY_ADMIN"
          }
        }
      }
    ]
  }
}
```

### Error Responses

**403 Forbidden** - Resident trying to view another's emergency

```json
{
  "success": false,
  "message": "Access denied. You can only view emergencies you raised."
}
```

**403 Forbidden** - Emergency from another society

```json
{
  "success": false,
  "message": "Access denied. This emergency belongs to another society."
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Emergency request not found"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

const useEmergencyDetail = (emergencyId) => {
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEmergency = async () => {
    if (!emergencyId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/emergencies/${emergencyId}`);

      if (response.data.success) {
        setEmergency(response.data.data);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied');
      } else if (err.response?.status === 404) {
        setError('Emergency not found');
      } else {
        setError('Failed to load emergency details');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmergency();
  }, [emergencyId]);

  return { emergency, loading, error, refetch: fetchEmergency };
};

// Usage - Emergency Detail Screen with Timeline
const EmergencyDetailScreen = ({ route }) => {
  const { id } = route.params;
  const { emergency, loading, error, refetch } = useEmergencyDetail(id);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (error) return <Text style={{ padding: 20 }}>Error: {error}</Text>;
  if (!emergency) return <Text style={{ padding: 20 }}>Not found</Text>;

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      {/* Emergency Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          {emergency.emergencyType} Emergency
        </Text>
        <View
          style={{
            backgroundColor:
              emergency.status === 'OPEN'
                ? '#FF4444'
                : emergency.status === 'ACKNOWLEDGED'
                  ? '#FFAA00'
                  : '#44AA44',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 5,
            alignSelf: 'flex-start',
            marginTop: 10,
          }}
        >
          <Text style={{ color: '#FFF' }}>{emergency.status}</Text>
        </View>
      </View>

      {/* Emergency Details */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontWeight: 'bold' }}>Description:</Text>
        <Text>{emergency.description || 'No description'}</Text>

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Location:</Text>
        <Text>{emergency.location || emergency.unit?.unitNo || 'Not specified'}</Text>

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Raised by:</Text>
        <Text>
          {emergency.user.name} ({emergency.user.mobile})
        </Text>

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Raised at:</Text>
        <Text>{new Date(emergency.raisedAt).toLocaleString()}</Text>

        {emergency.acknowledgedAt && (
          <>
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Acknowledged at:</Text>
            <Text>{new Date(emergency.acknowledgedAt).toLocaleString()}</Text>
          </>
        )}

        {emergency.resolvedAt && (
          <>
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Resolved at:</Text>
            <Text>{new Date(emergency.resolvedAt).toLocaleString()}</Text>
          </>
        )}
      </View>

      {/* Response Timeline */}
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Response Timeline
        </Text>
        {emergency.responses.length === 0 ? (
          <Text style={{ color: '#999' }}>No responses yet</Text>
        ) : (
          emergency.responses.map((response, index) => (
            <View
              key={response.id}
              style={{
                borderLeftWidth: 2,
                borderLeftColor: '#007AFF',
                paddingLeft: 15,
                paddingBottom: 15,
                marginLeft: 5,
              }}
            >
              <View
                style={{
                  position: 'absolute',
                  left: -6,
                  top: 0,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#007AFF',
                }}
              />
              <Text style={{ fontWeight: 'bold' }}>{response.responseAction}</Text>
              <Text style={{ color: '#666', marginTop: 5 }}>{response.responseNotes}</Text>
              <Text style={{ color: '#999', fontSize: 12, marginTop: 5 }}>
                {response.responder.name} ({response.responder.role.name}) -
                {new Date(response.responseTime).toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};
```

---

## 4. Acknowledge Emergency

Acknowledge an open emergency to indicate responders are aware and taking action.

### Endpoint

```
POST /api/v1/emergencies/:id/acknowledge
```

### Authorization

- **Required Role**: `SECURITY`, `SOCIETY_ADMIN`

### Path Parameters

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Emergency ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Emergency acknowledged",
  "data": {
    "id": 1,
    "status": "ACKNOWLEDGED",
    "acknowledgedAt": "2024-01-15T10:32:00.000Z",
    ...
  }
}
```

### Error Responses

**400 Bad Request** - Invalid status

```json
{
  "success": false,
  "message": "Emergency is already ACKNOWLEDGED"
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Emergency request not found"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const acknowledgeEmergency = async (emergencyId) => {
  try {
    const response = await apiClient.post(`/emergencies/${emergencyId}/acknowledge`);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert('Error', error.response.data.message);
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Emergency not found');
    } else {
      Alert.alert('Error', 'Failed to acknowledge emergency');
    }
    throw error;
  }
};

// Usage
const handleAcknowledge = async (emergencyId) => {
  try {
    await acknowledgeEmergency(emergencyId);
    Alert.alert('Success', 'Emergency acknowledged');
    refetchEmergency(); // Refresh emergency data
  } catch (error) {
    // Error already handled
  }
};
```

---

## 5. Add Emergency Response

Log a response action for an emergency (e.g., ambulance called, first aid administered).

### Endpoint

```
POST /api/v1/emergencies/:id/respond
```

### Authorization

- **Required Role**: `SECURITY`, `SOCIETY_ADMIN`

### Path Parameters

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Emergency ID |

### Request Body

```json
{
  "responseAction": "Ambulance Called",
  "responseNotes": "108 contacted, ETA 10 minutes"
}
```

### Field Descriptions

| Field            | Type   | Required | Description                           |
| ---------------- | ------ | -------- | ------------------------------------- |
| `responseAction` | string | Yes      | Short description of the action taken |
| `responseNotes`  | string | No       | Additional notes or details           |

### Success Response (201)

```json
{
  "success": true,
  "message": "Response action logged successfully",
  "data": {
    "id": 1,
    "emergencyId": 1,
    "responderId": 3,
    "responseAction": "Ambulance Called",
    "responseNotes": "108 contacted, ETA 10 minutes",
    "responseTime": "2024-01-15T10:33:00.000Z"
  }
}
```

### Error Responses

**400 Bad Request** - Missing required field

```json
{
  "success": false,
  "message": "responseAction is required"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const addEmergencyResponse = async (emergencyId, responseData) => {
  try {
    const response = await apiClient.post(`/emergencies/${emergencyId}/respond`, {
      responseAction: responseData.action,
      responseNotes: responseData.notes,
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert('Validation Error', error.response.data.message);
    } else {
      Alert.alert('Error', 'Failed to log response action');
    }
    throw error;
  }
};

// Usage - Quick Action Buttons
const ResponseActionButtons = ({ emergencyId, onSuccess }) => {
  const quickActions = [
    { action: 'Ambulance Called', notes: 'Emergency medical services contacted' },
    { action: 'Fire Brigade Alerted', notes: 'Fire department contacted' },
    { action: 'First Aid Administered', notes: 'Basic first aid provided' },
    { action: 'Area Evacuated', notes: 'Residents moved to safety' },
    { action: 'Security Dispatched', notes: 'Security personnel on site' },
  ];

  const handleQuickAction = async (action) => {
    try {
      await addEmergencyResponse(emergencyId, {
        action: action.action,
        notes: action.notes,
      });
      Alert.alert('Success', 'Response action logged');
      onSuccess?.();
    } catch (error) {
      // Error already handled
    }
  };

  return (
    <View>
      {quickActions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={{
            padding: 15,
            backgroundColor: '#007AFF',
            marginVertical: 5,
            borderRadius: 5,
          }}
          onPress={() => handleQuickAction(action)}
        >
          <Text style={{ color: '#FFF', textAlign: 'center' }}>{action.action}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Usage - Custom Response Form
const handleCustomResponse = async (emergencyId, formData) => {
  try {
    await addEmergencyResponse(emergencyId, {
      action: formData.action,
      notes: formData.notes,
    });
    Alert.alert('Success', 'Response logged');
    navigation.goBack();
  } catch (error) {
    // Error already handled
  }
};
```

---

## 6. Resolve Emergency

Formally resolve and close an emergency. Only Society Admin can perform this action.

### Endpoint

```
POST /api/v1/emergencies/:id/resolve
```

### Authorization

- **Required Role**: `SOCIETY_ADMIN` only

### Path Parameters

| Parameter | Type    | Required | Description  |
| --------- | ------- | -------- | ------------ |
| `id`      | integer | Yes      | Emergency ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Emergency resolved and closed",
  "data": {
    "id": 1,
    "status": "RESOLVED",
    "resolvedAt": "2024-01-15T11:00:00.000Z",
    ...
  }
}
```

### Error Responses

**403 Forbidden** - Non-admin trying to resolve

```json
{
  "success": false,
  "message": "Access denied. Required role: SOCIETY_ADMIN"
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Emergency request not found"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const resolveEmergency = async (emergencyId) => {
  try {
    const response = await apiClient.post(`/emergencies/${emergencyId}/resolve`);

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'Only Society Admin can resolve emergencies');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Emergency not found');
    } else {
      Alert.alert('Error', 'Failed to resolve emergency');
    }
    throw error;
  }
};

// Usage with Confirmation
const handleResolve = (emergencyId) => {
  Alert.alert(
    'Resolve Emergency',
    'Are you sure you want to mark this emergency as resolved? This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Resolve',
        style: 'destructive',
        onPress: async () => {
          try {
            await resolveEmergency(emergencyId);
            Alert.alert('Success', 'Emergency has been resolved');
            navigation.goBack();
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

## Complete React Native Service Example

Here's a complete service file for all Emergency operations:

```javascript
// services/emergencyService.js
import apiClient from './authService';

export const emergencyService = {
  /**
   * Raise a new emergency
   */
  raise: async (data) => {
    const response = await apiClient.post('/emergencies', data);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },

  /**
   * Get emergencies with pagination
   */
  getAll: async (options = {}) => {
    const params = {
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.status && { status: options.status }),
    };

    const response = await apiClient.get('/emergencies', { params });
    if (response.data.success) {
      return {
        emergencies: response.data.data.emergencies,
        pagination: response.data.data.pagination,
      };
    }
    throw new Error(response.data.message);
  },

  /**
   * Get emergency detail with timeline
   */
  getById: async (emergencyId) => {
    const response = await apiClient.get(`/emergencies/${emergencyId}`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },

  /**
   * Acknowledge an emergency
   */
  acknowledge: async (emergencyId) => {
    const response = await apiClient.post(`/emergencies/${emergencyId}/acknowledge`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },

  /**
   * Add response action
   */
  addResponse: async (emergencyId, responseData) => {
    const response = await apiClient.post(`/emergencies/${emergencyId}/respond`, responseData);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },

  /**
   * Resolve emergency
   */
  resolve: async (emergencyId) => {
    const response = await apiClient.post(`/emergencies/${emergencyId}/resolve`);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message);
  },
};

export default emergencyService;
```

---

## Role-Based Access Summary

| Operation            | RESIDENT      | SECURITY     | SOCIETY_ADMIN | SUPER_ADMIN |
| -------------------- | ------------- | ------------ | ------------- | ----------- |
| Raise Emergency      | ✅            | ✅           | ✅            | ❌          |
| Get Emergencies      | ✅ (own only) | ✅ (society) | ✅ (society)  | ❌          |
| Get Emergency Detail | ✅ (own only) | ✅ (society) | ✅ (society)  | ❌          |
| Acknowledge          | ❌            | ✅           | ✅            | ❌          |
| Add Response         | ❌            | ✅           | ✅            | ❌          |
| Resolve              | ❌            | ❌           | ✅            | ❌          |

---

## Data Schemas

### EmergencyRequest

```typescript
interface EmergencyRequest {
  id: number;
  societyId: number;
  raisedBy: number;
  unitId?: number | null;
  emergencyType: 'Medical' | 'Fire' | 'Theft' | 'Security' | 'Other';
  notificationType: 'SIREN' | 'CALL' | 'PUSH' | 'ALL';
  description?: string | null;
  location?: string | null;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  priority: 'HIGH';
  raisedAt: string; // ISO 8601
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  user: {
    name: string;
    mobile: string;
  };
  unit?: {
    unitNo: string;
  } | null;
  responses?: EmergencyResponse[];
  _count?: {
    responses: number;
  };
}
```

### EmergencyResponse

```typescript
interface EmergencyResponse {
  id: number;
  emergencyId: number;
  responderId: number;
  responseAction: string;
  responseNotes?: string | null;
  responseTime: string; // ISO 8601
  responder: {
    name: string;
    role: {
      name: string;
    };
  };
}
```

---

## Testing with Swagger UI

You can test all endpoints using Swagger UI:

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:1111/api-docs`
3. Navigate to **v1 - Emergency** section
4. Click "Authorize" and enter your Bearer token
5. Test each endpoint

---

## Support

- **Swagger UI**: `http://localhost:1111/api-docs`
- **API Base URL**: `http://localhost:1111/api/v1`
- **Authentication Docs**: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)
