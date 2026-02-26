# API Documentation - v1 Authentication

## Overview

This document provides comprehensive API documentation for the Authentication endpoints (v1) for React Native integration. The authentication system supports two login methods:

1. **Password Login** - For admin users only (`SUPER_ADMIN`, `SOCIETY_ADMIN`). Requires Email and Password.
2. **OTP Login** - For resident and security users only (`RESIDENT`, `SECURITY`). Requires Mobile and OTP.

---

## Base Configuration

### Base URL

```
Development: http://localhost:1111
Production: https://your-api-domain.com
```

### API Version

All authentication endpoints are under `/api/v1/auth`

### Headers

All requests should include:

```json
{
  "Content-Type": "application/json"
}
```

For authenticated requests, include:

```json
{
  "Authorization": "Bearer <access_token>"
}
```

---

## Authentication Endpoints

### 1. Login with Email/Mobile and Password

**Endpoint:** `POST /api/v1/auth/login`

**Description:** Login for admin users (`SUPER_ADMIN`, `SOCIETY_ADMIN`) using **email** and password. Mobile-based password login is disabled. Non-admin users (Residents/Security) are not allowed to use this endpoint.

**Request Body:**

```json
{
  "email": "admin@example.com", // Required
  "password": "password123" // Required
}
```

**Validation Rules:**

- `password`: Required, minimum 6 characters
- `email`: Required, must be valid email format
- Only `SUPER_ADMIN` and `SOCIETY_ADMIN` roles can use this method.
- `RESIDENT` and `SECURITY` roles will receive a `403 Forbidden` error.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "admin@example.com",
      "mobile": "1234567890",
      "role": "SUPER_ADMIN",
      "society_id": null,
      "status": "active",
      "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

| Status Code | Description                             | Response                                                                               |
| ----------- | --------------------------------------- | -------------------------------------------------------------------------------------- |
| 400         | Validation error or missing credentials | `{ "success": false, "message": "Validation failed", "errors": [...] }`                |
| 401         | Invalid credentials                     | `{ "success": false, "message": "Invalid credentials" }`                               |
| 403         | Account blocked                         | `{ "success": false, "message": "Account is blocked. Please contact administrator." }` |
| 500         | Internal server error                   | `{ "success": false, "message": "Internal server error" }`                             |

**React Native Example:**

```javascript
import axios from 'axios';

const BASE_URL = 'http://localhost:1111/api/v1';

const login = async (emailOrMobile, password, isEmail = true) => {
  try {
    const requestBody = {
      password,
      ...(isEmail ? { email: emailOrMobile } : { mobile: emailOrMobile }),
    };

    const response = await axios.post(`${BASE_URL}/auth/login`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.data.success) {
      // Store tokens securely
      await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));

      return {
        success: true,
        user: response.data.data.user,
        tokens: {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
        },
      };
    }
  } catch (error) {
    if (error.response) {
      // Server responded with error
      return {
        success: false,
        message: error.response.data.message || 'Login failed',
        errors: error.response.data.errors,
      };
    } else {
      // Network error
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }
};

// Usage
const result = await login('admin@example.com', 'password123', true);
if (result.success) {
  console.log('Logged in:', result.user);
}
```

---

### 2. Request OTP

**Endpoint:** `POST /api/v1/auth/otp`

**Description:** Request OTP for mobile-based login for `RESIDENT` and `SECURITY` roles. OTP login is not available for administrator roles. OTP is valid for 10 minutes.

**Request Body:**

```json
{
  "mobile": "1234567890" // Required, exactly 10 digits
}
```

**Validation Rules:**

- `mobile`: Required, must be exactly 10 digits (numeric only)

**Success Response (200):**

```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "mobile": "1234567890",
    "otp": "123456", // Only in development mode
    "expiresIn": "10 minutes"
  }
}
```

**Note:** In production, the `otp` field is not returned. In development mode, it's included for testing purposes.

**Error Responses:**

| Status Code | Description           | Response                                                                                       |
| ----------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| 400         | Invalid mobile format | `{ "success": false, "message": "Mobile must be 10 digits" }`                                  |
| 403         | Account blocked       | `{ "success": false, "message": "Account is blocked. Please contact administrator." }`         |
| 404         | User not found        | `{ "success": false, "message": "User not found. Please contact administrator to register." }` |
| 500         | Failed to send OTP    | `{ "success": false, "message": "Failed to send OTP" }`                                        |

**React Native Example:**

```javascript
const requestOTP = async (mobile) => {
  try {
    // Validate mobile format
    if (!/^[0-9]{10}$/.test(mobile)) {
      return {
        success: false,
        message: 'Mobile number must be exactly 10 digits',
      };
    }

    const response = await axios.post(
      `${BASE_URL}/auth/otp`,
      { mobile },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      // In development, OTP is returned in response
      // In production, OTP is sent via SMS
      const otp = response.data.data.otp; // Only in dev mode

      return {
        success: true,
        message: response.data.message,
        expiresIn: response.data.data.expiresIn,
        otp: otp, // Only available in development
      };
    }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'Failed to send OTP',
      };
    } else {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }
};

// Usage
const result = await requestOTP('1234567890');
if (result.success) {
  console.log('OTP sent. Expires in:', result.expiresIn);
  // In development, you can use result.otp for testing
}
```

---

### 3. Verify OTP and Login

**Endpoint:** `POST /api/v1/auth/verify-otp`

**Description:** Verify OTP code and complete login. Returns access token and refresh token.

**Request Body:**

```json
{
  "mobile": "1234567890", // Required, exactly 10 digits
  "otp": "123456" // Required, exactly 6 digits
}
```

**Validation Rules:**

- `mobile`: Required, must be exactly 10 digits
- `otp`: Required, must be exactly 6 digits (numeric only)

**Success Response (200):**

```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {
      "id": 5,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "mobile": "1234567890",
      "role": "RESIDENT",
      "society_id": 1,
      "status": "active",
      "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

| Status Code | Description            | Response                                                                               |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------- |
| 400         | Invalid or expired OTP | `{ "success": false, "message": "Invalid or expired OTP" }`                            |
| 403         | Account blocked        | `{ "success": false, "message": "Account is blocked. Please contact administrator." }` |
| 404         | User not found         | `{ "success": false, "message": "User not found" }`                                    |
| 500         | Failed to verify OTP   | `{ "success": false, "message": "Failed to verify OTP" }`                              |

**React Native Example:**

```javascript
const verifyOTP = async (mobile, otp) => {
  try {
    // Validate inputs
    if (!/^[0-9]{10}$/.test(mobile)) {
      return {
        success: false,
        message: 'Mobile number must be exactly 10 digits',
      };
    }

    if (!/^[0-9]{6}$/.test(otp)) {
      return {
        success: false,
        message: 'OTP must be exactly 6 digits',
      };
    }

    const response = await axios.post(
      `${BASE_URL}/auth/verify-otp`,
      { mobile, otp },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      // Store tokens securely
      await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(response.data.data.user));

      return {
        success: true,
        user: response.data.data.user,
        tokens: {
          accessToken: response.data.data.accessToken,
          refreshToken: response.data.data.refreshToken,
        },
      };
    }
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        message: error.response.data.message || 'OTP verification failed',
      };
    } else {
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  }
};

// Usage
const result = await verifyOTP('1234567890', '123456');
if (result.success) {
  console.log('Logged in:', result.user);
}
```

---

### 4. Refresh Access Token

**Endpoint:** `POST /api/v1/auth/refresh-token`

**Description:** Refresh the access token using a valid refresh token. Access tokens expire after a certain period, but refresh tokens are valid for 7 days.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Required
}
```

**Validation Rules:**

- `refreshToken`: Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

| Status Code | Description                      | Response                                                              |
| ----------- | -------------------------------- | --------------------------------------------------------------------- |
| 400         | Refresh token is required        | `{ "success": false, "message": "Refresh token is required" }`        |
| 401         | Invalid or expired refresh token | `{ "success": false, "message": "Invalid or expired refresh token" }` |
| 403         | Account blocked                  | `{ "success": false, "message": "Account is blocked" }`               |
| 404         | User not found                   | `{ "success": false, "message": "User not found" }`                   |

**React Native Example:**

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (!refreshToken) {
      return {
        success: false,
        message: 'No refresh token found. Please login again.',
        shouldLogout: true,
      };
    }

    const response = await axios.post(
      `${BASE_URL}/auth/refresh-token`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      // Update stored access token
      await AsyncStorage.setItem('accessToken', response.data.data.accessToken);

      return {
        success: true,
        accessToken: response.data.data.accessToken,
      };
    }
  } catch (error) {
    if (error.response) {
      // If refresh token is invalid, logout user
      if (error.response.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return {
          success: false,
          message: 'Session expired. Please login again.',
          shouldLogout: true,
        };
      }

      return {
        success: false,
        message: error.response.data.message || 'Failed to refresh token',
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

### 5. Logout (Single Device)

**Endpoint:** `POST /api/v1/auth/logout`

**Description:** Logout user and invalidate refresh token on the server. Supports two authentication methods:

1. **Using access token** in Authorization header (recommended)
2. **Using refreshToken** in request body (fallback)

If access token is provided but no refreshToken in body, logs out from all devices.

**Authentication:** Optional (can use access token OR refreshToken)

**Request Headers (Optional but recommended):**

```
Authorization: Bearer <access_token>
```

**Request Body (Optional):**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Error Responses:**

| Status Code | Description              | Response                                                                                                                    |
| ----------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 400         | Missing required fields  | `{ "success": false, "message": "Either provide Authorization header with access token, or refreshToken in request body" }` |
| 401         | Invalid refresh token    | `{ "success": false, "message": "Invalid refresh token. Please provide a valid access token or refresh token." }`           |
| 403         | Token ownership mismatch | `{ "success": false, "message": "Refresh token does not belong to authenticated user" }`                                    |
| 404         | Refresh token not found  | `{ "success": false, "message": "Refresh token not found or already invalidated" }`                                         |
| 500         | Internal server error    | `{ "success": false, "message": "Failed to logout" }`                                                                       |

**React Native Example:**

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logout = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    // Prepare request
    const requestConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add access token to header if available
    if (accessToken) {
      requestConfig.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add refreshToken to body if available
    const requestBody = {};
    if (refreshToken) {
      requestBody.refreshToken = refreshToken;
    }

    // Call logout API
    try {
      await axios.post(
        `${BASE_URL}/auth/logout`,
        Object.keys(requestBody).length > 0 ? requestBody : undefined,
        requestConfig
      );
    } catch (apiError) {
      // Even if API call fails, clear local storage
      console.warn('Logout API call failed, but clearing local storage:', apiError.message);
    }

    // Always clear local storage
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

// Usage
const result = await logout();
if (result.success) {
  // Navigate to login screen
  navigation.navigate('Login');
}
```

---

### 6. Logout from All Devices

**Endpoint:** `POST /api/v1/auth/logout-all`

**Description:** Invalidate all refresh tokens for the authenticated user, effectively logging them out from all devices. Requires authentication via access token.

**Authentication:** Required (access token in Authorization header)

**Request Headers:**

```
Authorization: Bearer <access_token>
```

**Request Body:** None

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logged out from all devices successfully",
  "data": {
    "sessionsInvalidated": 3
  }
}
```

**Error Responses:**

| Status Code | Description             | Response                                                               |
| ----------- | ----------------------- | ---------------------------------------------------------------------- |
| 401         | Authentication required | `{ "success": false, "message": "Authentication required" }`           |
| 500         | Internal server error   | `{ "success": false, "message": "Failed to logout from all devices" }` |

**React Native Example:**

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logoutAll = async () => {
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
      `${BASE_URL}/auth/logout-all`,
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

// Usage
const result = await logoutAll();
if (result.success) {
  Alert.alert('Logged Out', `Logged out from ${result.sessionsInvalidated} device(s)`, [
    { text: 'OK', onPress: () => navigation.navigate('Login') },
  ]);
}
```

---

## Complete React Native Authentication Service

Here's a complete authentication service that you can use in your React Native app:

```javascript
// services/authService.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:1111/api/v1';

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add access token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          // No refresh token, logout
          await logout();
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        if (response.data.success) {
          const { accessToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
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

// Authentication methods
export const authService = {
  // Password login
  login: async (emailOrMobile, password, isEmail = true) => {
    try {
      const requestBody = {
        password,
        ...(isEmail ? { email: emailOrMobile } : { mobile: emailOrMobile }),
      };

      const response = await apiClient.post('/auth/login', requestBody);

      if (response.data.success) {
        await storeAuthData(response.data.data);
        return { success: true, user: response.data.data.user };
      }
    } catch (error) {
      return handleError(error);
    }
  },

  // Request OTP
  requestOTP: async (mobile) => {
    try {
      if (!/^[0-9]{10}$/.test(mobile)) {
        return {
          success: false,
          message: 'Mobile number must be exactly 10 digits',
        };
      }

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

  // Verify OTP
  verifyOTP: async (mobile, otp) => {
    try {
      if (!/^[0-9]{10}$/.test(mobile)) {
        return {
          success: false,
          message: 'Mobile number must be exactly 10 digits',
        };
      }

      if (!/^[0-9]{6}$/.test(otp)) {
        return {
          success: false,
          message: 'OTP must be exactly 6 digits',
        };
      }

      const response = await apiClient.post('/auth/verify-otp', { mobile, otp });

      if (response.data.success) {
        await storeAuthData(response.data.data);
        return { success: true, user: response.data.data.user };
      }
    } catch (error) {
      return handleError(error);
    }
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');

      if (!refreshToken) {
        return {
          success: false,
          message: 'No refresh token found',
          shouldLogout: true,
        };
      }

      const response = await axios.post(
        `${BASE_URL}/auth/refresh-token`,
        { refreshToken }
      );

      if (response.data.success) {
        await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
        return {
          success: true,
          accessToken: response.data.data.accessToken,
        };
      }
    } catch (error) {
      if (error.response?.status === 401) {
        await logout();
        return {
          success: false,
          message: 'Session expired. Please login again.',
          shouldLogout: true,
        };
      }
      return handleError(error);
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },

  // Logout (single device)
  logout: async () => {
    return await logout();
  },

  // Logout from all devices
  logoutAll: async () => {
    return await logoutAll();
  },
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  },
};

// Helper functions
const storeAuthData = async (data) => {
  await AsyncStorage.setItem('accessToken', data.accessToken);
  await AsyncStorage.setItem('refreshToken', data.refreshToken);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
};

const handleError = (error) => {
  if (error.response) {
    return {
      success: false,
      message: error.response.data.message || 'Request failed',
      errors: error.response.data.errors,
      status: error.response.status,
    };
  } else if (error.request) {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  } else {
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Logout user (single device)
 * Invalidates the refresh token on server and clears local storage
 */
const logout = async () => {
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
        console.warn('Logout API call failed, but clearing local storage:', error.message);
      }
    }

    // Clear all tokens and user data from storage
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  } catch (error) {
    // Ensure storage is cleared even if there's an error
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    throw error;
  }
};

/**
 * Logout from all devices
 * Invalidates all refresh tokens for the user
 */
const logoutAll = async () => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');

    if (!accessToken) {
      throw new Error('No access token found. User may already be logged out.');
    }

    // Call logout-all API
    const response = await apiClient.post('/auth/logout-all');

    // Clear all tokens and user data from storage
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);

    return response.data;
  } catch (error) {
    // Ensure storage is cleared even if there's an error
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    throw error;
  }
};

export default apiClient;
```

---

## Authentication Flow

### Password Login Flow

```
1. User enters email/mobile + password
2. App calls POST /api/v1/auth/login
3. Server validates credentials
4. Server returns accessToken + refreshToken + user data
5. App stores tokens securely
6. App uses accessToken for subsequent API calls
```

### OTP Login Flow

```
1. User enters mobile number
2. App calls POST /api/v1/auth/otp
3. Server sends OTP via SMS (or returns in dev mode)
4. User enters OTP
5. App calls POST /api/v1/auth/verify-otp
6. Server validates OTP
7. Server returns accessToken + refreshToken + user data
8. App stores tokens securely
9. App uses accessToken for subsequent API calls
```

### Token Refresh Flow

```
1. Access token expires (401 error)
2. App intercepts 401 response
3. App calls POST /api/v1/auth/refresh-token with refreshToken
4. Server validates refreshToken
5. Server returns new accessToken
6. App updates stored accessToken
7. App retries original request with new token
```

### Logout Flow

```
1. User clicks logout button
2. App calls POST /api/v1/auth/logout (with access token and/or refreshToken)
3. Server invalidates refresh token(s)
4. Server logs logout action in audit logs
5. App clears all tokens from storage
6. App redirects to login screen
```

---

## User Roles

The authentication system supports the following roles:

- **SUPER_ADMIN**: System administrator with full access
- **SOCIETY_ADMIN**: Society administrator, manages their society
- **RESIDENT**: Society resident, can approve/reject visitors
- **SECURITY**: Security guard, can create visitor entries and mark exits

---

## Token Management

### Access Token

- Used for authenticating API requests
- Included in `Authorization` header: `Bearer <access_token>`
- Has expiration time (check JWT configuration)
- Automatically refreshed when expired using refresh token

### Refresh Token

- Used to obtain new access tokens
- Valid for 7 days
- Stored securely in device storage
- Should be cleared on logout

### Storage Recommendations

- Use `@react-native-async-storage/async-storage` for token storage
- Consider using `react-native-keychain` for enhanced security
- Never store tokens in plain text or logs
- Clear tokens on logout

---

## Error Handling

### Common Error Scenarios

1. **Network Errors**
   - Check internet connection
   - Retry with exponential backoff
   - Show user-friendly message

2. **401 Unauthorized**
   - Token expired or invalid
   - Attempt token refresh
   - If refresh fails, redirect to login

3. **403 Forbidden**
   - Account blocked
   - Show message and redirect to login
   - Contact administrator

4. **404 Not Found**
   - User not registered
   - Show registration message

5. **400 Bad Request**
   - Validation errors
   - Display field-specific error messages

### Error Response Format

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "msg": "Validation error message",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

---

## Security Best Practices

1. **Token Storage**
   - Use secure storage (Keychain/Keystore)
   - Never log tokens
   - Clear tokens on logout

2. **HTTPS Only**
   - Always use HTTPS in production
   - Never send tokens over HTTP

3. **Token Refresh**
   - Implement automatic token refresh
   - Handle refresh failures gracefully
   - Logout user if refresh fails

4. **Input Validation**
   - Validate inputs client-side
   - Sanitize user inputs
   - Follow server validation rules

5. **Error Messages**
   - Don't expose sensitive information
   - Show user-friendly messages
   - Log detailed errors server-side only

---

## Testing

### Development Mode

- OTP is returned in API response for testing
- Use test credentials provided by backend team
- Test all error scenarios

### Production Mode

- OTP is sent via SMS only
- Ensure SMS service is configured
- Test with real mobile numbers

---

## Support

For issues or questions:

- Check Swagger documentation: `http://localhost:1111/api-docs`
- Review error responses for specific error messages
- Contact backend team for API-related issues

---

## Changelog

### v1.1.0

- Added logout endpoint (single device)
- Added logout-all endpoint (all devices)
- Enhanced token management with server-side invalidation
- Added audit logging for logout actions

### v1.0.0

- Initial authentication API documentation
- Password login support
- OTP login support
- Token refresh support
