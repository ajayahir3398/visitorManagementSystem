# Society Admin: Update Society Details Integration Guide

This guide provides code examples and best practices for implementing the "Update Society Details" feature in your React Native application for users with the `SOCIETY_ADMIN` role.

---

## API Specification

- **Endpoint**: `PUT /api/v1/societies/:id`
- **Authorization**: `Bearer <access_token>`
- **Role Required**: `SOCIETY_ADMIN` (can only update their own society)

### Allowed Fields
Society Admins can update:
- `name` (string)
- `type` (Enum: `"apartment"`, `"office"`)
- `address` (string)
- `city` (string)
- `state` (string)
- `pincode` (string)

### Restricted Fields
Updates to the following fields will be **rejected** for Society Admins:
- `status`
- `subscriptionId`
(These require `SUPER_ADMIN` permissions)

---

## Service Layer Implementation (Axios)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://your-api-domain.com/api/v1';

export const updateOwnSocietyDetails = async (societyId, updateData) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    // Filter out restricted fields to prevent unnecessary 403 errors
    const payload = {
      name: updateData.name,
      type: updateData.type,
      address: updateData.address,
      city: updateData.city,
      state: updateData.state,
      pincode: updateData.pincode,
    };

    const response = await axios.put(`${API_URL}/societies/${societyId}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // 403: Ownership check failed or tried to update restricted fields
      // 400: Validation error (e.g., invalid type or missing name)
      throw new Error(error.response.data.message || 'Failed to update society');
    }
    throw new Error('Network error or server unreachable');
  }
};
```

---

## UI Component Example

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView } from 'react-native';
import { updateOwnSocietyDetails } from '../services/societyService';

const EditSocietyScreen = ({ route, navigation }) => {
  // Assuming society details are passed via navigation or fetched previously
  const { society } = route.params; 
  
  const [formData, setFormData] = useState({
    name: society.name,
    type: society.type,
    address: society.address || '',
    city: society.city || '',
    state: society.state || '',
    pincode: society.pincode || '',
  });
  
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Society name is required');
      return;
    }

    setLoading(true);
    try {
      const result = await updateOwnSocietyDetails(society.id, formData);
      if (result.success) {
        Alert.alert('Success', 'Society details updated successfully');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Update Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Edit Society Details</Text>
      
      <Text>Society Name</Text>
      <TextInput
        style={{ borderBottomWidth: 1, marginBottom: 15 }}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <Text>Address</Text>
      <TextInput
        style={{ borderBottomWidth: 1, marginBottom: 15 }}
        value={formData.address}
        onChangeText={(text) => setFormData({ ...formData, address: text })}
      />

      <Text>City</Text>
      <TextInput
        style={{ borderBottomWidth: 1, marginBottom: 15 }}
        value={formData.city}
        onChangeText={(text) => setFormData({ ...formData, city: text })}
      />

      <Text>State</Text>
      <TextInput
        style={{ borderBottomWidth: 1, marginBottom: 15 }}
        value={formData.state}
        onChangeText={(text) => setFormData({ ...formData, state: text })}
      />

      <Text>Pincode</Text>
      <TextInput
        style={{ borderBottomWidth: 1, marginBottom: 20 }}
        value={formData.pincode}
        onChangeText={(text) => setFormData({ ...formData, pincode: text })}
        keyboardType="numeric"
      />

      <Button 
        title={loading ? "Saving..." : "Save Changes"} 
        onPress={handleUpdate} 
        disabled={loading}
      />
    </ScrollView>
  );
};

export default EditSocietyScreen;
```

---

## Best Practices

1.  **Selective Payload**: Even though the backend filters the fields, it's safer to only send the allowed fields from the mobile app to avoid `403` errors if the user accidentally modifies other properties in local state.
2.  **Navigation Guards**: Ensure only `SOCIETY_ADMIN` users can navigate to this screen.
3.  **Local State Refresh**: After a successful update, remember to refresh the local state or trigger a global re-fetch so the updated details appear immediately on other screens.
