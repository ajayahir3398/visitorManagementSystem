# User: Change Password Integration Guide

This guide provides code examples and best practices for implementing the "Change Password" feature in your React Native application.

---

## API Specification

- **Endpoint**: `PUT /api/v1/auth/change-password`
- **Authorization**: `Bearer <access_token>`
- **Role Required**: Any authenticated user.

### Request Body

```json
{
  "currentPassword": "old_password_here",
  "newPassword": "new_password_here"
}
```

---

## Service Layer Implementation (Axios)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://your-api-domain.com/api/v1';

export const changeUserPassword = async (currentPassword, newPassword) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');

    const response = await axios.put(
      `${API_URL}/auth/change-password`,
      { currentPassword, newPassword },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      // 400: Incorrect current password or validation error
      // 401: Token expired or invalid
      throw new Error(error.response.data.message || 'Failed to change password');
    }
    throw new Error('Network error or server unreachable');
  }
};
```

---

## UI Component Example

```jsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { changeUserPassword } from '../services/userService';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Basic frontend validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await changeUserPassword(currentPassword, newPassword);
      if (result.success) {
        Alert.alert('Success', 'Password changed successfully');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Current Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={currentPassword}
        onChangeText={setCurrentPassword}
      />

      <Text style={styles.label}>New Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      <Text style={styles.label}>Confirm New Password</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Button
        title={loading ? 'Updating...' : 'Update Password'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { marginBottom: 5 },
  input: { borderBottomWidth: 1, marginBottom: 20, padding: 5 },
});

export default ChangePasswordScreen;
```

---

## Best Practices

1.  **Strict Validation**: Always validate the new password length and confirm matching on the frontend before calling the API.
2.  **Clear Feedback**: Distinguish between "Incorrect Current Password" (API 400) and other errors.
3.  **Security**: Avoid logging password values in any console logs or tracking services.
