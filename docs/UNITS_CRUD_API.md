# Units CRUD Operations & Member Mapping API Documentation

Complete documentation for Units CRUD operations and Unit Member mapping with React Native integration examples.

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

| Method | Endpoint                       | Description                               | Required Role                                  |
| ------ | ------------------------------ | ----------------------------------------- | ---------------------------------------------- |
| POST   | `/units`                       | Create a new unit                         | SUPER_ADMIN, SOCIETY_ADMIN                     |
| GET    | `/units`                       | Get all units (with pagination & filters) | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT |
| GET    | `/units/:id`                   | Get unit by ID (with members)             | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT |
| PUT    | `/units/:id`                   | Update unit                               | SUPER_ADMIN, SOCIETY_ADMIN                     |
| DELETE | `/units/:id`                   | Delete unit                               | SUPER_ADMIN, SOCIETY_ADMIN                     |
| POST   | `/units/:id/members`           | Add member to unit                        | SUPER_ADMIN, SOCIETY_ADMIN                     |
| DELETE | `/units/:id/members/:memberId` | Remove member from unit                   | SUPER_ADMIN, SOCIETY_ADMIN                     |

---

## 1. Create Unit

Create a new unit (flat/office/shop) in a society.

### Endpoint

```
POST /api/v1/units
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` can only create units for their own society

### Request Body

```json
{
  "unitNo": "A-302",
  "societyId": 1,
  "unitType": "FLAT",
  "status": "ACTIVE"
}
```

### Field Descriptions

| Field       | Type    | Required | Description                                                   |
| ----------- | ------- | -------- | ------------------------------------------------------------- |
| `unitNo`    | string  | Yes      | Unit number (e.g., "A-302", "201", "HR-01")                   |
| `societyId` | integer | Yes      | Society ID where the unit belongs                             |
| `unitType`  | string  | No       | Unit type: `"FLAT"`, `"OFFICE"`, or `"SHOP"`                  |
| `status`    | string  | No       | Unit status: `"ACTIVE"` or `"INACTIVE"` (default: `"ACTIVE"`) |

### Success Response (201)

```json
{
  "success": true,
  "message": "Unit created successfully",
  "data": {
    "unit": {
      "id": 1,
      "unitNo": "A-302",
      "unitType": "FLAT",
      "status": "ACTIVE",
      "societyId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "society": {
        "id": 1,
        "name": "Green Valley Apartments",
        "type": "apartment"
      },
      "_count": {
        "members": 0,
        "visitorLogs": 0
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
      "msg": "unitNo is required",
      "param": "unitNo",
      "location": "body"
    }
  ]
}
```

**400 Bad Request** - Duplicate unit number

```json
{
  "success": false,
  "message": "Unit with this number already exists for this society"
}
```

**403 Forbidden** - Insufficient permissions

```json
{
  "success": false,
  "message": "Access denied. You can only create units for your own society."
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

const createUnit = async (unitData) => {
  try {
    const response = await apiClient.post('/units', {
      unitNo: unitData.unitNo,
      societyId: unitData.societyId,
      unitType: unitData.unitType || null,
      status: unitData.status || 'ACTIVE',
    });

    if (response.data.success) {
      console.log('Unit created:', response.data.data.unit);
      return response.data.data.unit;
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
      Alert.alert('Access Denied', 'You can only create units for your own society');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Society does not exist');
    } else {
      Alert.alert('Error', 'Failed to create unit');
    }
    throw error;
  }
};

// Usage
const handleCreateUnit = async () => {
  try {
    const newUnit = await createUnit({
      unitNo: 'A-302',
      societyId: 1,
      unitType: 'FLAT',
      status: 'ACTIVE',
    });
    Alert.alert('Success', 'Unit created successfully');
    // Navigate or refresh list
  } catch (error) {
    // Error already handled in createUnit
  }
};
```

---

## 2. Get All Units

Retrieve a paginated list of units with optional filtering.

### Endpoint

```
GET /api/v1/units
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`, `RESIDENT`
- **Note**: `SOCIETY_ADMIN`, `SECURITY`, and `RESIDENT` users can only see units from their own society

### Query Parameters

| Parameter   | Type    | Default | Description                                       |
| ----------- | ------- | ------- | ------------------------------------------------- |
| `page`      | integer | 1       | Page number                                       |
| `limit`     | integer | 10      | Items per page (max 100)                          |
| `societyId` | integer | -       | Filter by society ID                              |
| `status`    | string  | -       | Filter by status: `"ACTIVE"` or `"INACTIVE"`      |
| `unitType`  | string  | -       | Filter by type: `"FLAT"`, `"OFFICE"`, or `"SHOP"` |
| `search`    | string  | -       | Search by unit number (case-insensitive)          |

### Example Request

```
GET /api/v1/units?page=1&limit=10&status=ACTIVE&unitType=FLAT&societyId=1&search=A-3
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Units retrieved successfully",
  "data": {
    "units": [
      {
        "id": 1,
        "unitNo": "A-302",
        "unitType": "FLAT",
        "status": "ACTIVE",
        "societyId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "society": {
          "id": 1,
          "name": "Green Valley Apartments",
          "type": "apartment"
        },
        "_count": {
          "members": 2,
          "visitorLogs": 5
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
import { FlatList, View, Text, ActivityIndicator, RefreshControl } from 'react-native';

const useUnits = (filters = {}) => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  const fetchUnits = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: filters.limit || 10,
        ...(filters.societyId && { societyId: filters.societyId }),
        ...(filters.status && { status: filters.status }),
        ...(filters.unitType && { unitType: filters.unitType }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await apiClient.get('/units', { params });

      if (response.data.success) {
        if (page === 1) {
          setUnits(response.data.data.units);
        } else {
          setUnits((prev) => [...prev, ...response.data.data.units]);
        }
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', 'Failed to fetch units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [filters.societyId, filters.status, filters.unitType, filters.search]);

  return {
    units,
    loading,
    error,
    pagination,
    refetch: () => fetchUnits(1),
    loadMore: () => {
      if (pagination && pagination.page < pagination.pages) {
        fetchUnits(pagination.page + 1);
      }
    },
  };
};

// Usage in Component
const UnitsListScreen = () => {
  const [filters, setFilters] = useState({
    status: 'ACTIVE',
    unitType: 'FLAT',
  });
  const { units, loading, pagination, refetch, loadMore } = useUnits(filters);

  return (
    <FlatList
      data={units}
      keyExtractor={(item) => item.id.toString()}
      onRefresh={refetch}
      refreshing={loading}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => (
        <View style={{ padding: 15, borderBottomWidth: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.unitNo}</Text>
          <Text>Type: {item.unitType || 'N/A'}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Society: {item.society.name}</Text>
          <Text>Members: {item._count.members}</Text>
          <Text>Visitor Logs: {item._count.visitorLogs}</Text>
        </View>
      )}
      ListFooterComponent={
        pagination && pagination.page < pagination.pages ? (
          <ActivityIndicator style={{ padding: 20 }} />
        ) : null
      }
    />
  );
};
```

### Simple Fetch Example

```javascript
const getUnits = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get('/units', { params });

    if (response.data.success) {
      return {
        units: response.data.data.units,
        pagination: response.data.data.pagination,
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Failed to fetch units:', error);
    throw error;
  }
};

// Usage
const loadUnits = async () => {
  try {
    const result = await getUnits(1, 10, {
      status: 'ACTIVE',
      unitType: 'FLAT',
      societyId: 1,
      search: 'A-3',
    });
    console.log('Units:', result.units);
    console.log('Total pages:', result.pagination.pages);
  } catch (error) {
    Alert.alert('Error', 'Failed to load units');
  }
};
```

---

## 3. Get Unit by ID

Retrieve a specific unit by its ID, including all members.

### Endpoint

```
GET /api/v1/units/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`, `RESIDENT`
- **Note**: `SOCIETY_ADMIN`, `SECURITY`, and `RESIDENT` users can only access units from their own society

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Unit ID     |

### Success Response (200)

```json
{
  "success": true,
  "message": "Unit retrieved successfully",
  "data": {
    "unit": {
      "id": 1,
      "unitNo": "A-302",
      "unitType": "FLAT",
      "status": "ACTIVE",
      "societyId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "society": {
        "id": 1,
        "name": "Green Valley Apartments",
        "type": "apartment"
      },
      "members": [
        {
          "id": 1,
          "unitId": 1,
          "userId": 5,
          "role": "OWNER",
          "isPrimary": true,
          "user": {
            "id": 5,
            "name": "John Doe",
            "mobile": "1234567890",
            "email": "john@example.com",
            "role": {
              "name": "RESIDENT"
            }
          }
        }
      ],
      "_count": {
        "visitorLogs": 5
      }
    }
  }
}
```

### Error Responses

**404 Not Found**

```json
{
  "success": false,
  "message": "Unit not found"
}
```

**403 Forbidden** - User trying to access unit from another society

```json
{
  "success": false,
  "message": "Access denied. You can only view units from your own society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, FlatList } from 'react-native';

const useUnit = (unitId) => {
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUnit = async () => {
    if (!unitId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/units/${unitId}`);

      if (response.data.success) {
        setUnit(response.data.data.unit);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Unit not found');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to fetch unit');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnit();
  }, [unitId]);

  return { unit, loading, error, refetch: fetchUnit };
};

// Usage in Component
const UnitDetailScreen = ({ route }) => {
  const { unitId } = route.params;
  const { unit, loading, error } = useUnit(unitId);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;
  if (!unit) return <Text>Unit not found</Text>;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Unit {unit.unitNo}</Text>
      <Text>Type: {unit.unitType || 'N/A'}</Text>
      <Text>Status: {unit.status}</Text>
      <Text>Society: {unit.society.name}</Text>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
        Members ({unit.members.length})
      </Text>
      <FlatList
        data={unit.members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderWidth: 1, marginTop: 10, borderRadius: 5 }}>
            <Text style={{ fontWeight: 'bold' }}>
              {item.user.name}
              {item.isPrimary && ' (Primary)'}
            </Text>
            <Text>Role: {item.role}</Text>
            <Text>Mobile: {item.user.mobile}</Text>
            <Text>Email: {item.user.email || 'N/A'}</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No members added yet</Text>}
      />
    </View>
  );
};
```

### Simple Fetch Example

```javascript
const getUnitById = async (unitId) => {
  try {
    const response = await apiClient.get(`/units/${unitId}`);

    if (response.data.success) {
      return response.data.data.unit;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Unit does not exist');
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only view units from your society');
    } else {
      Alert.alert('Error', 'Failed to fetch unit');
    }
    throw error;
  }
};

// Usage
const loadUnit = async () => {
  try {
    const unit = await getUnitById(1);
    console.log('Unit:', unit);
    console.log('Members:', unit.members);
  } catch (error) {
    // Error already handled
  }
};
```

---

## 4. Update Unit

Update an existing unit's information.

### Endpoint

```
PUT /api/v1/units/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` users can only update units from their own society

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Unit ID     |

### Request Body

All fields are optional. Only include fields you want to update.

```json
{
  "unitNo": "A-303",
  "unitType": "OFFICE",
  "status": "INACTIVE"
}
```

### Field Descriptions

| Field      | Type   | Required | Description                                                        |
| ---------- | ------ | -------- | ------------------------------------------------------------------ |
| `unitNo`   | string | No       | Unit number (must be unique within society if changed)             |
| `unitType` | string | No       | Unit type: `"FLAT"`, `"OFFICE"`, or `"SHOP"` (use `null` to clear) |
| `status`   | string | No       | Unit status: `"ACTIVE"` or `"INACTIVE"`                            |

### Success Response (200)

```json
{
  "success": true,
  "message": "Unit updated successfully",
  "data": {
    "unit": {
      "id": 1,
      "unitNo": "A-303",
      "unitType": "OFFICE",
      "status": "INACTIVE",
      "societyId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z",
      "society": {
        "id": 1,
        "name": "Green Valley Apartments",
        "type": "apartment"
      },
      "_count": {
        "members": 2,
        "visitorLogs": 5
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
      "msg": "Status must be ACTIVE or INACTIVE",
      "param": "status",
      "location": "body"
    }
  ]
}
```

**400 Bad Request** - Duplicate unit number

```json
{
  "success": false,
  "message": "Unit with this number already exists for this society"
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Unit not found"
}
```

**403 Forbidden**

```json
{
  "success": false,
  "message": "Access denied. You can only update units from your own society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const updateUnit = async (unitId, updateData) => {
  try {
    // Only include fields that have values
    const payload = {};
    if (updateData.unitNo !== undefined) payload.unitNo = updateData.unitNo;
    if (updateData.unitType !== undefined) payload.unitType = updateData.unitType;
    if (updateData.status !== undefined) payload.status = updateData.status;

    const response = await apiClient.put(`/units/${unitId}`, payload);

    if (response.data.success) {
      return response.data.data.unit;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      if (error.response.data.errors) {
        const errors = error.response.data.errors || [];
        errors.forEach((err) => {
          console.error(`${err.param}: ${err.msg}`);
        });
        Alert.alert('Validation Error', errors[0]?.msg || 'Invalid data');
      } else {
        Alert.alert('Error', error.response.data.message);
      }
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only update units from your society');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Unit does not exist');
    } else {
      Alert.alert('Error', 'Failed to update unit');
    }
    throw error;
  }
};

// Usage in Form Component
const UnitEditScreen = ({ route, navigation }) => {
  const { unit } = route.params;
  const [formData, setFormData] = useState({
    unitNo: unit.unitNo,
    unitType: unit.unitType || '',
    status: unit.status,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updated = await updateUnit(unit.id, formData);
      Alert.alert('Success', 'Unit updated successfully');
      navigation.goBack();
      // Optionally refresh the list
    } catch (error) {
      // Error already handled in updateUnit
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <TextInput
        value={formData.unitNo}
        onChangeText={(text) => setFormData({ ...formData, unitNo: text })}
        placeholder="Unit Number"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Picker
        selectedValue={formData.unitType}
        onValueChange={(value) => setFormData({ ...formData, unitType: value })}
      >
        <Picker.Item label="Select Type" value="" />
        <Picker.Item label="FLAT" value="FLAT" />
        <Picker.Item label="OFFICE" value="OFFICE" />
        <Picker.Item label="SHOP" value="SHOP" />
      </Picker>
      <Picker
        selectedValue={formData.status}
        onValueChange={(value) => setFormData({ ...formData, status: value })}
      >
        <Picker.Item label="ACTIVE" value="ACTIVE" />
        <Picker.Item label="INACTIVE" value="INACTIVE" />
      </Picker>
      <Button
        title={loading ? 'Updating...' : 'Update Unit'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </ScrollView>
  );
};
```

---

## 5. Delete Unit

Delete a unit. **Note**: Cannot delete a unit that has members or visitor logs.

### Endpoint

```
DELETE /api/v1/units/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` users can only delete units from their own society

### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Unit ID     |

### Success Response (200)

```json
{
  "success": true,
  "message": "Unit deleted successfully"
}
```

### Error Responses

**400 Bad Request** - Unit has members or visitor logs

```json
{
  "success": false,
  "message": "Cannot delete unit with existing members or visitor logs. Please remove them first."
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Unit not found"
}
```

**403 Forbidden**

```json
{
  "success": false,
  "message": "Access denied. You can only delete units from your own society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const deleteUnit = async (unitId) => {
  try {
    const response = await apiClient.delete(`/units/${unitId}`);

    if (response.data.success) {
      return true;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert(
        'Cannot Delete',
        error.response.data.message || 'This unit has members or visitor logs and cannot be deleted'
      );
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only delete units from your society');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Unit does not exist');
    } else {
      Alert.alert('Error', 'Failed to delete unit');
    }
    throw error;
  }
};

// Usage with Confirmation
const handleDeleteUnit = (unitId, unitNo) => {
  Alert.alert(
    'Delete Unit',
    `Are you sure you want to delete unit "${unitNo}"? This action cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUnit(unitId);
            Alert.alert('Success', 'Unit deleted successfully');
            // Navigate back or refresh list
            navigation.goBack();
          } catch (error) {
            // Error already handled in deleteUnit
          }
        },
      },
    ]
  );
};

// Usage in Component
const UnitDetailScreen = ({ route, navigation }) => {
  const { unit } = route.params;
  const { refetch } = useUnit(unit.id);

  const handleDelete = () => {
    handleDeleteUnit(unit.id, unit.unitNo);
  };

  return (
    <View>
      {/* Unit details */}
      <Button title="Delete Unit" onPress={handleDelete} color="red" />
    </View>
  );
};
```

---

## 6. Unit Member Mapping

### Overview

The system uses a **many-to-many relationship** between Users and Units through the `UnitMember` junction table. This allows:

- Multiple residents to be associated with a unit (e.g., family members, tenants)
- A resident to be associated with multiple units (e.g., owns multiple flats)
- Each relationship to have a role (OWNER, TENANT, EMPLOYEE)
- One primary member per unit (for notifications and primary contact)

### Database Schema

#### UnitMember Model

```typescript
interface UnitMember {
  id: number;
  unitId: number; // Foreign key to Unit
  userId: number; // Foreign key to User (resident)
  role: 'OWNER' | 'TENANT' | 'EMPLOYEE';
  isPrimary: boolean; // One primary member per unit
  createdAt: string;
  updatedAt: string;
}
```

#### Relationships

```
User (Resident) ←→ UnitMember ←→ Unit
```

- **User** has many `UnitMember` records
- **Unit** has many `UnitMember` records
- Each `UnitMember` belongs to one User and one Unit
- Unique constraint: `(unitId, userId)` - a user can only be a member of a unit once

---

### 6.1. Add Member to Unit

Add a resident to a unit.

#### Endpoint

```
POST /api/v1/units/:id/members
```

#### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` can only manage members in units from their own society

#### Path Parameters

| Parameter | Type    | Required | Description |
| --------- | ------- | -------- | ----------- |
| `id`      | integer | Yes      | Unit ID     |

#### Request Body

```json
{
  "userId": 5,
  "role": "OWNER",
  "isPrimary": true
}
```

#### Field Descriptions

| Field       | Type    | Required | Description                                                                                           |
| ----------- | ------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `userId`    | integer | Yes      | The ID of the user (resident) to add                                                                  |
| `role`      | string  | Yes      | Must be `"OWNER"`, `"TENANT"`, or `"EMPLOYEE"`                                                        |
| `isPrimary` | boolean | No       | Set as primary member (defaults to `false`). If `true`, sets this member as primary and unsets others |

#### Success Response (201)

```json
{
  "success": true,
  "message": "Member added to unit successfully",
  "data": {
    "member": {
      "id": 1,
      "unitId": 1,
      "userId": 5,
      "role": "OWNER",
      "isPrimary": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": 5,
        "name": "John Doe",
        "mobile": "1234567890",
        "email": "john@example.com"
      },
      "unit": {
        "id": 1,
        "unitNo": "A-302"
      }
    }
  }
}
```

#### Error Responses

**400 Bad Request** - User already a member

```json
{
  "success": false,
  "message": "User is already a member of this unit"
}
```

**403 Forbidden**

```json
{
  "success": false,
  "message": "Access denied. You can only manage units from your own society."
}
```

**404 Not Found**

```json
{
  "success": false,
  "message": "Unit not found"
}
```

#### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const addUnitMember = async (unitId, userId, role, isPrimary = false) => {
  try {
    const response = await apiClient.post(`/units/${unitId}/members`, {
      userId,
      role: role.toUpperCase(),
      isPrimary,
    });

    if (response.data.success) {
      return response.data.data.member;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      if (error.response.data.message.includes('already a member')) {
        Alert.alert('Error', 'This resident is already a member of this unit');
      } else {
        Alert.alert('Error', error.response.data.message);
      }
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only manage units from your society');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Unit or user not found');
    } else {
      Alert.alert('Error', 'Failed to add member to unit');
    }
    throw error;
  }
};
```

---

### 6.2. Remove Member from Unit

Remove a resident from a unit.

#### Endpoint

```
DELETE /api/v1/units/:id/members/:memberId
```

#### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` can only manage members in units from their own society

#### Path Parameters

| Parameter  | Type    | Required | Description                |
| ---------- | ------- | -------- | -------------------------- |
| `id`       | integer | Yes      | Unit ID                    |
| `memberId` | integer | Yes      | UnitMember ID (not userId) |

#### Success Response (200)

```json
{
  "success": true,
  "message": "Member removed from unit successfully"
}
```

#### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const removeUnitMember = async (unitId, memberId) => {
  try {
    const response = await apiClient.delete(`/units/${unitId}/members/${memberId}`);

    if (response.data.success) {
      return true;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only manage units from your society');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Member does not exist');
    } else {
      Alert.alert('Error', 'Failed to remove member');
    }
    throw error;
  }
};
```

---

### 6.3. Complete Unit Members Management Screen Example

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import apiClient from '../services/authService';
import unitService from '../services/unitService';

const UnitMembersScreen = ({ route, navigation }) => {
  const { unitId } = route.params;
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [availableResidents, setAvailableResidents] = useState([]);

  // Fetch unit with members
  const fetchUnit = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/units/${unitId}`);
      if (response.data.success) {
        setUnit(response.data.data.unit);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load unit details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available residents
  const fetchAvailableResidents = async () => {
    try {
      const response = await apiClient.get('/users', {
        params: { status: 'active' },
      });
      if (response.data.success) {
        const existingUserIds = unit?.members?.map((m) => m.userId) || [];
        const available = response.data.data.users.filter(
          (user) => !existingUserIds.includes(user.id) && user.role.name === 'RESIDENT'
        );
        setAvailableResidents(available);
      }
    } catch (error) {
      console.error('Failed to fetch residents:', error);
    }
  };

  useEffect(() => {
    fetchUnit();
  }, [unitId]);

  useEffect(() => {
    if (unit) {
      fetchAvailableResidents();
    }
  }, [unit]);

  const handleAddMember = async (userId, role = 'OWNER') => {
    try {
      await unitService.addMember(unitId, userId, role, false);
      Alert.alert('Success', 'Resident added to unit');
      fetchUnit();
      fetchAvailableResidents();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add resident');
    }
  };

  const handleRemoveMember = async (memberId) => {
    Alert.alert('Remove Member', 'Are you sure you want to remove this resident?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await unitService.removeMember(unitId, memberId);
            Alert.alert('Success', 'Resident removed');
            fetchUnit();
            fetchAvailableResidents();
          } catch (error) {
            Alert.alert('Error', 'Failed to remove resident');
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
        Unit: {unit?.unitNo}
      </Text>

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Current Members</Text>
      <FlatList
        data={unit?.members || []}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 15, borderWidth: 1, marginBottom: 10, borderRadius: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
              {item.user.name}
              {item.isPrimary && ' (Primary)'}
            </Text>
            <Text>Mobile: {item.user.mobile}</Text>
            <Text>Email: {item.user.email || 'N/A'}</Text>
            <Text>Role: {item.role}</Text>
            <TouchableOpacity
              onPress={() => handleRemoveMember(item.id)}
              style={{ marginTop: 10, padding: 10, backgroundColor: '#ff4444', borderRadius: 5 }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text>No members added yet</Text>}
      />

      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 }}>
        Add New Member
      </Text>
      <FlatList
        data={availableResidents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleAddMember(item.id, 'OWNER')}
            style={{ padding: 15, borderWidth: 1, marginBottom: 10, borderRadius: 8 }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
            <Text>Mobile: {item.mobile}</Text>
            <Text style={{ marginTop: 5, color: '#0066cc' }}>Tap to add as OWNER</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No available residents</Text>}
      />
    </View>
  );
};

export default UnitMembersScreen;
```

---

### 6.4. Step-by-Step Workflow

#### 1. Create a Unit

```javascript
POST /api/v1/units
{
  "unitNo": "A-302",
  "societyId": 1,
  "unitType": "FLAT",
  "status": "ACTIVE"
}
```

#### 2. Create/Get Residents

```javascript
GET /api/v1/users?roleId=4&status=active
```

#### 3. Add Resident to Unit

```javascript
POST /api/v1/units/1/members
{
  "userId": 5,
  "role": "OWNER",
  "isPrimary": true
}
```

#### 4. View Unit Members

```javascript
GET / api / v1 / units / 1;
// Response includes members array with user details
```

---

### 6.5. Important Notes - Member Mapping

#### Primary Member

- Only one member per unit can be `isPrimary = true`
- When setting a member as primary, the system automatically unsets others
- Primary member is typically used for visitor approval notifications, primary contact, and billing

#### Member Roles

- **OWNER**: Owner of the unit
- **TENANT**: Renter/tenant of the unit
- **EMPLOYEE**: Employee working in the unit (for office spaces)

#### Validation Rules

- A user cannot be added to the same unit twice (unique constraint)
- User must exist before adding to unit
- Unit must exist before adding members
- Unit and user must belong to the same society (enforced by access control)

---

### 6.6. Common Use Cases

#### Family Living in One Flat

```javascript
// Add husband as primary owner
await unitService.addMember(unitId, husbandUserId, 'OWNER', true);

// Add wife as owner (non-primary)
await unitService.addMember(unitId, wifeUserId, 'OWNER', false);
```

#### Owner and Tenant

```javascript
await unitService.addMember(unitId, ownerUserId, 'OWNER', true);
await unitService.addMember(unitId, tenantUserId, 'TENANT', false);
```

#### Office with Multiple Employees

```javascript
await unitService.addMember(unitId, managerUserId, 'EMPLOYEE', true);
await unitService.addMember(unitId, employee1UserId, 'EMPLOYEE', false);
```

---

## Complete React Native Service Example

Here's a complete service file for all Units and Member operations:

```javascript
// services/unitService.js
import apiClient from './authService';

export const unitService = {
  /**
   * Create a new unit
   * @param {Object} unitData - Unit data
   * @returns {Promise<Object>} Created unit
   */
  create: async (unitData) => {
    const response = await apiClient.post('/units', unitData);
    if (response.data.success) {
      return response.data.data.unit;
    }
    throw new Error(response.data.message);
  },

  /**
   * Get all units with pagination and filters
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {number} options.societyId - Filter by society ID
   * @param {string} options.status - Filter by status
   * @param {string} options.unitType - Filter by unit type
   * @param {string} options.search - Search query
   * @returns {Promise<Object>} Units and pagination info
   */
  getAll: async (options = {}) => {
    const params = {
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.societyId && { societyId: options.societyId }),
      ...(options.status && { status: options.status }),
      ...(options.unitType && { unitType: options.unitType }),
      ...(options.search && { search: options.search }),
    };

    const response = await apiClient.get('/units', { params });
    if (response.data.success) {
      return {
        units: response.data.data.units,
        pagination: response.data.data.pagination,
      };
    }
    throw new Error(response.data.message);
  },

  /**
   * Get unit by ID
   * @param {number} unitId - Unit ID
   * @returns {Promise<Object>} Unit object with members
   */
  getById: async (unitId) => {
    const response = await apiClient.get(`/units/${unitId}`);
    if (response.data.success) {
      return response.data.data.unit;
    }
    throw new Error(response.data.message);
  },

  /**
   * Update unit
   * @param {number} unitId - Unit ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated unit
   */
  update: async (unitId, updateData) => {
    const response = await apiClient.put(`/units/${unitId}`, updateData);
    if (response.data.success) {
      return response.data.data.unit;
    }
    throw new Error(response.data.message);
  },

  /**
   * Delete unit
   * @param {number} unitId - Unit ID
   * @returns {Promise<boolean>} Success status
   */
  delete: async (unitId) => {
    const response = await apiClient.delete(`/units/${unitId}`);
    if (response.data.success) {
      return true;
    }
    throw new Error(response.data.message);
  },

  /**
   * Add member to unit
   * @param {number} unitId - Unit ID
   * @param {number} userId - User (resident) ID
   * @param {string} role - OWNER, TENANT, or EMPLOYEE
   * @param {boolean} isPrimary - Set as primary member
   * @returns {Promise<Object>} Created member
   */
  addMember: async (unitId, userId, role, isPrimary = false) => {
    const response = await apiClient.post(`/units/${unitId}/members`, {
      userId,
      role: role.toUpperCase(),
      isPrimary,
    });
    if (response.data.success) {
      return response.data.data.member;
    }
    throw new Error(response.data.message);
  },

  /**
   * Remove member from unit
   * @param {number} unitId - Unit ID
   * @param {number} memberId - UnitMember ID (not userId)
   * @returns {Promise<boolean>} Success status
   */
  removeMember: async (unitId, memberId) => {
    const response = await apiClient.delete(`/units/${unitId}/members/${memberId}`);
    if (response.data.success) {
      return true;
    }
    throw new Error(response.data.message);
  },
};

export default unitService;
```

### Usage Example

```javascript
import unitService from '../services/unitService';
import { Alert } from 'react-native';

// Create unit
const create = async () => {
  try {
    const unit = await unitService.create({
      unitNo: 'A-302',
      societyId: 1,
      unitType: 'FLAT',
      status: 'ACTIVE',
    });
    Alert.alert('Success', 'Unit created');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Get all units
const fetchAll = async () => {
  try {
    const result = await unitService.getAll({
      page: 1,
      limit: 20,
      status: 'ACTIVE',
      unitType: 'FLAT',
      societyId: 1,
    });
    console.log('Units:', result.units);
    console.log('Total:', result.pagination.total);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Get single unit
const fetchOne = async (id) => {
  try {
    const unit = await unitService.getById(id);
    console.log('Unit:', unit);
    console.log('Members:', unit.members);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Update unit
const update = async (id) => {
  try {
    const updated = await unitService.update(id, {
      unitNo: 'A-303',
      status: 'ACTIVE',
    });
    Alert.alert('Success', 'Unit updated');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Delete unit
const deleteUnit = async (id) => {
  try {
    await unitService.delete(id);
    Alert.alert('Success', 'Unit deleted');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};
```

---

## Error Handling Best Practices

### 1. Network Errors

```javascript
try {
  const response = await apiClient.get('/units');
} catch (error) {
  if (!error.response) {
    // Network error (no internet, server down)
    Alert.alert('Network Error', 'Please check your internet connection');
  } else {
    // HTTP error (4xx, 5xx)
    handleHttpError(error);
  }
}
```

### 2. Validation Errors

```javascript
const handleValidationError = (error) => {
  if (error.response?.status === 400 && error.response.data.errors) {
    const errors = error.response.data.errors;
    const errorMessages = errors.map((err) => `${err.param}: ${err.msg}`).join('\n');
    Alert.alert('Validation Error', errorMessages);
  } else if (error.response?.status === 400) {
    // Duplicate unit number error
    Alert.alert('Error', error.response.data.message);
  }
};
```

### 3. Permission Errors

```javascript
const handlePermissionError = (error) => {
  if (error.response?.status === 403) {
    Alert.alert(
      'Access Denied',
      error.response.data.message || 'You do not have permission to perform this action'
    );
  }
};
```

### 4. Not Found Errors

```javascript
const handleNotFoundError = (error) => {
  if (error.response?.status === 404) {
    Alert.alert('Not Found', 'The requested resource does not exist');
    // Navigate back or to list
    navigation.goBack();
  }
};
```

---

## Response Format

All API responses follow this standard format:

```typescript
{
  success: boolean;
  message: string;
  data?: {
    unit?: Unit;
    units?: Unit[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  errors?: Array<{
    msg: string;
    param: string;
    location: string;
  }>;
}
```

---

## Unit Object Schema

```typescript
interface Unit {
  id: number;
  unitNo: string;
  unitType?: 'FLAT' | 'OFFICE' | 'SHOP' | null;
  status: 'ACTIVE' | 'INACTIVE';
  societyId: number;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  society?: {
    id: number;
    name: string;
    type: 'apartment' | 'office';
  };
  members?: UnitMember[]; // Only included in getUnitById response
  _count?: {
    members: number;
    visitorLogs: number;
  };
}

interface UnitMember {
  id: number;
  unitId: number;
  userId: number;
  role: 'OWNER' | 'TENANT' | 'EMPLOYEE';
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    mobile: string;
    email?: string | null;
    role?: {
      name: string;
    };
  };
}
```

---

## Role-Based Access Summary

| Operation          | SUPER_ADMIN | SOCIETY_ADMIN    | SECURITY         | RESIDENT         |
| ------------------ | ----------- | ---------------- | ---------------- | ---------------- |
| Create Unit        | ✅          | ✅ (own society) | ❌               | ❌               |
| Get All Units      | ✅          | ✅ (own society) | ✅ (own society) | ✅ (own society) |
| Get Unit by ID     | ✅          | ✅ (own society) | ✅ (own society) | ✅ (own society) |
| Update Unit        | ✅          | ✅ (own society) | ❌               | ❌               |
| Delete Unit        | ✅          | ✅ (own society) | ❌               | ❌               |
| Add/Remove Members | ✅          | ✅ (own society) | ❌               | ❌               |

---

## Special Notes

### Unit Number Uniqueness

- Unit numbers must be unique within a society
- Example: "A-302" can exist in Society 1 and Society 2, but not twice in Society 1
- When updating a unit number, the new number must also be unique within that society

### Unit Types

- **FLAT**: Residential apartment/flat
- **OFFICE**: Office space
- **SHOP**: Commercial shop/store
- Can be `null` if not specified

### Status

- **ACTIVE**: Unit is active and can receive visitors
- **INACTIVE**: Unit is inactive (may be under maintenance, vacant, etc.)

### Deleting Units

Units cannot be deleted if they have:

- Members (residents) associated with them
- Visitor logs associated with them

You must:

1. Remove all members from the unit (see Section 6.2 - Remove Member from Unit)
2. Delete or reassign visitor logs (if applicable)
3. Then delete the unit

### Members in Response

- `getAllUnits`: Returns count of members only (`_count.members`)
- `getUnitById`: Returns full member details including user information

---

## Testing with Swagger UI

You can test all endpoints using Swagger UI:

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:1111/api-docs`
3. Navigate to **v1 - Units** section
4. Click "Authorize" and enter your Bearer token
5. Test each endpoint

---

## Next Steps

1. Set up authentication in your React Native app (see [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md))
2. Implement the unit service in your app
3. Create UI components for listing, viewing, creating, editing, and deleting units
4. Add proper error handling and loading states
5. Implement unit member management UI (add/remove residents from units)
6. Add resident selection/search functionality
7. Implement role selection (OWNER/TENANT/EMPLOYEE)
8. Add primary member management
9. Integrate with visitor approval system (visitors are assigned to units)
10. Test with multiple scenarios (families, tenants, offices)

---

## Related Documentation

- **Users API**: [USERS_CRUD_API.md](./USERS_CRUD_API.md)
- **Societies API**: [SOCIETIES_CRUD_API.md](./SOCIETIES_CRUD_API.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)
- **Visitor Logs**: Visitors are assigned to units via `unitId` field
- **Approvals**: Residents can approve visitor requests for their units

---

## Support

- **Swagger UI**: `http://localhost:1111/api-docs`
- **API Base URL**: `http://localhost:1111/api/v1`
- **Authentication Docs**: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)
