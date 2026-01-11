# Societies CRUD Operations API Documentation

Complete documentation for Societies CRUD operations with React Native integration examples.

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
| POST | `/societies` | Create a new society | SUPER_ADMIN |
| GET | `/societies` | Get all societies (with pagination & filters) | SUPER_ADMIN, SOCIETY_ADMIN |
| GET | `/societies/:id` | Get society by ID | SUPER_ADMIN, SOCIETY_ADMIN, RESIDENT, SECURITY |
| PUT | `/societies/:id` | Update society | SUPER_ADMIN, SOCIETY_ADMIN |
| DELETE | `/societies/:id` | Delete society | SUPER_ADMIN |

---

## 1. Create Society

Create a new society (apartment or office).

### Endpoint

```
POST /api/v1/societies
```

### Authorization

- **Required Role**: `SUPER_ADMIN` only

### Request Body

```json
{
  "name": "Green Valley Apartments",
  "type": "apartment",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001",
  "subscriptionId": 1
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Society name |
| `type` | string | Yes | Must be `"apartment"` or `"office"` |
| `address` | string | No | Street address |
| `city` | string | No | City name |
| `state` | string | No | State name |
| `pincode` | string | No | Postal code (max 10 characters) |
| `subscriptionId` | integer | No | Subscription ID |

### Success Response (201)

```json
{
  "success": true,
  "message": "Society created successfully",
  "data": {
    "society": {
      "id": 1,
      "name": "Green Valley Apartments",
      "type": "apartment",
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "subscriptionId": 1,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
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

**403 Forbidden** - Insufficient permissions
```json
{
  "success": false,
  "message": "Access denied. SUPER_ADMIN role required."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';

const createSociety = async (societyData) => {
  try {
    const response = await apiClient.post('/societies', {
      name: societyData.name,
      type: societyData.type, // 'apartment' or 'office'
      address: societyData.address,
      city: societyData.city,
      state: societyData.state,
      pincode: societyData.pincode,
      subscriptionId: societyData.subscriptionId,
    });

    if (response.data.success) {
      console.log('Society created:', response.data.data.society);
      return response.data.data.society;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      // Handle validation errors
      const errors = error.response.data.errors || [];
      errors.forEach(err => {
        console.error(`${err.param}: ${err.msg}`);
      });
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'Only Super Admins can create societies');
    } else {
      Alert.alert('Error', 'Failed to create society');
    }
    throw error;
  }
};

// Usage
const handleCreateSociety = async () => {
  try {
    const newSociety = await createSociety({
      name: 'Green Valley Apartments',
      type: 'apartment',
      address: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    });
    Alert.alert('Success', 'Society created successfully');
    // Navigate or refresh list
  } catch (error) {
    // Error already handled in createSociety
  }
};
```

---

## 2. Get All Societies

Retrieve a paginated list of societies with optional filtering.

### Endpoint

```
GET /api/v1/societies
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` users can only see their own society

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `status` | string | - | Filter by status: `"active"` or `"expired"` |
| `type` | string | - | Filter by type: `"apartment"` or `"office"` |
| `search` | string | - | Search by name, city, or state (case-insensitive) |

### Example Request

```
GET /api/v1/societies?page=1&limit=10&status=active&type=apartment&search=Mumbai
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Societies retrieved successfully",
  "data": {
    "societies": [
      {
        "id": 1,
        "name": "Green Valley Apartments",
        "type": "apartment",
        "address": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra",
        "pincode": "400001",
        "subscriptionId": 1,
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "_count": {
          "users": 5
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

const useSocieties = (filters = {}) => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  const fetchSocieties = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: filters.limit || 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await apiClient.get('/societies', { params });

      if (response.data.success) {
        setSocieties(response.data.data.societies);
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', 'Failed to fetch societies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, [filters.status, filters.type, filters.search]);

  return {
    societies,
    loading,
    error,
    pagination,
    refetch: fetchSocieties,
    loadMore: () => {
      if (pagination && pagination.page < pagination.pages) {
        fetchSocieties(pagination.page + 1);
      }
    },
  };
};

// Usage in Component
const SocietiesListScreen = () => {
  const [filters, setFilters] = useState({
    status: 'active',
    type: 'apartment',
  });
  const { societies, loading, pagination, refetch, loadMore } = useSocieties(filters);

  return (
    <FlatList
      data={societies}
      keyExtractor={(item) => item.id.toString()}
      onRefresh={refetch}
      refreshing={loading}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => (
        <View>
          <Text>{item.name}</Text>
          <Text>{item.type}</Text>
          <Text>{item.city}, {item.state}</Text>
          <Text>Users: {item._count.users}</Text>
        </View>
      )}
      ListFooterComponent={
        pagination && pagination.page < pagination.pages ? (
          <ActivityIndicator />
        ) : null
      }
    />
  );
};
```

### Simple Fetch Example

```javascript
const getSocieties = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get('/societies', { params });
    
    if (response.data.success) {
      return {
        societies: response.data.data.societies,
        pagination: response.data.data.pagination,
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Failed to fetch societies:', error);
    throw error;
  }
};

// Usage
const loadSocieties = async () => {
  try {
    const result = await getSocieties(1, 10, {
      status: 'active',
      type: 'apartment',
      search: 'Mumbai',
    });
    console.log('Societies:', result.societies);
    console.log('Total pages:', result.pagination.pages);
  } catch (error) {
    Alert.alert('Error', 'Failed to load societies');
  }
};
```

---

## 3. Get Society by ID

Retrieve a specific society by its ID.

### Endpoint

```
GET /api/v1/societies/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `RESIDENT`, `SECURITY`
- **Note**: Non-`SUPER_ADMIN` users can only access their own society (based on `society_id` in their profile).

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Society ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Society retrieved successfully",
  "data": {
    "society": {
      "id": 1,
      "name": "Green Valley Apartments",
      "type": "apartment",
      "address": "123 Main Street",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "subscriptionId": 1,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "users": 5
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
  "message": "Society not found"
}
```

**403 Forbidden** - User trying to access another society
```json
{
  "success": false,
  "message": "Access denied. You can only view your own society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';

const useSociety = (societyId) => {
  const [society, setSociety] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSociety = async () => {
    if (!societyId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/societies/${societyId}`);
      
      if (response.data.success) {
        setSociety(response.data.data.society);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Society not found');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to fetch society');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSociety();
  }, [societyId]);

  return { society, loading, error, refetch: fetchSociety };
};

// Usage in Component
const SocietyDetailScreen = ({ route }) => {
  const { societyId } = route.params;
  const { society, loading, error } = useSociety(societyId);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;
  if (!society) return <Text>Society not found</Text>;

  return (
    <View>
      <Text>{society.name}</Text>
      <Text>Type: {society.type}</Text>
      <Text>Address: {society.address}</Text>
      <Text>City: {society.city}</Text>
      <Text>State: {society.state}</Text>
      <Text>Pincode: {society.pincode}</Text>
      <Text>Status: {society.status}</Text>
      <Text>Total Users: {society._count.users}</Text>
    </View>
  );
};
```

### Simple Fetch Example

```javascript
const getSocietyById = async (societyId) => {
  try {
    const response = await apiClient.get(`/societies/${societyId}`);
    
    if (response.data.success) {
      return response.data.data.society;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Society does not exist');
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only view your own society');
    } else {
      Alert.alert('Error', 'Failed to fetch society');
    }
    throw error;
  }
};

// Usage
const loadSociety = async () => {
  try {
    const society = await getSocietyById(1);
    console.log('Society:', society);
  } catch (error) {
    // Error already handled
  }
};
```

---

## 4. Update Society

Update an existing society's information.

### Endpoint

```
PUT /api/v1/societies/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` can only update their own society.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Society ID |

### Request Body

All fields are optional. Only include fields you want to update.

```json
{
  "name": "Green Valley Apartments Updated",
  "type": "apartment",
  "address": "456 New Street",
  "city": "Pune",
  "state": "Maharashtra",
  "pincode": "411001",
  "subscriptionId": 2,
  "status": "active"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Society name |
| `type` | string | No | Must be `"apartment"` or `"office"` |
| `address` | string | No | Street address (use `null` to clear) |
| `city` | string | No | City name (use `null` to clear) |
| `state` | string | No | State name (use `null` to clear) |
| `pincode` | string | No | Postal code (use `null` to clear) |
| `subscriptionId` | integer | No | **SUPER_ADMIN only** |
| `status` | string | No | **SUPER_ADMIN only**. Must be `"active"` or `"expired"` |

### Success Response (200)

```json
{
  "success": true,
  "message": "Society updated successfully",
  "data": {
    "society": {
      "id": 1,
      "name": "Green Valley Apartments Updated",
      "type": "apartment",
      "address": "456 New Street",
      "city": "Pune",
      "state": "Maharashtra",
      "pincode": "411001",
      "subscriptionId": 2,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
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
      "msg": "Type must be either \"apartment\" or \"office\"",
      "param": "type",
      "location": "body"
    }
  ]
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Society not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Access denied. SUPER_ADMIN role required."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';

const updateSociety = async (societyId, updateData) => {
  try {
    // Only include fields that have values
    const payload = {};
    if (updateData.name !== undefined) payload.name = updateData.name;
    if (updateData.type !== undefined) payload.type = updateData.type;
    if (updateData.address !== undefined) payload.address = updateData.address;
    if (updateData.city !== undefined) payload.city = updateData.city;
    if (updateData.state !== undefined) payload.state = updateData.state;
    if (updateData.pincode !== undefined) payload.pincode = updateData.pincode;
    if (updateData.subscriptionId !== undefined) payload.subscriptionId = updateData.subscriptionId;
    if (updateData.status !== undefined) payload.status = updateData.status;

    const response = await apiClient.put(`/societies/${societyId}`, payload);

    if (response.data.success) {
      return response.data.data.society;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      const errors = error.response.data.errors || [];
      errors.forEach(err => {
        console.error(`${err.param}: ${err.msg}`);
      });
      Alert.alert('Validation Error', errors[0]?.msg || 'Invalid data');
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'Only Super Admins can update societies');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Society does not exist');
    } else {
      Alert.alert('Error', 'Failed to update society');
    }
    throw error;
  }
};

// Usage in Form Component
const SocietyEditScreen = ({ route, navigation }) => {
  const { society } = route.params;
  const [formData, setFormData] = useState({
    name: society.name,
    type: society.type,
    address: society.address || '',
    city: society.city || '',
    state: society.state || '',
    pincode: society.pincode || '',
    status: society.status,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const updated = await updateSociety(society.id, formData);
      Alert.alert('Success', 'Society updated successfully');
      navigation.goBack();
      // Optionally refresh the list
    } catch (error) {
      // Error already handled in updateSociety
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      <TextInput
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Society Name"
      />
      <Picker
        selectedValue={formData.type}
        onValueChange={(value) => setFormData({ ...formData, type: value })}
      >
        <Picker.Item label="Apartment" value="apartment" />
        <Picker.Item label="Office" value="office" />
      </Picker>
      <TextInput
        value={formData.address}
        onChangeText={(text) => setFormData({ ...formData, address: text })}
        placeholder="Address"
      />
      <TextInput
        value={formData.city}
        onChangeText={(text) => setFormData({ ...formData, city: text })}
        placeholder="City"
      />
      <TextInput
        value={formData.state}
        onChangeText={(text) => setFormData({ ...formData, state: text })}
        placeholder="State"
      />
      <TextInput
        value={formData.pincode}
        onChangeText={(text) => setFormData({ ...formData, pincode: text })}
        placeholder="Pincode"
        keyboardType="numeric"
      />
      <Button
        title={loading ? 'Updating...' : 'Update Society'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </ScrollView>
  );
};
```

---

## 5. Delete Society

Delete a society. **Note**: Cannot delete a society that has users.

### Endpoint

```
DELETE /api/v1/societies/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN` only

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Society ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Society deleted successfully"
}
```

### Error Responses

**400 Bad Request** - Society has users
```json
{
  "success": false,
  "message": "Cannot delete society with existing users. Please remove users first."
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Society not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Access denied. SUPER_ADMIN role required."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const deleteSociety = async (societyId) => {
  try {
    const response = await apiClient.delete(`/societies/${societyId}`);

    if (response.data.success) {
      return true;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert(
        'Cannot Delete',
        error.response.data.message || 'This society has users and cannot be deleted'
      );
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'Only Super Admins can delete societies');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Society does not exist');
    } else {
      Alert.alert('Error', 'Failed to delete society');
    }
    throw error;
  }
};

// Usage with Confirmation
const handleDeleteSociety = (societyId, societyName) => {
  Alert.alert(
    'Delete Society',
    `Are you sure you want to delete "${societyName}"? This action cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSociety(societyId);
            Alert.alert('Success', 'Society deleted successfully');
            // Navigate back or refresh list
            navigation.goBack();
          } catch (error) {
            // Error already handled in deleteSociety
          }
        },
      },
    ]
  );
};

// Usage in Component
const SocietyDetailScreen = ({ route, navigation }) => {
  const { society } = route.params;
  const { refetch } = useSociety(society.id);

  const handleDelete = () => {
    handleDeleteSociety(society.id, society.name);
  };

  return (
    <View>
      {/* Society details */}
      <Button
        title="Delete Society"
        onPress={handleDelete}
        color="red"
      />
    </View>
  );
};
```

---

## Complete React Native Service Example

Here's a complete service file for all Societies operations:

```javascript
// services/societyService.js
import apiClient from './authService';

export const societyService = {
  /**
   * Create a new society
   * @param {Object} societyData - Society data
   * @returns {Promise<Object>} Created society
   */
  create: async (societyData) => {
    const response = await apiClient.post('/societies', societyData);
    if (response.data.success) {
      return response.data.data.society;
    }
    throw new Error(response.data.message);
  },

  /**
   * Get all societies with pagination and filters
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.status - Filter by status
   * @param {string} options.type - Filter by type
   * @param {string} options.search - Search query
   * @returns {Promise<Object>} Societies and pagination info
   */
  getAll: async (options = {}) => {
    const params = {
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.status && { status: options.status }),
      ...(options.type && { type: options.type }),
      ...(options.search && { search: options.search }),
    };

    const response = await apiClient.get('/societies', { params });
    if (response.data.success) {
      return {
        societies: response.data.data.societies,
        pagination: response.data.data.pagination,
      };
    }
    throw new Error(response.data.message);
  },

  /**
   * Get society by ID
   * @param {number} societyId - Society ID
   * @returns {Promise<Object>} Society object
   */
  getById: async (societyId) => {
    const response = await apiClient.get(`/societies/${societyId}`);
    if (response.data.success) {
      return response.data.data.society;
    }
    throw new Error(response.data.message);
  },

  /**
   * Update society
   * @param {number} societyId - Society ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated society
   */
  update: async (societyId, updateData) => {
    const response = await apiClient.put(`/societies/${societyId}`, updateData);
    if (response.data.success) {
      return response.data.data.society;
    }
    throw new Error(response.data.message);
  },

  /**
   * Delete society
   * @param {number} societyId - Society ID
   * @returns {Promise<boolean>} Success status
   */
  delete: async (societyId) => {
    const response = await apiClient.delete(`/societies/${societyId}`);
    if (response.data.success) {
      return true;
    }
    throw new Error(response.data.message);
  },
};

export default societyService;
```

### Usage Example

```javascript
import societyService from '../services/societyService';
import { Alert } from 'react-native';

// Create society
const create = async () => {
  try {
    const society = await societyService.create({
      name: 'New Society',
      type: 'apartment',
      city: 'Mumbai',
    });
    Alert.alert('Success', 'Society created');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Get all societies
const fetchAll = async () => {
  try {
    const result = await societyService.getAll({
      page: 1,
      limit: 20,
      status: 'active',
      type: 'apartment',
    });
    console.log('Societies:', result.societies);
    console.log('Total:', result.pagination.total);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Get single society
const fetchOne = async (id) => {
  try {
    const society = await societyService.getById(id);
    console.log('Society:', society);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Update society
const update = async (id) => {
  try {
    const updated = await societyService.update(id, {
      name: 'Updated Name',
      city: 'Pune',
    });
    Alert.alert('Success', 'Society updated');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Delete society
const deleteSociety = async (id) => {
  try {
    await societyService.delete(id);
    Alert.alert('Success', 'Society deleted');
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
  const response = await apiClient.get('/societies');
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
    const errorMessages = errors.map(err => `${err.param}: ${err.msg}`).join('\n');
    Alert.alert('Validation Error', errorMessages);
  }
};
```

### 3. Permission Errors

```javascript
const handlePermissionError = (error) => {
  if (error.response?.status === 403) {
    Alert.alert(
      'Access Denied',
      'You do not have permission to perform this action'
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
    society?: Society;
    societies?: Society[];
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

## Society Object Schema

```typescript
interface Society {
  id: number;
  name: string;
  type: 'apartment' | 'office';
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  subscriptionId?: number | null;
  status: 'active' | 'expired';
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  _count?: {
    users: number;
  };
}
```

---

## Role-Based Access Summary

| Operation | SUPER_ADMIN | SOCIETY_ADMIN | SECURITY | RESIDENT |
|-----------|-------------|---------------|----------|----------|
| Create Society | ✅ | ❌ | ❌ | ❌ |
| Get All Societies | ✅ | ✅ (own only) | ❌ | ❌ |
| Get Society by ID | ✅ | ✅ (own only) | ❌ | ❌ |
| Update Society | ✅ | ❌ | ❌ | ❌ |
| Delete Society | ✅ | ❌ | ❌ | ❌ |

---

## Testing with Swagger UI

You can test all endpoints using Swagger UI:

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:1111/api-docs`
3. Navigate to **v1 - Societies** section
4. Click "Authorize" and enter your Bearer token
5. Test each endpoint

---

## Next Steps

1. Set up authentication in your React Native app (see [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md))
2. Implement the society service in your app
3. Create UI components for listing, viewing, creating, editing, and deleting societies
4. Add proper error handling and loading states
5. Test with your backend API

---

## Support

- **Swagger UI**: `http://localhost:1111/api-docs`
- **API Base URL**: `http://localhost:1111/api/v1`
- **Authentication Docs**: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

