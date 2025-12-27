# Users CRUD Operations API Documentation

Complete documentation for Users CRUD operations with React Native integration examples.

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
| POST | `/users` | Create a new user | SUPER_ADMIN |
| GET | `/users` | Get all users (with pagination & filters) | SUPER_ADMIN, SOCIETY_ADMIN |
| GET | `/users/:id` | Get user by ID | SUPER_ADMIN, SOCIETY_ADMIN |
| PUT | `/users/:id` | Update user | SUPER_ADMIN, SOCIETY_ADMIN |
| DELETE | `/users/:id` | Delete user | SUPER_ADMIN |

---

## 1. Create User

Create a new user (typically a Society Admin). When creating a SOCIETY_ADMIN with a society, a 60-day trial subscription is automatically created.

### Endpoint

```
POST /api/v1/users
```

### Authorization

- **Required Role**: `SUPER_ADMIN` only

### Request Body

```json
{
  "name": "John Doe",
  "mobile": "1234567890",
  "email": "john@example.com",
  "password": "password123",
  "societyId": 1,
  "roleId": 2,
  "status": "active"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | User's full name |
| `mobile` | string | Yes | 10-digit mobile number (must be unique) |
| `email` | string | No | Email address (must be unique if provided) |
| `password` | string | No | Password (min 6 characters, required for admins) |
| `societyId` | integer | No | Society ID to assign user to |
| `roleId` | integer | No | Role ID (defaults to SOCIETY_ADMIN if not provided) |
| `status` | string | No | User status: `"active"` or `"blocked"` (default: `"active"`) |

### Role IDs Reference

Common role IDs (may vary based on your database):
- `1` - SUPER_ADMIN
- `2` - SOCIETY_ADMIN
- `3` - SECURITY
- `4` - RESIDENT

### Success Response (201)

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "1234567890",
      "roleId": 2,
      "role": {
        "id": 2,
        "name": "SOCIETY_ADMIN",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "societyId": 1,
      "society": {
        "id": 1,
        "name": "Green Valley Apartments",
        "type": "apartment"
      },
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Error Responses

**400 Bad Request** - Validation error or duplicate
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Mobile must be 10 digits",
      "param": "mobile",
      "location": "body"
    }
  ]
}
```

**400 Bad Request** - Duplicate mobile
```json
{
  "success": false,
  "message": "User with this mobile number already exists"
}
```

**400 Bad Request** - Duplicate email
```json
{
  "success": false,
  "message": "User with this email already exists"
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
import { Alert } from 'react-native';

const createUser = async (userData) => {
  try {
    const response = await apiClient.post('/users', {
      name: userData.name,
      mobile: userData.mobile,
      email: userData.email,
      password: userData.password,
      societyId: userData.societyId,
      roleId: userData.roleId,
      status: userData.status || 'active',
    });

    if (response.data.success) {
      console.log('User created:', response.data.data.user);
      return response.data.data.user;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      // Handle validation errors
      if (error.response.data.errors) {
        const errors = error.response.data.errors;
        errors.forEach(err => {
          console.error(`${err.param}: ${err.msg}`);
        });
        Alert.alert('Validation Error', errors[0]?.msg || 'Invalid data');
      } else {
        Alert.alert('Error', error.response.data.message);
      }
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'Only Super Admins can create users');
    } else {
      Alert.alert('Error', 'Failed to create user');
    }
    throw error;
  }
};

// Usage
const handleCreateUser = async () => {
  try {
    const newUser = await createUser({
      name: 'John Doe',
      mobile: '1234567890',
      email: 'john@example.com',
      password: 'password123',
      societyId: 1,
      roleId: 2, // SOCIETY_ADMIN
      status: 'active',
    });
    Alert.alert('Success', 'User created successfully');
    // Navigate or refresh list
  } catch (error) {
    // Error already handled in createUser
  }
};
```

---

## 2. Get All Users

Retrieve a paginated list of users with optional filtering.

### Endpoint

```
GET /api/v1/users
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` users can only see users from their own society

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `status` | string | - | Filter by status: `"active"` or `"blocked"` |
| `roleId` | integer | - | Filter by role ID |
| `societyId` | integer | - | Filter by society ID |
| `search` | string | - | Search by name, email, or mobile (case-insensitive) |

### Example Request

```
GET /api/v1/users?page=1&limit=10&status=active&roleId=2&societyId=1&search=john
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "mobile": "1234567890",
        "roleId": 2,
        "role": {
          "id": 2,
          "name": "SOCIETY_ADMIN",
          "createdAt": "2024-01-01T00:00:00.000Z"
        },
        "societyId": 1,
        "society": {
          "id": 1,
          "name": "Green Valley Apartments",
          "type": "apartment"
        },
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
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

const useUsers = (filters = {}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: filters.limit || 10,
        ...(filters.status && { status: filters.status }),
        ...(filters.roleId && { roleId: filters.roleId }),
        ...(filters.societyId && { societyId: filters.societyId }),
        ...(filters.search && { search: filters.search }),
      };

      const response = await apiClient.get('/users', { params });

      if (response.data.success) {
        if (page === 1) {
          setUsers(response.data.data.users);
        } else {
          setUsers(prev => [...prev, ...response.data.data.users]);
        }
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.status, filters.roleId, filters.societyId, filters.search]);

  return {
    users,
    loading,
    error,
    pagination,
    refetch: () => fetchUsers(1),
    loadMore: () => {
      if (pagination && pagination.page < pagination.pages) {
        fetchUsers(pagination.page + 1);
      }
    },
  };
};

// Usage in Component
const UsersListScreen = () => {
  const [filters, setFilters] = useState({
    status: 'active',
    roleId: 2, // SOCIETY_ADMIN
  });
  const { users, loading, pagination, refetch, loadMore } = useUsers(filters);

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id.toString()}
      onRefresh={refetch}
      refreshing={loading}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => (
        <View style={{ padding: 15, borderBottomWidth: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
          <Text>{item.email || 'No email'}</Text>
          <Text>{item.mobile}</Text>
          <Text>Role: {item.role.name}</Text>
          {item.society && (
            <Text>Society: {item.society.name}</Text>
          )}
          <Text>Status: {item.status}</Text>
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
const getUsers = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get('/users', { params });
    
    if (response.data.success) {
      return {
        users: response.data.data.users,
        pagination: response.data.data.pagination,
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

// Usage
const loadUsers = async () => {
  try {
    const result = await getUsers(1, 10, {
      status: 'active',
      roleId: 2,
      societyId: 1,
      search: 'john',
    });
    console.log('Users:', result.users);
    console.log('Total pages:', result.pagination.pages);
  } catch (error) {
    Alert.alert('Error', 'Failed to load users');
  }
};
```

---

## 3. Get User by ID

Retrieve a specific user by their ID.

### Endpoint

```
GET /api/v1/users/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` users can only access users from their own society

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "1234567890",
      "roleId": 2,
      "role": {
        "id": 2,
        "name": "SOCIETY_ADMIN",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "societyId": 1,
      "society": {
        "id": 1,
        "name": "Green Valley Apartments",
        "type": "apartment",
        "address": "123 Main Street",
        "city": "Mumbai",
        "state": "Maharashtra"
      },
      "status": "active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Error Responses

**404 Not Found**
```json
{
  "success": false,
  "message": "User not found"
}
```

**403 Forbidden** - SOCIETY_ADMIN trying to access user from another society
```json
{
  "success": false,
  "message": "Access denied. You can only view users from your society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/users/${userId}`);
      
      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('User not found');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to fetch user');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [userId]);

  return { user, loading, error, refetch: fetchUser };
};

// Usage in Component
const UserDetailScreen = ({ route }) => {
  const { userId } = route.params;
  const { user, loading, error } = useUser(userId);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;
  if (!user) return <Text>User not found</Text>;

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>{user.name}</Text>
      <Text>Email: {user.email || 'No email'}</Text>
      <Text>Mobile: {user.mobile}</Text>
      <Text>Role: {user.role.name}</Text>
      {user.society && (
        <>
          <Text>Society: {user.society.name}</Text>
          <Text>Society Type: {user.society.type}</Text>
          {user.society.address && (
            <Text>Address: {user.society.address}</Text>
          )}
        </>
      )}
      <Text>Status: {user.status}</Text>
      <Text>Created: {new Date(user.createdAt).toLocaleDateString()}</Text>
    </View>
  );
};
```

### Simple Fetch Example

```javascript
const getUserById = async (userId) => {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    
    if (response.data.success) {
      return response.data.data.user;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      Alert.alert('Not Found', 'User does not exist');
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only view users from your society');
    } else {
      Alert.alert('Error', 'Failed to fetch user');
    }
    throw error;
  }
};

// Usage
const loadUser = async () => {
  try {
    const user = await getUserById(1);
    console.log('User:', user);
  } catch (error) {
    // Error already handled
  }
};
```

---

## 4. Update User

Update an existing user's information.

### Endpoint

```
PUT /api/v1/users/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`
- **Note**: `SOCIETY_ADMIN` users can only update users from their own society

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

### Request Body

All fields are optional. Only include fields you want to update.

```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "mobile": "9876543210",
  "password": "newpassword123",
  "societyId": 2,
  "roleId": 3,
  "status": "blocked"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | User's full name |
| `mobile` | string | No | 10-digit mobile number (must be unique) |
| `email` | string | No | Email address (must be unique if provided, use `null` to clear) |
| `password` | string | No | New password (min 6 characters) |
| `societyId` | integer | No | Society ID (use `null` to remove from society) |
| `roleId` | integer | No | Role ID |
| `status` | string | No | User status: `"active"` or `"blocked"` |

### Success Response (200)

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe Updated",
      "email": "john.updated@example.com",
      "mobile": "9876543210",
      "roleId": 3,
      "role": {
        "id": 3,
        "name": "SECURITY",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "societyId": 2,
      "society": {
        "id": 2,
        "name": "New Society",
        "type": "office"
      },
      "status": "blocked",
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
      "msg": "Mobile must be 10 digits",
      "param": "mobile",
      "location": "body"
    }
  ]
}
```

**400 Bad Request** - Duplicate mobile
```json
{
  "success": false,
  "message": "User with this mobile number already exists"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "User not found"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Access denied. You can only update users from your society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const updateUser = async (userId, updateData) => {
  try {
    // Only include fields that have values
    const payload = {};
    if (updateData.name !== undefined) payload.name = updateData.name;
    if (updateData.mobile !== undefined) payload.mobile = updateData.mobile;
    if (updateData.email !== undefined) payload.email = updateData.email;
    if (updateData.password !== undefined) payload.password = updateData.password;
    if (updateData.societyId !== undefined) payload.societyId = updateData.societyId;
    if (updateData.roleId !== undefined) payload.roleId = updateData.roleId;
    if (updateData.status !== undefined) payload.status = updateData.status;

    const response = await apiClient.put(`/users/${userId}`, payload);

    if (response.data.success) {
      return response.data.data.user;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      if (error.response.data.errors) {
        const errors = error.response.data.errors || [];
        errors.forEach(err => {
          console.error(`${err.param}: ${err.msg}`);
        });
        Alert.alert('Validation Error', errors[0]?.msg || 'Invalid data');
      } else {
        Alert.alert('Error', error.response.data.message);
      }
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only update users from your society');
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'User does not exist');
    } else {
      Alert.alert('Error', 'Failed to update user');
    }
    throw error;
  }
};

// Usage in Form Component
const UserEditScreen = ({ route, navigation }) => {
  const { user } = route.params;
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email || '',
    mobile: user.mobile,
    password: '',
    societyId: user.societyId,
    roleId: user.roleId,
    status: user.status,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Only send password if it's been changed
      const updatePayload = { ...formData };
      if (!updatePayload.password) {
        delete updatePayload.password;
      }

      const updated = await updateUser(user.id, updatePayload);
      Alert.alert('Success', 'User updated successfully');
      navigation.goBack();
      // Optionally refresh the list
    } catch (error) {
      // Error already handled in updateUser
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <TextInput
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Name"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        placeholder="Email"
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        value={formData.mobile}
        onChangeText={(text) => setFormData({ ...formData, mobile: text })}
        placeholder="Mobile (10 digits)"
        keyboardType="phone-pad"
        maxLength={10}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <TextInput
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        placeholder="New Password (leave empty to keep current)"
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      <Picker
        selectedValue={formData.status}
        onValueChange={(value) => setFormData({ ...formData, status: value })}
      >
        <Picker.Item label="Active" value="active" />
        <Picker.Item label="Blocked" value="blocked" />
      </Picker>
      <Button
        title={loading ? 'Updating...' : 'Update User'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </ScrollView>
  );
};
```

---

## 5. Delete User

Delete a user. **Note**: Cannot delete SUPER_ADMIN users.

### Endpoint

```
DELETE /api/v1/users/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN` only

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | User ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### Error Responses

**403 Forbidden** - Cannot delete SUPER_ADMIN
```json
{
  "success": false,
  "message": "Cannot delete SUPER_ADMIN user"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "User not found"
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
import { Alert } from 'react-native';

const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/users/${userId}`);

    if (response.data.success) {
      return true;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 403) {
      if (error.response.data.message.includes('SUPER_ADMIN')) {
        Alert.alert('Cannot Delete', 'SUPER_ADMIN users cannot be deleted');
      } else {
        Alert.alert('Access Denied', 'Only Super Admins can delete users');
      }
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'User does not exist');
    } else {
      Alert.alert('Error', 'Failed to delete user');
    }
    throw error;
  }
};

// Usage with Confirmation
const handleDeleteUser = (userId, userName) => {
  Alert.alert(
    'Delete User',
    `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(userId);
            Alert.alert('Success', 'User deleted successfully');
            // Navigate back or refresh list
            navigation.goBack();
          } catch (error) {
            // Error already handled in deleteUser
          }
        },
      },
    ]
  );
};

// Usage in Component
const UserDetailScreen = ({ route, navigation }) => {
  const { user } = route.params;
  const { refetch } = useUser(user.id);

  const handleDelete = () => {
    handleDeleteUser(user.id, user.name);
  };

  return (
    <View>
      {/* User details */}
      <Button
        title="Delete User"
        onPress={handleDelete}
        color="red"
      />
    </View>
  );
};
```

---

## Complete React Native Service Example

Here's a complete service file for all Users operations:

```javascript
// services/userService.js
import apiClient from './authService';

export const userService = {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  create: async (userData) => {
    const response = await apiClient.post('/users', userData);
    if (response.data.success) {
      return response.data.data.user;
    }
    throw new Error(response.data.message);
  },

  /**
   * Get all users with pagination and filters
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   * @param {string} options.status - Filter by status
   * @param {number} options.roleId - Filter by role ID
   * @param {number} options.societyId - Filter by society ID
   * @param {string} options.search - Search query
   * @returns {Promise<Object>} Users and pagination info
   */
  getAll: async (options = {}) => {
    const params = {
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.status && { status: options.status }),
      ...(options.roleId && { roleId: options.roleId }),
      ...(options.societyId && { societyId: options.societyId }),
      ...(options.search && { search: options.search }),
    };

    const response = await apiClient.get('/users', { params });
    if (response.data.success) {
      return {
        users: response.data.data.users,
        pagination: response.data.data.pagination,
      };
    }
    throw new Error(response.data.message);
  },

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User object
   */
  getById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    if (response.data.success) {
      return response.data.data.user;
    }
    throw new Error(response.data.message);
  },

  /**
   * Update user
   * @param {number} userId - User ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  update: async (userId, updateData) => {
    const response = await apiClient.put(`/users/${userId}`, updateData);
    if (response.data.success) {
      return response.data.data.user;
    }
    throw new Error(response.data.message);
  },

  /**
   * Delete user
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  delete: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    if (response.data.success) {
      return true;
    }
    throw new Error(response.data.message);
  },
};

export default userService;
```

### Usage Example

```javascript
import userService from '../services/userService';
import { Alert } from 'react-native';

// Create user
const create = async () => {
  try {
    const user = await userService.create({
      name: 'John Doe',
      mobile: '1234567890',
      email: 'john@example.com',
      password: 'password123',
      societyId: 1,
      roleId: 2,
    });
    Alert.alert('Success', 'User created');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Get all users
const fetchAll = async () => {
  try {
    const result = await userService.getAll({
      page: 1,
      limit: 20,
      status: 'active',
      roleId: 2,
      societyId: 1,
    });
    console.log('Users:', result.users);
    console.log('Total:', result.pagination.total);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Get single user
const fetchOne = async (id) => {
  try {
    const user = await userService.getById(id);
    console.log('User:', user);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Update user
const update = async (id) => {
  try {
    const updated = await userService.update(id, {
      name: 'John Doe Updated',
      email: 'john.updated@example.com',
      status: 'active',
    });
    Alert.alert('Success', 'User updated');
  } catch (error) {
    Alert.alert('Error', error.message);
  }
};

// Delete user
const deleteUser = async (id) => {
  try {
    await userService.delete(id);
    Alert.alert('Success', 'User deleted');
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
  const response = await apiClient.get('/users');
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
  } else if (error.response?.status === 400) {
    // Duplicate mobile/email error
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
    user?: User;
    users?: User[];
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

## User Object Schema

```typescript
interface User {
  id: number;
  name: string;
  email?: string | null;
  mobile: string;
  roleId: number;
  role: {
    id: number;
    name: 'SUPER_ADMIN' | 'SOCIETY_ADMIN' | 'SECURITY' | 'RESIDENT';
    createdAt: string;
  };
  societyId?: number | null;
  society?: {
    id: number;
    name: string;
    type: 'apartment' | 'office';
    // Note: address, city, state are only included in getUserById response
    // getAllUsers and updateUser responses only include id, name, type
    address?: string;
    city?: string;
    state?: string;
  } | null;
  status: 'active' | 'blocked';
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
}
```

### Response Structure Notes

**Role Object**: All endpoints return the role object with:
- `id`: Role ID
- `name`: Role name (SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT)
- `createdAt`: Role creation timestamp

**Society Object**: The level of detail varies by endpoint:
- **`getAllUsers`**: Returns `id`, `name`, `type` only
- **`getUserById`**: Returns `id`, `name`, `type`, `address`, `city`, `state`
- **`createUser`**: Returns `id`, `name`, `type` only
- **`updateUser`**: Returns `id`, `name`, `type` only

---

## Role-Based Access Summary

| Operation | SUPER_ADMIN | SOCIETY_ADMIN | SECURITY | RESIDENT |
|-----------|-------------|---------------|----------|----------|
| Create User | ✅ | ❌ | ❌ | ❌ |
| Get All Users | ✅ | ✅ (own society only) | ❌ | ❌ |
| Get User by ID | ✅ | ✅ (own society only) | ❌ | ❌ |
| Update User | ✅ | ✅ (own society only) | ❌ | ❌ |
| Delete User | ✅ | ❌ | ❌ | ❌ |

---

## Special Notes

### Trial Subscription

When creating a `SOCIETY_ADMIN` user with a `societyId`, the system automatically creates a 60-day trial subscription for that society (if no subscription already exists).

### Password Requirements

- Minimum 6 characters
- Required for admin users (SUPER_ADMIN, SOCIETY_ADMIN)
- Optional for other roles (they use OTP login)

### Mobile Number

- Must be exactly 10 digits
- Must be unique across all users
- Used for OTP-based login

### Email

- Optional field
- Must be unique if provided
- Can be set to `null` to remove email

### Status

- `"active"`: User can log in and use the system
- `"blocked"`: User is blocked and cannot log in

---

## Testing with Swagger UI

You can test all endpoints using Swagger UI:

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:1111/api-docs`
3. Navigate to **v1 - Users** section
4. Click "Authorize" and enter your Bearer token
5. Test each endpoint

---

## Next Steps

1. Set up authentication in your React Native app (see [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md))
2. Implement the user service in your app
3. Create UI components for listing, viewing, creating, editing, and deleting users
4. Add proper error handling and loading states
5. Implement role-based UI restrictions
6. Test with your backend API

---

## Support

- **Swagger UI**: `http://localhost:1111/api-docs`
- **API Base URL**: `http://localhost:1111/api/v1`
- **Authentication Docs**: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)
- **Societies API**: [SOCIETIES_CRUD_API.md](./SOCIETIES_CRUD_API.md)

