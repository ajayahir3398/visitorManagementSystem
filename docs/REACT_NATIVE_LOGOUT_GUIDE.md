# React Native Logout Implementation Guide

Complete guide for implementing logout functionality in your React Native app with the Visitor Management System API.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Logout Endpoints](#logout-endpoints)
3. [Implementation](#implementation)
4. [Complete Service Example](#complete-service-example)
5. [UI Implementation](#ui-implementation)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The logout system provides two options:

1. **Single Device Logout** - Logs out from the current device only
2. **Logout from All Devices** - Logs out from all devices/sessions

Both methods:

- ✅ Invalidate refresh tokens on the server
- ✅ Clear tokens from local storage
- ✅ Log actions in audit logs
- ✅ Provide secure session management

---

## Logout Endpoints

### 1. Logout (Single Device)

**Endpoint:** `POST /api/v1/auth/logout`

**Authentication Methods:**

- **Method 1 (Recommended):** Access token in `Authorization` header
- **Method 2 (Fallback):** Refresh token in request body
- **Method 3:** Both (validates token ownership)

**Request:**

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>  (optional but recommended)
Content-Type: application/json

{
  "refreshToken": "xxxx.yyyy.zzzz"  (optional)
}
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 2. Logout from All Devices

**Endpoint:** `POST /api/v1/auth/logout-all`

**Authentication:** Required (access token in header)

**Request:**

```http
POST /api/v1/auth/logout-all
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "data": {
    "sessionsInvalidated": 3
  }
}
```

---

## Implementation

### Step 1: Install Dependencies

```bash
npm install axios @react-native-async-storage/async-storage
# or
yarn add axios @react-native-async-storage/async-storage
```

### Step 2: Base Configuration

```javascript
// config/api.js
const API_BASE_URL = 'http://localhost:1111/api/v1'; // Change for production

export default API_BASE_URL;
```

### Step 3: Logout Service Implementation

```javascript
// services/logoutService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';

/**
 * Logout from current device
 * Invalidates refresh token on server and clears local storage
 */
export const logout = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    // Prepare request configuration
    const requestConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add access token to header if available (recommended)
    if (accessToken) {
      requestConfig.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Prepare request body with refreshToken if available
    const requestBody = {};
    if (refreshToken) {
      requestBody.refreshToken = refreshToken;
    }

    // Call logout API to invalidate token on server
    try {
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        Object.keys(requestBody).length > 0 ? requestBody : undefined,
        requestConfig
      );
    } catch (apiError) {
      // Even if API call fails, clear local storage
      // This ensures user can still logout even if server is unreachable
      console.warn('Logout API call failed, but clearing local storage:', apiError.message);
    }

    // Always clear local storage regardless of API call result
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  } catch (error) {
    // Ensure storage is cleared even if there's an error
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

    return {
      success: false,
      message: error.message || 'Failed to logout',
    };
  }
};

/**
 * Logout from all devices
 * Invalidates all refresh tokens for the user
 */
export const logoutAll = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');

    if (!accessToken) {
      return {
        success: false,
        message: 'No access token found. User may already be logged out.',
      };
    }

    // Call logout-all API
    const response = await axios.post(
      `${API_BASE_URL}/auth/logout-all`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.success) {
      // Clear all tokens and user data from storage
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

      return {
        success: true,
        message: response.data.message,
        sessionsInvalidated: response.data.data?.sessionsInvalidated || 0,
      };
    }

    return {
      success: false,
      message: 'Logout failed',
    };
  } catch (error) {
    // Ensure storage is cleared even if there's an error
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Failed to logout from all devices',
      };
    } else {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }
};
```

---

## Complete Service Example

Here's a complete authentication service with logout functionality:

```javascript
// services/authService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add access token to all requests
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, logout
          await logout();
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        if (response.data.success) {
          const { accessToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout
        await logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to store auth data
const storeAuthData = async (data) => {
  await AsyncStorage.setItem('accessToken', data.accessToken);
  await AsyncStorage.setItem('refreshToken', data.refreshToken);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
};

// Helper function to handle errors
const handleError = (error) => {
  if (error.response) {
    return {
      success: false,
      message: error.response.data.message || 'An error occurred',
      errors: error.response.data.errors,
    };
  } else {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }
};

// Logout function
const logout = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    const requestConfig = {
      headers: { 'Content-Type': 'application/json' },
    };

    if (accessToken) {
      requestConfig.headers.Authorization = `Bearer ${accessToken}`;
    }

    const requestBody = refreshToken ? { refreshToken } : undefined;

    try {
      await axios.post(`${API_BASE_URL}/auth/logout`, requestBody, requestConfig);
    } catch (apiError) {
      console.warn('Logout API call failed:', apiError.message);
    }

    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  } catch (error) {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }
};

// Export auth service
export const authService = {
  // Login methods
  login: async (emailOrMobile, password, isEmail = true) => {
    try {
      const response = await apiClient.post('/auth/login', {
        password,
        ...(isEmail ? { email: emailOrMobile } : { mobile: emailOrMobile }),
      });

      if (response.data.success) {
        await storeAuthData(response.data.data);
        return { success: true, user: response.data.data.user };
      }
    } catch (error) {
      return handleError(error);
    }
  },

  requestOTP: async (mobile) => {
    try {
      const response = await apiClient.post('/auth/otp', { mobile });
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          expiresIn: response.data.data.expiresIn,
          otp: response.data.data.otp, // Only in development
        };
      }
    } catch (error) {
      return handleError(error);
    }
  },

  verifyOTP: async (mobile, otp) => {
    try {
      const response = await apiClient.post('/auth/verify-otp', { mobile, otp });
      if (response.data.success) {
        await storeAuthData(response.data.data);
        return { success: true, user: response.data.data.user };
      }
    } catch (error) {
      return handleError(error);
    }
  },

  // Logout methods
  logout: async () => {
    return await logout();
  },

  logoutAll: async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        return {
          success: false,
          message: 'No access token found',
        };
      }

      const response = await apiClient.post('/auth/logout-all');
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

      return {
        success: true,
        message: response.data.message,
        sessionsInvalidated: response.data.data?.sessionsInvalidated || 0,
      };
    } catch (error) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      return handleError(error);
    }
  },

  // Utility methods
  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },
};

export default apiClient;
```

---

## UI Implementation

### Basic Logout Button

```javascript
// components/LogoutButton.js
import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { authService } from '../services/authService';

const LogoutButton = ({ navigation }) => {
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
      <Text style={styles.logoutText}>Logout</Text>
    </TouchableOpacity>
  );
};

export default LogoutButton;
```

### Logout from All Devices

```javascript
// components/LogoutAllButton.js
import React from 'react';
import { TouchableOpacity, Text, Alert } from 'react-native';
import { authService } from '../services/authService';

const LogoutAllButton = ({ navigation }) => {
  const handleLogoutAll = async () => {
    Alert.alert(
      'Logout from All Devices',
      'This will log you out from all devices. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await authService.logoutAll();
              if (result.success) {
                Alert.alert(
                  'Logged Out',
                  `Logged out from ${result.sessionsInvalidated} device(s)`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        });
                      },
                    },
                  ]
                );
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout from all devices');
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity onPress={handleLogoutAll} style={styles.logoutAllButton}>
      <Text style={styles.logoutAllText}>Logout from All Devices</Text>
    </TouchableOpacity>
  );
};

export default LogoutAllButton;
```

### Settings Screen with Logout Options

```javascript
// screens/SettingsScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authService } from '../services/authService';

const SettingsScreen = ({ navigation }) => {
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const handleLogoutAll = async () => {
    Alert.alert('Logout from All Devices', 'This will log you out from all devices. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout All',
        style: 'destructive',
        onPress: async () => {
          const result = await authService.logoutAll();
          if (result.success) {
            Alert.alert('Success', `Logged out from ${result.sessionsInvalidated} device(s)`, [
              {
                text: 'OK',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                  });
                },
              },
            ]);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleLogoutAll}>
        <Text style={[styles.buttonText, styles.dangerText]}>Logout from All Devices</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerText: {
    color: '#fff',
  },
});

export default SettingsScreen;
```

---

## Best Practices

### 1. Always Clear Local Storage

Even if the API call fails, always clear local storage:

```javascript
try {
  await apiClient.post('/auth/logout');
} catch (error) {
  // Still clear storage
  console.warn('Logout API failed, but clearing storage');
}
await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
```

### 2. Use Navigation Reset

After logout, reset navigation stack to prevent back navigation:

```javascript
navigation.reset({
  index: 0,
  routes: [{ name: 'Login' }],
});
```

### 3. Handle Network Errors Gracefully

```javascript
if (error.message === 'Network Error') {
  // Still logout locally
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  Alert.alert('Logged Out', 'Logged out locally. Server logout may have failed.');
}
```

### 4. Show User Feedback

```javascript
// Show loading indicator
setLoading(true);
try {
  await authService.logout();
  // Success - navigate to login
} catch (error) {
  Alert.alert('Error', 'Failed to logout');
} finally {
  setLoading(false);
}
```

### 5. Secure Token Storage (Optional)

For enhanced security, consider using `react-native-keychain`:

```bash
npm install react-native-keychain
```

```javascript
import * as Keychain from 'react-native-keychain';

// Store tokens
await Keychain.setGenericPassword('accessToken', accessToken);
await Keychain.setGenericPassword('refreshToken', refreshToken);

// Retrieve tokens
const credentials = await Keychain.getGenericPassword();
const accessToken = credentials.password;

// Clear tokens
await Keychain.resetGenericPassword();
```

---

## Troubleshooting

### Issue: Logout doesn't clear tokens

**Solution:** Ensure you're using `multiRemove`:

```javascript
// ✅ Correct
await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

// ❌ Wrong
await AsyncStorage.removeItem('accessToken');
await AsyncStorage.removeItem('refreshToken');
await AsyncStorage.removeItem('user');
```

### Issue: User can navigate back after logout

**Solution:** Use `navigation.reset()` instead of `navigation.navigate()`:

```javascript
// ✅ Correct
navigation.reset({
  index: 0,
  routes: [{ name: 'Login' }],
});

// ❌ Wrong
navigation.navigate('Login');
```

### Issue: Logout API fails but user is logged out locally

**This is expected behavior!** The app clears local storage even if the API call fails. This ensures users can always logout, even if the server is unreachable.

### Issue: Multiple logout calls

**Solution:** Add a loading state to prevent multiple simultaneous calls:

```javascript
const [isLoggingOut, setIsLoggingOut] = useState(false);

const handleLogout = async () => {
  if (isLoggingOut) return; // Prevent multiple calls

  setIsLoggingOut(true);
  try {
    await authService.logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  } finally {
    setIsLoggingOut(false);
  }
};
```

---

## Complete Example: Profile Screen with Logout

```javascript
// screens/ProfileScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { authService } from '../services/authService';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setIsLoggingOut(true);
          try {
            await authService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          } finally {
            setIsLoggingOut(false);
          }
        },
      },
    ]);
  };

  const handleLogoutAll = async () => {
    Alert.alert(
      'Logout from All Devices',
      'This will log you out from all devices. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout All',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              const result = await authService.logoutAll();
              if (result.success) {
                Alert.alert('Success', `Logged out from ${result.sessionsInvalidated} device(s)`, [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      });
                    },
                  },
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to logout from all devices');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.role}>{user?.role || 'N/A'}</Text>
        <Text style={styles.email}>{user?.email || user?.mobile || ''}</Text>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.button, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Logout</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton, isLoggingOut && styles.buttonDisabled]}
          onPress={handleLogoutAll}
          disabled={isLoggingOut}
        >
          <Text style={styles.buttonText}>Logout from All Devices</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  role: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  actionsSection: {
    padding: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
```

---

## API Reference Summary

| Endpoint           | Method | Auth Required | Description                |
| ------------------ | ------ | ------------- | -------------------------- |
| `/auth/logout`     | POST   | Optional      | Logout from current device |
| `/auth/logout-all` | POST   | Yes           | Logout from all devices    |

---

## Support

- **Swagger UI:** `http://localhost:1111/api-docs`
- **Full Auth Docs:** [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **Quick Start:** [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

---

## Next Steps

1. ✅ Implement logout in your app
2. ✅ Test logout functionality
3. ✅ Add logout to settings/profile screen
4. ✅ Test logout from all devices
5. ✅ Verify tokens are cleared properly
6. ✅ Test navigation after logout

---

**Happy Coding! 🚀**
