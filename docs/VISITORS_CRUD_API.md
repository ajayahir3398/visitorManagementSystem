# Visitors CRUD Operations API Documentation

Complete documentation for Visitors CRUD operations with React Native integration examples.

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
| POST | `/visitors` | Create a new visitor | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY |
| GET | `/visitors` | Get all visitors (with pagination & filters) | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT |
| GET | `/visitors/search` | Search visitors by name or mobile | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT |
| GET | `/visitors/:id` | Get visitor by ID | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY, RESIDENT |
| PUT | `/visitors/:id` | Update visitor | SUPER_ADMIN, SOCIETY_ADMIN, SECURITY |
| DELETE | `/visitors/:id` | Delete visitor | SUPER_ADMIN, SOCIETY_ADMIN |

---

## 1. Create Visitor

Create a new visitor. If a visitor with the same mobile number already exists, the existing visitor is returned instead of creating a duplicate.

### Endpoint

```
POST /api/v1/visitors
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`

### Request Body

```json
{
  "name": "John Doe",
  "mobile": "1234567890",
  "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Visitor's full name |
| `mobile` | string | Yes | 10-digit mobile number |
| `photoBase64` | string | No | Base64 data URI for visitor's photo |

### Success Response (201) - New Visitor Created

```json
{
  "success": true,
  "message": "Visitor created successfully",
  "data": {
    "visitor": {
      "id": 1,
      "name": "John Doe",
      "mobile": "1234567890",
      "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Success Response (200) - Visitor Already Exists

If a visitor with the same mobile number already exists, the API returns the existing visitor with status 200:

```json
{
  "success": true,
  "message": "Visitor already exists",
  "data": {
    "visitor": {
      "id": 1,
      "name": "John Doe",
      "mobile": "1234567890",
      "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "createdAt": "2024-01-01T00:00:00.000Z"
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

**400 Bad Request** - Invalid mobile format
```json
{
  "success": false,
  "message": "Mobile must be 10 digits"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const createVisitor = async (visitorData) => {
  try {
    const response = await apiClient.post('/visitors', {
      name: visitorData.name.trim(),
      mobile: visitorData.mobile,
      photoBase64: visitorData.photoBase64 || null,
    });

    if (response.data.success) {
      // Check if visitor was created or already existed
      const isNew = response.status === 201;
      console.log(isNew ? 'Visitor created' : 'Visitor already exists', response.data.data.visitor);
      return response.data.data.visitor;
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
    } else {
      Alert.alert('Error', 'Failed to create visitor');
    }
    throw error;
  }
};

// Usage
const handleCreateVisitor = async () => {
  try {
    const visitor = await createVisitor({
      name: 'John Doe',
      mobile: '1234567890',
      photoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
    });
    Alert.alert('Success', 'Visitor processed successfully');
    // Navigate or refresh list
  } catch (error) {
    // Error already handled in createVisitor
  }
};
```

### React Native Form Example

```javascript
import { useState } from 'react';
import { View, TextInput, Button, Alert, ActivityIndicator, Image } from 'react-native';
import apiClient from '../services/authService';
import * as ImagePicker from 'expo-image-picker';

const CreateVisitorScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [photoBase64, setPhotoBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setUploading(true);
      const asset = result.assets[0];
      if (asset?.base64) {
        const mime = asset.mimeType || 'image/jpeg';
        setPhotoBase64(`data:${mime};base64,${asset.base64}`);
      }
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!mobile || !/^[0-9]{10}$/.test(mobile)) {
      Alert.alert('Error', 'Mobile must be 10 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/visitors', {
        name: name.trim(),
        mobile,
        photoBase64,
      });

      if (response.data.success) {
        const isNew = response.status === 201;
        Alert.alert(
          isNew ? 'Success' : 'Info',
          isNew ? 'Visitor created successfully' : 'Visitor already exists',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      if (error.response?.status === 400) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to create visitor');
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
          marginBottom: 15,
          borderRadius: 5,
        }}
        placeholder="Visitor Name"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
        placeholder="Mobile (10 digits)"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        maxLength={10}
        editable={!loading}
      />
      {photoBase64 && (
        <Image
          source={{ uri: photoBase64 }}
          style={{ width: 100, height: 100, marginBottom: 15, borderRadius: 50 }}
        />
      )}
      <Button
        title={uploading ? 'Uploading...' : 'Pick Photo'}
        onPress={pickImage}
        disabled={loading || uploading}
      />
      <Button
        title={loading ? 'Creating...' : 'Create Visitor'}
        onPress={handleSubmit}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
};
```

---

## 2. Get All Visitors

Retrieve a paginated list of visitors with optional filtering and search.

### Endpoint

```
GET /api/v1/visitors
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`, `RESIDENT`
- **Note**: `RESIDENT` users can only see visitors who have visited their society

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 10 | Items per page (max 100) |
| `search` | string | - | Search by name or mobile (case-insensitive) |
| `mobile` | string | - | Filter by exact mobile number |

### Example Request

```
GET /api/v1/visitors?page=1&limit=10&search=John
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitors retrieved successfully",
  "data": {
    "visitors": [
      {
        "id": 1,
        "name": "John Doe",
        "mobile": "1234567890",
        "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "_count": {
          "visitorLogs": 5
        }
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "mobile": "9876543210",
        "photoBase64": null,
        "createdAt": "2024-01-02T00:00:00.000Z",
        "_count": {
          "visitorLogs": 3
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
import { FlatList, View, Text, ActivityIndicator, RefreshControl, TextInput } from 'react-native';

const useVisitors = (filters = {}) => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);

  const fetchVisitors = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: filters.limit || 10,
        ...(filters.search && { search: filters.search }),
        ...(filters.mobile && { mobile: filters.mobile }),
      };

      const response = await apiClient.get('/visitors', { params });

      if (response.data.success) {
        if (page === 1) {
          setVisitors(response.data.data.visitors);
        } else {
          setVisitors(prev => [...prev, ...response.data.data.visitors]);
        }
        setPagination(response.data.data.pagination);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch visitors');
      console.error('Failed to fetch visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors(1);
  }, [filters.search, filters.mobile]);

  const loadMore = () => {
    if (!loading && pagination && pagination.page < pagination.pages) {
      fetchVisitors(pagination.page + 1);
    }
  };

  const refresh = () => {
    fetchVisitors(1);
  };

  return { visitors, loading, error, pagination, loadMore, refresh };
};

// Usage in Component
const VisitorsListScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { visitors, loading, error, pagination, loadMore, refresh } = useVisitors({
    search: searchQuery,
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
        placeholder="Search by name or mobile..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={visitors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 15, borderBottomWidth: 1 }}>
            {item.photoBase64 && (
              <Image
                source={{ uri: item.photoBase64 }}
                style={{ width: 50, height: 50, borderRadius: 25, marginBottom: 10 }}
              />
            )}
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name}</Text>
            <Text>Mobile: {item.mobile}</Text>
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
              <Text>No visitors found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
```

### Simple Fetch Example

```javascript
const getVisitors = async (page = 1, limit = 10, filters = {}) => {
  try {
    const params = {
      page,
      limit,
      ...(filters.search && { search: filters.search }),
      ...(filters.mobile && { mobile: filters.mobile }),
    };

    const response = await apiClient.get('/visitors', { params });

    if (response.data.success) {
      return {
        visitors: response.data.data.visitors,
        pagination: response.data.data.pagination,
      };
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Failed to fetch visitors:', error);
    throw error;
  }
};

// Usage
const loadVisitors = async () => {
  try {
    const result = await getVisitors(1, 10, {
      search: 'John',
    });
    console.log('Visitors:', result.visitors);
    console.log('Total pages:', result.pagination.pages);
  } catch (error) {
    Alert.alert('Error', 'Failed to load visitors');
  }
};
```

---

## 3. Search Visitors

Quick search endpoint for finding visitors by name or mobile number. Optimized for autocomplete/search suggestions.

### Endpoint

```
GET /api/v1/visitors/search
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`, `RESIDENT`
- **Note**: `RESIDENT` users can only see visitors who have visited their society

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (minimum 2 characters) |
| `limit` | integer | No | Maximum results (default: 20, max: 100) |

### Example Request

```
GET /api/v1/visitors/search?q=John&limit=10
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitors found",
  "data": {
    "visitors": [
      {
        "id": 1,
        "name": "John Doe",
        "mobile": "1234567890",
        "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": 3,
        "name": "Johnny Smith",
        "mobile": "1111111111",
        "photoBase64": null,
        "createdAt": "2024-01-03T00:00:00.000Z"
      }
    ]
  }
}
```

### Error Responses

**400 Bad Request** - Search query too short
```json
{
  "success": false,
  "message": "Search query must be at least 2 characters"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect, useCallback } from 'react';
import { View, TextInput, FlatList, Text, Image } from 'react-native';
import { debounce } from 'lodash';

const VisitorSearchScreen = ({ onSelectVisitor }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchVisitors = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get('/visitors/search', {
        params: { q: searchQuery, limit: 20 },
      });

      if (response.data.success) {
        setResults(response.data.data.visitors);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search to avoid too many API calls
  const debouncedSearch = useCallback(
    debounce((q) => searchVisitors(q), 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query]);

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
        placeholder="Search visitors by name or mobile..."
        value={query}
        onChangeText={setQuery}
        autoFocus
      />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{ padding: 15, borderBottomWidth: 1 }}
            onPress={() => onSelectVisitor(item)}
          >
            {item.photoBase64 && (
              <Image
                source={{ uri: item.photoBase64 }}
                style={{ width: 40, height: 40, borderRadius: 20, marginBottom: 5 }}
              />
            )}
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
            <Text style={{ color: 'gray' }}>{item.mobile}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text>No visitors found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
```

### Simple Search Example

```javascript
const searchVisitors = async (query, limit = 20) => {
  try {
    if (query.length < 2) {
      return [];
    }

    const response = await apiClient.get('/visitors/search', {
      params: { q: query, limit },
    });

    if (response.data.success) {
      return response.data.data.visitors;
    }
    return [];
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};

// Usage
const handleSearch = async () => {
  const results = await searchVisitors('John', 10);
  console.log('Search results:', results);
};
```

---

## 4. Get Visitor by ID

Retrieve a specific visitor by their ID.

### Endpoint

```
GET /api/v1/visitors/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`, `RESIDENT`
- **Note**: `RESIDENT` users can only access visitors who have visited their society

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Visitor ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitor retrieved successfully",
  "data": {
    "visitor": {
      "id": 1,
      "name": "John Doe",
      "mobile": "1234567890",
      "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "visitorLogs": 5
      }
    }
  }
}
```

### Error Responses

**400 Bad Request** - Invalid visitor ID
```json
{
  "success": false,
  "message": "Invalid visitor ID"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Visitor not found"
}
```

**403 Forbidden** - RESIDENT trying to access visitor from another society
```json
{
  "success": false,
  "message": "Access denied. You can only view visitors who have visited your society."
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Image, Alert } from 'react-native';

const useVisitor = (visitorId) => {
  const [visitor, setVisitor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVisitor = async () => {
    if (!visitorId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/visitors/${visitorId}`);
      
      if (response.data.success) {
        setVisitor(response.data.data.visitor);
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Visitor not found');
      } else if (err.response?.status === 403) {
        setError('Access denied');
      } else {
        setError('Failed to fetch visitor');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitor();
  }, [visitorId]);

  return { visitor, loading, error, refetch: fetchVisitor };
};

// Usage in Component
const VisitorDetailScreen = ({ route }) => {
  const { visitorId } = route.params;
  const { visitor, loading, error } = useVisitor(visitorId);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;
  if (!visitor) return <Text>Visitor not found</Text>;

  return (
    <View style={{ padding: 20 }}>
      {visitor.photoBase64 && (
        <Image
          source={{ uri: visitor.photoBase64 }}
          style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 20, alignSelf: 'center' }}
        />
      )}
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center' }}>
        {visitor.name}
      </Text>
      <Text style={{ marginTop: 10, textAlign: 'center' }}>Mobile: {visitor.mobile}</Text>
      <Text style={{ marginTop: 10, textAlign: 'center' }}>
        Visitor Logs: {visitor._count.visitorLogs}
      </Text>
      <Text style={{ color: 'gray', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
        Created: {new Date(visitor.createdAt).toLocaleString()}
      </Text>
    </View>
  );
};
```

### Simple Fetch Example

```javascript
const getVisitorById = async (visitorId) => {
  try {
    const response = await apiClient.get(`/visitors/${visitorId}`);
    
    if (response.data.success) {
      return response.data.data.visitor;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Visitor does not exist');
    } else if (error.response?.status === 403) {
      Alert.alert('Access Denied', 'You can only view visitors from your society');
    } else {
      Alert.alert('Error', 'Failed to fetch visitor');
    }
    throw error;
  }
};

// Usage
const loadVisitor = async () => {
  try {
    const visitor = await getVisitorById(1);
    console.log('Visitor:', visitor);
    console.log('Visitor Logs:', visitor._count.visitorLogs);
  } catch (error) {
    // Error already handled
  }
};
```

---

## 5. Update Visitor

Update an existing visitor's information.

### Endpoint

```
PUT /api/v1/visitors/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SECURITY`

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Visitor ID |

### Request Body

All fields are optional. Only include fields you want to update.

```json
{
  "name": "John Smith",
  "mobile": "9876543210",
  "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Visitor's full name |
| `mobile` | string | No | 10-digit mobile number (must be unique if changed) |
| `photoBase64` | string | No | Base64 data URI for visitor's photo (use `null` to clear) |

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitor updated successfully",
  "data": {
    "visitor": {
      "id": 1,
      "name": "John Smith",
      "mobile": "9876543210",
      "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Error Responses

**400 Bad Request** - Invalid visitor ID
```json
{
  "success": false,
  "message": "Invalid visitor ID"
}
```

**400 Bad Request** - Invalid mobile format
```json
{
  "success": false,
  "message": "Mobile must be 10 digits"
}
```

**400 Bad Request** - Mobile already exists
```json
{
  "success": false,
  "message": "Visitor with this mobile number already exists"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Visitor not found"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const updateVisitor = async (visitorId, updateData) => {
  try {
    const payload = {};
    if (updateData.name) payload.name = updateData.name.trim();
    if (updateData.mobile) payload.mobile = updateData.mobile;
    if (updateData.photoBase64 !== undefined) payload.photoBase64 = updateData.photoBase64;

    const response = await apiClient.put(`/visitors/${visitorId}`, payload);

    if (response.data.success) {
      console.log('Visitor updated:', response.data.data.visitor);
      return response.data.data.visitor;
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
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Visitor does not exist');
    } else {
      Alert.alert('Error', 'Failed to update visitor');
    }
    throw error;
  }
};

// Usage
const handleUpdateVisitor = async () => {
  try {
    const updatedVisitor = await updateVisitor(1, {
      name: 'John Smith',
      mobile: '9876543210',
    });
    Alert.alert('Success', 'Visitor updated successfully');
    // Navigate or refresh
  } catch (error) {
    // Error already handled in updateVisitor
  }
};
```

### React Native Form Example

```javascript
import { useState } from 'react';
import { View, TextInput, Button, Alert, ActivityIndicator, Image } from 'react-native';
import apiClient from '../services/authService';

const VisitorEditScreen = ({ route, navigation }) => {
  const { visitor } = route.params;
  const [name, setName] = useState(visitor.name);
  const [mobile, setMobile] = useState(visitor.mobile);
  const [photoBase64, setPhotoBase64] = useState(visitor.photoBase64);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      Alert.alert('Error', 'Mobile must be 10 digits');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.put(`/visitors/${visitor.id}`, {
        name: name.trim(),
        mobile,
        photoBase64: photoBase64 || null,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Visitor updated successfully', [
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
        Alert.alert('Error', 'Failed to update visitor');
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
          marginBottom: 15,
          borderRadius: 5,
        }}
        placeholder="Visitor Name"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
        placeholder="Mobile (10 digits)"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        maxLength={10}
        editable={!loading}
      />
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 15,
          borderRadius: 5,
        }}
        placeholder="Photo (Base64)"
        value={photoBase64 || ''}
        onChangeText={setPhotoBase64}
        editable={!loading}
      />
      {photoBase64 && (
        <Image
          source={{ uri: photoBase64 }}
          style={{ width: 100, height: 100, marginBottom: 15, borderRadius: 50 }}
        />
      )}
      <Button
        title={loading ? 'Updating...' : 'Update Visitor'}
        onPress={handleSubmit}
        disabled={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
};
```

---

## 6. Delete Visitor

Delete a visitor. Visitors with existing visitor logs cannot be deleted.

### Endpoint

```
DELETE /api/v1/visitors/:id
```

### Authorization

- **Required Role**: `SUPER_ADMIN`, `SOCIETY_ADMIN` only

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Visitor ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Visitor deleted successfully"
}
```

### Error Responses

**400 Bad Request** - Invalid visitor ID
```json
{
  "success": false,
  "message": "Invalid visitor ID"
}
```

**400 Bad Request** - Visitor has logs
```json
{
  "success": false,
  "message": "Cannot delete visitor with existing visitor logs. Please remove visitor logs first."
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Visitor not found"
}
```

### React Native Example

```javascript
import apiClient from '../services/authService';
import { Alert } from 'react-native';

const deleteVisitor = async (visitorId) => {
  try {
    const response = await apiClient.delete(`/visitors/${visitorId}`);

    if (response.data.success) {
      console.log('Visitor deleted successfully');
      return true;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    if (error.response?.status === 400) {
      Alert.alert('Cannot Delete', error.response.data.message);
    } else if (error.response?.status === 404) {
      Alert.alert('Not Found', 'Visitor does not exist');
    } else {
      Alert.alert('Error', 'Failed to delete visitor');
    }
    throw error;
  }
};

// Usage with confirmation
const handleDeleteVisitor = async (visitorId, visitorName) => {
  Alert.alert(
    'Delete Visitor',
    `Are you sure you want to delete "${visitorName}"? This action cannot be undone.`,
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
            await deleteVisitor(visitorId);
            Alert.alert('Success', 'Visitor deleted successfully');
            // Navigate back or refresh list
          } catch (error) {
            // Error already handled in deleteVisitor
          }
        },
      },
    ]
  );
};
```

---

## Complete React Native Service Example

Here's a complete service file for Visitors operations:

```javascript
// services/visitorService.js
import apiClient from './authService';
import { Alert } from 'react-native';

export const visitorService = {
  /**
   * Create a new visitor (or get existing if mobile matches)
   */
  create: async (name, mobile, photoBase64 = null) => {
    try {
      const response = await apiClient.post('/visitors', {
        name: name.trim(),
        mobile,
        photoBase64,
      });

      if (response.data.success) {
        return {
          visitor: response.data.data.visitor,
          isNew: response.status === 201,
        };
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'create');
      throw error;
    }
  },

  /**
   * Get all visitors with pagination and filters
   */
  getAll: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = {
        page,
        limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.mobile && { mobile: filters.mobile }),
      };

      const response = await apiClient.get('/visitors', { params });

      if (response.data.success) {
        return {
          visitors: response.data.data.visitors,
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
   * Search visitors (quick search for autocomplete)
   */
  search: async (query, limit = 20) => {
    try {
      if (query.length < 2) {
        return [];
      }

      const response = await apiClient.get('/visitors/search', {
        params: { q: query, limit },
      });

      if (response.data.success) {
        return response.data.data.visitors;
      }
      return [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  },

  /**
   * Get visitor by ID
   */
  getById: async (visitorId) => {
    try {
      const response = await apiClient.get(`/visitors/${visitorId}`);

      if (response.data.success) {
        return response.data.data.visitor;
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'fetch');
      throw error;
    }
  },

  /**
   * Update visitor
   */
  update: async (visitorId, updateData) => {
    try {
      const payload = {};
      if (updateData.name) payload.name = updateData.name.trim();
      if (updateData.mobile) payload.mobile = updateData.mobile;
      if (updateData.photoBase64 !== undefined) payload.photoBase64 = updateData.photoBase64;

      const response = await apiClient.put(`/visitors/${visitorId}`, payload);

      if (response.data.success) {
        return response.data.data.visitor;
      }
      throw new Error(response.data.message);
    } catch (error) {
      handleError(error, 'update');
      throw error;
    }
  },

  /**
   * Delete visitor
   */
  delete: async (visitorId) => {
    try {
      const response = await apiClient.delete(`/visitors/${visitorId}`);

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
        const errorMsg = data.errors.map(e => e.msg).join('\n');
        Alert.alert('Validation Error', errorMsg);
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
      Alert.alert('Error', data.message || `Failed to ${operation} visitor`);
  }
};
```

### Usage Example

```javascript
import { visitorService } from '../services/visitorService';
import { useState, useEffect } from 'react';

const VisitorsScreen = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVisitors();
  }, []);

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const result = await visitorService.getAll(1, 10, {});
      setVisitors(result.visitors);
    } catch (error) {
      // Error already handled in service
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVisitor = async () => {
    try {
      const { visitor, isNew } = await visitorService.create('John Doe', '1234567890');
      if (isNew) {
        setVisitors([visitor, ...visitors]);
      } else {
        Alert.alert('Info', 'Visitor already exists');
      }
    } catch (error) {
      // Error already handled
    }
  };

  const handleSearch = async (query) => {
    const results = await visitorService.search(query);
    console.log('Search results:', results);
  };

  const handleDeleteVisitor = async (visitorId) => {
    try {
      await visitorService.delete(visitorId);
      setVisitors(visitors.filter(v => v.id !== visitorId));
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
| Create Visitor | ✅ | ✅ | ✅ | ❌ |
| Get All Visitors | ✅ | ✅ | ✅ | ✅ (own society only) |
| Search Visitors | ✅ | ✅ | ✅ | ✅ (own society only) |
| Get Visitor by ID | ✅ | ✅ | ✅ | ✅ (own society only) |
| Update Visitor | ✅ | ✅ | ✅ | ❌ |
| Delete Visitor | ✅ | ✅ | ❌ | ❌ |

---

## Special Notes

### Mobile Number Uniqueness

- Mobile numbers must be unique across all visitors
- When creating a visitor with an existing mobile number, the API returns the existing visitor (status 200) instead of creating a duplicate
- When updating a visitor's mobile number, the new number must be unique

### Mobile Number Format

- Mobile numbers must be exactly 10 digits
- Only numeric characters are allowed
- Example: `"1234567890"` ✅
- Example: `"123-456-7890"` ❌
- Example: `"123456789"` ❌ (9 digits)

### Duplicate Visitor Handling

When creating a visitor:
- If a visitor with the same mobile number exists, the API returns the existing visitor with status `200` and message `"Visitor already exists"`
- This prevents duplicate visitor records
- Check `response.status === 201` to determine if a new visitor was created

### RESIDENT Access Restrictions

- `RESIDENT` users can only see visitors who have visited their society
- This is enforced by checking visitor logs
- If a visitor has never visited the resident's society, they cannot see that visitor
- This applies to:
  - Get All Visitors
  - Search Visitors
  - Get Visitor by ID

### Deleting Visitors

Visitors cannot be deleted if they have:
- Visitor logs associated with them

You must:
1. Delete or reassign visitor logs (if applicable)
2. Then delete the visitor

**Note**: This is a safety measure to preserve visitor log history. If you need to remove a visitor that has logs, you may need to:
- Archive or reassign the visitor logs
- Or implement a soft delete mechanism (marking visitors as inactive instead of deleting)

### Visitor Logs Count

- The `_count.visitorLogs` field shows how many visitor logs are associated with this visitor
- This count is included in list and detail responses
- Use this information to determine if a visitor can be safely deleted

### Photo (Base64)

- `photoBase64` is optional and can be `null`
- Store a base64 data URI (e.g., `data:image/jpeg;base64,...`) in `photoBase64`
- When updating, pass `null` to clear the photo
- Keep images small (server enforces size limits)

### Search vs Get All

- **Get All** (`/visitors`): Full pagination, includes counts, supports multiple filters
- **Search** (`/visitors/search`): Quick search for autocomplete, optimized for speed, limited fields returned

Use Search for:
- Autocomplete dropdowns
- Quick lookups
- Real-time search suggestions

Use Get All for:
- Full visitor lists
- Detailed information
- Pagination

---

## Testing with Swagger UI

You can test all endpoints using Swagger UI:

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:1111/api-docs`
3. Navigate to **v1 - Visitors** section
4. Click "Authorize" and enter your Bearer token
5. Test each endpoint

---

## Next Steps

1. Set up authentication in your React Native app (see [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md))
2. Implement the visitor service in your app
3. Create UI components for listing, viewing, creating, editing, and deleting visitors
4. Add proper error handling and loading states
5. Implement search/autocomplete functionality for visitor selection
6. Integrate with visitor log system (visitors are linked to logs)
7. Add photo upload functionality
8. Implement mobile number validation
9. Add duplicate visitor detection UI feedback
10. Test with multiple scenarios (new visitors, existing visitors, residents viewing visitors)

---

## Related Documentation

- **Users API**: [USERS_CRUD_API.md](./USERS_CRUD_API.md)
- **Societies API**: [SOCIETIES_CRUD_API.md](./SOCIETIES_CRUD_API.md)
- **Units API**: [UNITS_CRUD_API.md](./UNITS_CRUD_API.md)
- **Gates API**: [GATES_CRUD_API.md](./GATES_CRUD_API.md)
- **Visitor Logs**: Visitors are associated with visitor logs via `visitorId` field
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

---

## Support

- **Swagger UI**: `http://localhost:1111/api-docs`
- **API Base URL**: `http://localhost:1111/api/v1`
- **Authentication Docs**: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

