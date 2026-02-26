# Gates CRUD Operations API Documentation

Complete documentation for Gates CRUD operations with React Native integration examples.

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

| Method | Endpoint     | Description                               | Required Role                        |
| ------ | ------------ | ----------------------------------------- | ------------------------------------ |
| POST   | `/gates`     | Create a new gate                         | SUPER_ADMIN, SOCIETY_ADMIN           |
| GET    | `/gates`     | Get all gates (with pagination & filters) | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY |
| GET    | `/gates/:id` | Get gate by ID                            | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY |
| PUT    | `/gates/:id` | Update gate                               | SUPER_ADMIN, SOCIETY_ADMIN           |
| DELETE | `/gates/:id` | Delete gate                               | SUPER_ADMIN, SOCIETY_ADMIN           |

---

## 1. Create Gate

Create a new gate (entrance/exit point) for a society.

### Endpoint

```
POST /api/v1/gates
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` can only create gates for their own society

### Request Body

```json
{
  "name": "Main Gate",
  "societyId": 1
}
```

### Field Descriptions

| Field       | Type    | Required | Description                                                |
| ----------- | ------- | -------- | ---------------------------------------------------------- |
| `name`      | string  | Yes      | Gate name (e.g., "Main Gate", "Back Gate", "Service Gate") |
| `societyId` | integer | Yes      | Society ID where the gate belongs                          |

### Success Response (201)

```json
{
  "success": true,
  "message": "Gate created successfully",
  "data": {
    "gate": {
      "id": 1,
      "name": "Main Gate",
      "societyId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "society": {
        "id": 1,
        "name": "Green Valley Apartments",
        "type": "apartment"
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
      "msg": "Name is required",
      "param": "name",
      "location": "body"
    }
  ]
}
```

**400 Bad Request** - Duplicate gate name

```json
{
  "success": false,
  "message": "Gate with this name already exists for this society"
}
```

**403 Forbidden** - Insufficient permissions

```json
{
  "success": false,
  "message": "Access denied. You can only create gates for your own society."
}
```

**404 Not Found** - Society not found

```json
{
  "success": false,
  "message": "Society not found"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const createGate = async (gateData) => {
  try {
    const response = await apiClient.post('/gates', {
      name: gateData.name,
      societyId: gateData.societyId,
    });

    if (response.data.success) {
      console.log('Gate created:', response.data.data.gate);
      return response.data.data.gate;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      // Handle validation errors
      if (error.response.data.errors) {
        const errors = error.response.data.errors;
        errors.forEach((err) => {
          console.error(`${err.param}: ${err.msg}`);
        });
        Alert.alert('Validation Error', errors[0]?.msg || 'Invalid data');
      } else {
        Alert.alert('Error', error.response.data.message);
      }
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only create gates for your own society');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Society does not exist');
    } else {
      Alert.alert('Error', 'Failed to create gate');
    }
    throw error;
  }
};

// Usage
const handleCreateGate = async () => {
  try {
    const newGate = await createGate({
      name: 'Main Gate',
      societyId: 1,
    });
    Alert.alert('Success', 'Gate created successfully');
    // Navigate or refresh list
  } catch (error) {
    // Error already handled in createGate
  }
};
```

---

## 2. Get All Gates

Retrieve a paginated list of gates with optional filtering.

### Endpoint

```
GET /api/v1/gates
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`
- **Note**: `SOCIETY_ADMIN` and `SECURITY` users can only see gates from their own society

### Query Parameters

| Parameter   | Type    | Default | Description                            |
| ----------- | ------- | ------- | -------------------------------------- |
| `page`      | integer | 1       | Page number                            |
| `limit`     | integer | 10      | Items per page (max 100)               |
| `societyId` | integer | -       | Filter by society ID                   |
| `search`    | string  | -       | Search by gate name (case-insensitive) |

### Example Request

```
GET /api/v1/gates?page=1&limit=10&societyId=1&search=Main
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Gates retrieved successfully",
  "data": {
    "gates": [
      {
        "id": 1,
        "name": "Main Gate",
        "societyId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "society": {
          "id": 1,
          "name": "Green Valley Apartments",
          "type": "apartment"
        },
        "_count": {
          "visitorLogs": 15
        }
      },
      {
        "id": 2,
        "name": "Back Gate",
        "societyId": 1,
        "createdAt": "2024-01-02T00:00:00.000Z",
        "updatedAt": "2024-01-02T00:00:00.000Z",
        "society": {
          "id": 1,
          "name": "Green Valley Apartments",
          "type": "apartment"
        },
        "_count": {
          "visitorLogs": 8
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "pages": 1
    }
  }
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { FlatList, View, Text, ActivityIndicator, RefreshControl } from 'react-native';

const useGates = (filters = {}) => {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  const fetchGates = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: filters.limit || 10,
        ...(filters.societyId && { societyId: filters.societyId }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await apiClient.get('/gates', { params });

      if (response.data.success) {
        if (page === 1) {
          setGates(response.data.data.gates);
        } else {
          setGates((prev) => [...prev, ...response.data.data.gates]);
        }
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch gates');
      console.error('Failed to fetch gates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGates(1);
  }, [filters.societyId, filters.search]);

  const loadMore = () => {
    if (!loading && pagination && pagination.page < pagination.pages) {
      fetchGates(pagination.page + 1);
    }
  };

  const refresh = () => {
    fetchGates(1);
  };

  return { gates, loading, error, pagination, loadMore, refresh };
};

// Usage in Component
const GatesListScreen = () => {
  const { gates, loading, error, pagination, loadMore, refresh } = useGates({
    societyId: 1,
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
    <FlatList
      data={gates}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={{ padding: 15, borderBottomWidth: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
          <Text>Society: {item.society.name}</Text>
          <Text>Visitor Logs: {item._count.visitorLogs}</Text>
          <Text style={{ color: 'gray', fontSize: 12 }}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
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
            <Text>No gates found</Text>
          </View>
        ) : null
      }
    />
  );
};
```

### Simple Fetch Example

```javascript
const getGates = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...(filters.societyId && { societyId: filters.societyId }),
      ...(filters.search && { search: filters.search }),
    };

    const response = await apiClient.get('/gates', { params });

    if (response.data.success) {
      return {
        gates: response.data.data.gates,
        pagination: response.data.data.pagination,
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Failed to fetch gates:', error);
    throw error;
  }
};

// Usage
const loadGates = async () => {
  try {
    const result = await getGates(1, 10, {
      societyId: 1,
      search: 'Main',
    });
    console.log('Gates:', result.gates);
    console.log('Total pages:', result.pagination.pages);
  } catch (error) {
    Alert.alert('Error', 'Failed to load gates');
  }
};
```

---

## 3. Get Gate by ID

Retrieve a specific gate by its ID.

### Endpoint

```
GET /api/v1/gates/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`
- **Note**: `SOCIETY_ADMIN` and `SECURITY` users can only access gates from their own society

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Gate ID     |

### Success Response (200)

```json
{
  "success": true,
  "message": "Gate retrieved successfully",
  "data": {
    "gate": {
      "id": 1,
      "name": "Main Gate",
      "societyId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "society": {
        "id": 1,
        "name": "Green Valley Apartments",
        "type": "apartment"
      },
      "_count": {
        "visitorLogs": 15
      }
    }
  }
}
```

### Error Responses

**400 Bad Request** - Invalid gate ID

```json
{
  "success": false,
  "message": "Invalid gate ID"
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Gate not found"
}
```

**403 Forbidden** - User trying to access gate from another society

```json
{
  "success": false,
  "message": "Access denied. You can only view gates from your own society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';

const useGate = (gateId) => {
  const [gate, setGate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchGate = async () => {
    if (!gateId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/gates/${gateId}`);

      if (response.data.success) {
        setGate(response.data.data.gate);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Gate not found');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to fetch gate');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGate();
  }, [gateId]);

  return { gate, loading, error, refetch: fetchGate };
};

// Usage in Component
const GateDetailScreen = ({ route }) => {
  const { gateId } = route.params;
  const { gate, loading, error } = useGate(gateId);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;
  if (!gate) return <Text>Gate not found</Text>;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{gate.name}</Text>
      <Text style={{ marginTop: 10 }}>Society: {gate.society.name}</Text>
      <Text>Society Type: {gate.society.type}</Text>
      <Text style={{ marginTop: 10 }}>Visitor Logs: {gate._count.visitorLogs}</Text>
      <Text style={{ color: 'gray', fontSize: 12, marginTop: 10 }}>
        Created: {new Date(gate.createdAt).toLocaleString()}
      </Text>
      <Text style={{ color: 'gray', fontSize: 12 }}>
        Updated: {new Date(gate.updatedAt).toLocaleString()}
      </Text>
    </View>
  );
};
```

### Simple Fetch Example

```javascript
const getGateById = async (gateId) => {
  try {
    const response = await apiClient.get(`/gates/${gateId}`);

    if (response.data.success) {
      return response.data.data.gate;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Gate does not exist');
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only view gates from your society');
    } else {
      Alert.alert('Error', 'Failed to fetch gate');
    }
    throw error;
  }
};

// Usage
const loadGate = async () => {
  try {
    const gate = await getGateById(1);
    console.log('Gate:', gate);
    console.log('Visitor Logs:', gate._count.visitorLogs);
  } catch (error) {
    // Error already handled
  }
};
```

---

## 4. Update Gate

Update an existing gate's information.

### Endpoint

```
PUT /api/v1/gates/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` users can only update gates from their own society

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Gate ID     |

### Request Body

All fields are optional. Only include fields you want to update.

```json
{
  "name": "Main Entrance Gate"
}
```

### Field Descriptions

| Field  | Type   | Required | Description                                          |
| ------ | ------ | -------- | ---------------------------------------------------- |
| `name` | string | No       | Gate name (must be unique within society if changed) |

### Success Response (200)

```json
{
  "success": true,
  "message": "Gate updated successfully",
  "data": {
    "gate": {
      "id": 1,
      "name": "Main Entrance Gate",
      "societyId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z",
      "society": {
        "id": 1,
        "name": "Green Valley Apartments",
        "type": "apartment"
      }
    }
  }
}
```

### Error Responses

**400 Bad Request** - Invalid gate ID

```json
{
  "success": false,
  "message": "Invalid gate ID"
}
```

**400 Bad Request** - Duplicate gate name

```json
{
  "success": false,
  "message": "Gate with this name already exists for this society"
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Gate not found"
}
```

**403 Forbidden** - Insufficient permissions

```json
{
  "success": false,
  "message": "Access denied. You can only update gates from your own society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const updateGate = async (gateId, updateData) => {
  try {
    const response = await apiClient.put(`/gates/${gateId}`, {
      ...(updateData.name && { name: updateData.name }),
    });

    if (response.data.success) {
      console.log('Gate updated:', response.data.data.gate);
      return response.data.data.gate;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      if (error.response.data.errors) {
        const errors = error.response.data.errors;
        Alert.alert('Validation Error', errors[0]?.msg || 'Invalid data');
      } else {
        Alert.alert('Error', error.response.data.message);
      }
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only update gates from your society');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Gate does not exist');
    } else {
      Alert.alert('Error', 'Failed to update gate');
    }
    throw error;
  }
};

// Usage
const handleUpdateGate = async () => {
  try {
    const updatedGate = await updateGate(1, {
      name: 'Main Entrance Gate',
    });
    Alert.alert('Success', 'Gate updated successfully');
    // Navigate or refresh
  } catch (error) {
    // Error already handled in updateGate
  }
};
```

### React Native Form Example

```javascript
import { useState } from 'react';
import { View, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import apiClient from '../services/authService';

const GateEditScreen = ({ route, navigation }) => {
  const { gate } = route.params;
  const [name, setName] = useState(gate.name);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Gate name is required');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.put(`/gates/${gate.id}`, {
        name: name.trim(),
      });

      if (response.data.success) {
        Alert.alert('Success', 'Gate updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to update gate');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 20,
          borderRadius: 5,
        }}
        placeholder="Gate Name"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />
      <Button
        title={loading ? 'Updating...' : 'Update Gate'}
        onPress={handleSubmit}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
};
```

---

## 5. Delete Gate

Delete a gate. Gates with existing visitor logs cannot be deleted.

### Endpoint

```
DELETE /api/v1/gates/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` users can only delete gates from their own society

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Gate ID     |

### Success Response (200)

```json
{
  "success": true,
  "message": "Gate deleted successfully"
}
```

### Error Responses

**400 Bad Request** - Invalid gate ID

```json
{
  "success": false,
  "message": "Invalid gate ID"
}
```

**400 Bad Request** - Gate has visitor logs

```json
{
  "success": false,
  "message": "Cannot delete gate with existing visitor logs. Please remove visitor logs first."
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Gate not found"
}
```

**403 Forbidden** - Insufficient permissions

```json
{
  "success": false,
  "message": "Access denied. You can only delete gates from your own society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const deleteGate = async (gateId) => {
  try {
    const response = await apiClient.delete(`/gates/${gateId}`);

    if (response.data.success) {
      console.log('Gate deleted successfully');
      return true;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert('Cannot Delete', error.response.data.message);
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only delete gates from your society');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Gate does not exist');
    } else {
      Alert.alert('Error', 'Failed to delete gate');
    }
    throw error;
  }
};

// Usage with confirmation
const handleDeleteGate = async (gateId, gateName) => {
  Alert.alert(
    'Delete Gate',
    `Are you sure you want to delete "${gateName}"? This action cannot be undone.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGate(gateId);
            Alert.alert('Success', 'Gate deleted successfully');
            // Navigate back or refresh list
          } catch (error) {
            // Error already handled in deleteGate
          }
        },
      },
    ]
  );
};
```

### React Native Component Example

```javascript
import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import apiClient from '../services/authService';

const GateItem = ({ gate, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    Alert.alert('Delete Gate', `Are you sure you want to delete "${gate.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            const response = await apiClient.delete(`/gates/${gate.id}`);
            if (response.data.success) {
              onDelete(gate.id);
              Alert.alert('Success', 'Gate deleted successfully');
            }
          } catch (error) {
            if (error.response?.status === 400) {
              Alert.alert('Cannot Delete', error.response.data.message);
            } else {
              Alert.alert('Error', 'Failed to delete gate');
            }
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View
      style={{
        padding: 15,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{gate.name}</Text>
        <Text>Visitor Logs: {gate._count.visitorLogs}</Text>
      </View>
      <TouchableOpacity
        onPress={handleDelete}
        disabled={deleting}
        style={{
          padding: 10,
          backgroundColor: '#ff4444',
          borderRadius: 5,
          opacity: deleting ? 0.5 : 1,
        }}
      >
        {deleting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
```

---

## Complete React Native Service Example

Here's a complete service file for Gates operations:

```javascript
// services/gateService.js
import apiClient from './authService';
import { Alert } from 'react-native';

export const gateService = {
  /**
   * Create a new gate
   */
  create: async (name, societyId) => {
    try {
      const response = await apiClient.post('/gates', {
        name: name.trim(),
        societyId: parseInt(societyId),
      });

      if (response.data.success) {
        return response.data.data.gate;
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'create');
      throw error;
    }
  },

  /**
   * Get all gates with pagination and filters
   */
  getAll: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = {
        page,
        limit,
        ...(filters.societyId && { societyId: filters.societyId }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await apiClient.get('/gates', { params });

      if (response.data.success) {
        return {
          gates: response.data.data.gates,
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
   * Get gate by ID
   */
  getById: async (gateId) => {
    try {
      const response = await apiClient.get(`/gates/${gateId}`);

      if (response.data.success) {
        return response.data.data.gate;
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'fetch');
      throw error;
    }
  },

  /**
   * Update gate
   */
  update: async (gateId, updateData) => {
    try {
      const response = await apiClient.put(`/gates/${gateId}`, {
        ...(updateData.name && { name: updateData.name.trim() }),
      });

      if (response.data.success) {
        return response.data.data.gate;
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'update');
      throw error;
    }
  },

  /**
   * Delete gate
   */
  delete: async (gateId) => {
    try {
      const response = await apiClient.delete(`/gates/${gateId}`);

      if (response.data.success) {
        return true;
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'delete');
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
        const errorMsg = data.errors.map((e) => e.msg).join('\n');
        Alert.alert('Validation Error', errorMsg);
      } else {
        Alert.alert('Error', data.message || 'Invalid request');
      }
      break;
    case 403:
      Alert.alert(
        'Access Denied',
        data.message || 'You do not have permission to perform this action'
      );
      break;
    case 404:
      Alert.alert('Not Found', data.message || 'Resource not found');
      break;
    case 500:
      Alert.alert('Server Error', 'An error occurred on the server. Please try again later.');
      break;
    default:
      Alert.alert('Error', data.message || `Failed to ${operation} gate`);
  }
};
```

### Usage Example

```javascript
import { gateService } from '../services/gateService';
import { useState, useEffect } from 'react';

const GatesScreen = () => {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGates();
  }, []);

  const loadGates = async () => {
    setLoading(true);
    try {
      const result = await gateService.getAll(1, 10, { societyId: 1 });
      setGates(result.gates);
    } catch (error) {
      // Error already handled in service
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGate = async () => {
    try {
      const newGate = await gateService.create('Main Gate', 1);
      setGates([newGate, ...gates]);
    } catch (error) {
      // Error already handled
    }
  };

  const handleDeleteGate = async (gateId) => {
    try {
      await gateService.delete(gateId);
      setGates(gates.filter((g) => g.id !== gateId));
    } catch (error) {
      // Error already handled
    }
  };

  // ... rest of component
};
```

---

## Role-Based Access Summary

| Operation      | SUPER_ADMIN | SOCIETY_ADMIN    | SECURITY         |
| -------------- | ----------- | ---------------- | ---------------- |
| Create Gate    | ✅          | ✅ (own society) | ❌               |
| Get All Gates  | ✅          | ✅ (own society) | ✅ (own society) |
| Get Gate by ID | ✅          | ✅ (own society) | ✅ (own society) |
| Update Gate    | ✅          | ✅ (own society) | ❌               |
| Delete Gate    | ✅          | ✅ (own society) | ❌               |

---

## Special Notes

### Gate Name Uniqueness

- Gate names must be unique within a society
- Example: "Main Gate" can exist in Society 1 and Society 2, but not twice in Society 1
- When updating a gate name, the new name must also be unique within that society

### Deleting Gates

Gates cannot be deleted if they have:

- Visitor logs associated with them

You must:

1. Delete or reassign visitor logs (if applicable)
2. Then delete the gate

**Note**: This is a safety measure to preserve visitor log history. If you need to remove a gate that has visitor logs, you may need to:

- Archive or reassign the visitor logs to another gate
- Or implement a soft delete mechanism (marking gates as inactive instead of deleting)

### Visitor Logs Count

- The `_count.visitorLogs` field shows how many visitor logs are associated with this gate
- This count is included in both list and detail responses
- Use this information to determine if a gate can be safely deleted

### Society Association

- Every gate must belong to a society
- Gates are automatically filtered by society for `SOCIETY_ADMIN` users
- `SUPER_ADMIN` users can access gates from all societies

---

## Testing with Swagger UI

You can test all endpoints using Swagger UI:

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:1111/api-docs`
3. Navigate to **v1 - Gates** section
4. Click "Authorize" and enter your Bearer token
5. Test each endpoint

---

## Next Steps

1. Set up authentication in your React Native app (see [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md))
2. Implement the gate service in your app
3. Create UI components for listing, viewing, creating, editing, and deleting gates
4. Add proper error handling and loading states
5. Integrate with visitor log system (visitors enter through gates)
6. Add gate selection in visitor entry forms
7. Implement gate-based filtering for visitor logs
8. Test with multiple scenarios (multiple gates per society)

---

## Related Documentation

- **Users API**: [USERS_CRUD_API.md](./USERS_CRUD_API.md)
- **Societies API**: [SOCIETIES_CRUD_API.md](./SOCIETIES_CRUD_API.md)
- **Units API**: [UNITS_CRUD_API.md](./UNITS_CRUD_API.md)
- **Visitor Logs**: Visitors are associated with gates via `gateId` field
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

---

## Support

- **Swagger UI**: `http://localhost:1111/api-docs`
- **API Base URL**: `http://localhost:1111/api/v1`
- **Authentication Docs**: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)
