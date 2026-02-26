# React Native Quick Start Guide

## Quick Setup

### 1. Install Dependencies

```bash
npm install axios @react-native-async-storage/async-storage
# or
yarn add axios @react-native-async-storage/async-storage
```

### 2. Base Configuration

```javascript
// config/api.js
const API_BASE_URL = 'http://localhost:1111/api/v1'; // Change for production

export default API_BASE_URL;
```

### 3. Authentication Service

Copy the complete authentication service from [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md) or use this minimal version:

```javascript
// services/authService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_BASE_URL from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
          await AsyncStorage.setItem('accessToken', res.data.data.accessToken);
          error.config.headers.Authorization = `Bearer ${res.data.data.accessToken}`;
          return apiClient(error.config);
        } catch {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (emailOrMobile, password, isEmail = true) => {
    const res = await apiClient.post('/auth/login', {
      password,
      ...(isEmail ? { email: emailOrMobile } : { mobile: emailOrMobile }),
    });
    if (res.data.success) {
      await AsyncStorage.setItem('accessToken', res.data.data.accessToken);
      await AsyncStorage.setItem('refreshToken', res.data.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  requestOTP: async (mobile) => {
    const res = await apiClient.post('/auth/otp', { mobile });
    return res.data;
  },

  verifyOTP: async (mobile, otp) => {
    const res = await apiClient.post('/auth/verify-otp', { mobile, otp });
    if (res.data.success) {
      await AsyncStorage.setItem('accessToken', res.data.data.accessToken);
      await AsyncStorage.setItem('refreshToken', res.data.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  logout: async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      // Call logout API to invalidate token on server
      if (accessToken || refreshToken) {
        try {
          await apiClient.post('/auth/logout', {
            ...(refreshToken && { refreshToken }),
          });
        } catch (error) {
          // Even if API call fails, clear local storage
          console.warn('Logout API call failed:', error.message);
        }
      }

      // Clear all tokens and user data from storage
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    } catch (error) {
      // Ensure storage is cleared even if there's an error
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
  },

  logoutAll: async () => {
    try {
      const response = await apiClient.post('/auth/logout-all');
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      return response.data;
    } catch (error) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      throw error;
    }
  },

  getCurrentUser: async () => {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export default apiClient;
```

## Usage Examples

### Password Login

```javascript
import { authService } from './services/authService';

const handleLogin = async () => {
  try {
    const result = await authService.login('admin@example.com', 'password123', true);
    if (result.success) {
      // Navigate to home screen
      navigation.navigate('Home');
    } else {
      Alert.alert('Error', result.message);
    }
  } catch (error) {
    Alert.alert('Error', 'Login failed');
  }
};
```

### OTP Login

```javascript
// Step 1: Request OTP
const handleRequestOTP = async () => {
  try {
    const result = await authService.requestOTP('1234567890');
    if (result.success) {
      // Show OTP input screen
      // In development, result.data.otp contains the OTP
      Alert.alert('OTP Sent', `OTP: ${result.data.otp}`); // Dev only
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to send OTP');
  }
};

// Step 2: Verify OTP
const handleVerifyOTP = async () => {
  try {
    const result = await authService.verifyOTP('1234567890', '123456');
    if (result.success) {
      navigation.navigate('Home');
    } else {
      Alert.alert('Error', result.message);
    }
  } catch (error) {
    Alert.alert('Error', 'OTP verification failed');
  }
};
```

### Making Authenticated API Calls

```javascript
import apiClient from './services/authService';

const fetchData = async () => {
  try {
    const response = await apiClient.get('/visitors');
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token refresh handled automatically by interceptor
      // If refresh fails, user will be logged out
    }
    throw error;
  }
};
```

### Logout

```javascript
import { authService } from './services/authService';

// Logout from current device
const handleLogout = async () => {
  try {
    await authService.logout();
    // Navigate to login screen
    navigation.navigate('Login');
  } catch (error) {
    Alert.alert('Error', 'Failed to logout');
  }
};

// Logout from all devices
const handleLogoutAll = async () => {
  try {
    const result = await authService.logoutAll();
    Alert.alert('Logged Out', `Logged out from ${result.data.sessionsInvalidated} device(s)`, [
      { text: 'OK', onPress: () => navigation.navigate('Login') },
    ]);
  } catch (error) {
    Alert.alert('Error', 'Failed to logout from all devices');
  }
};
```

### Check Authentication Status

```javascript
import { authService } from './services/authService';

useEffect(() => {
  const checkAuth = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      // User is logged in
      navigation.navigate('Home');
    } else {
      // User is not logged in
      navigation.navigate('Login');
    }
  };
  checkAuth();
}, []);
```

## API Endpoints Quick Reference

| Method | Endpoint              | Description             | Auth Required |
| ------ | --------------------- | ----------------------- | ------------- |
| POST   | `/auth/login`         | Password login          | No            |
| POST   | `/auth/otp`           | Request OTP             | No            |
| POST   | `/auth/verify-otp`    | Verify OTP & login      | No            |
| POST   | `/auth/refresh-token` | Refresh access token    | No            |
| POST   | `/auth/logout`        | Logout (single device)  | Optional      |
| POST   | `/auth/logout-all`    | Logout from all devices | Yes           |

## Response Format

All API responses follow this format:

```typescript
{
  success: boolean;
  message: string;
  data?: any;
  errors?: Array<{
    msg: string;
    param: string;
    location: string;
  }>;
}
```

## Error Handling

```javascript
try {
  const result = await authService.login(email, password);
  if (!result.success) {
    // Handle API error
    if (result.errors) {
      // Validation errors
      result.errors.forEach((err) => {
        console.log(`${err.param}: ${err.msg}`);
      });
    } else {
      // General error
      Alert.alert('Error', result.message);
    }
  }
} catch (error) {
  // Network error
  if (error.message === 'Network Error') {
    Alert.alert('Error', 'No internet connection');
  } else {
    Alert.alert('Error', 'Something went wrong');
  }
}
```

## Token Management

- **Access Token**: Automatically added to all requests via interceptor
- **Refresh Token**: Automatically used when access token expires
- **Storage**: Tokens stored in AsyncStorage
- **Logout**: Clears all tokens from storage

## Next Steps

1. Read the [Complete Authentication Documentation](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
2. Read the [Logout Implementation Guide](./REACT_NATIVE_LOGOUT_GUIDE.md)
3. Implement authentication screens in your app
4. Set up navigation guards
5. Test with your backend API

## Support

- Swagger UI: `http://localhost:1111/api-docs`
- Full Documentation: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- Logout Guide: [REACT_NATIVE_LOGOUT_GUIDE.md](./REACT_NATIVE_LOGOUT_GUIDE.md)
