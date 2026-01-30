# React Native Firebase Notifications Implementation Guide

Complete step-by-step guide to implement Firebase push notifications in your React Native app.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Android Setup](#android-setup)
4. [iOS Setup](#ios-setup)
5. [Implementation](#implementation)
6. [Complete Code Examples](#complete-code-examples)
7. [Integration with Your App](#integration-with-your-app)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- React Native CLI project (not Expo)
- Firebase project created
- `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) downloaded
- Backend API running with notification endpoints

---

## Installation

### 1. Install Required Packages

```bash
npm install @react-native-firebase/app @react-native-firebase/messaging
```

### 2. Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

---

## Android Setup

### 1. Add google-services.json

1. Download `google-services.json` from Firebase Console
2. Place it in: `android/app/google-services.json`

### 2. Update android/build.gradle

```gradle
buildscript {
  dependencies {
    // ... existing dependencies
    classpath 'com.google.gms:google-services:4.4.0'
  }
}
```

### 3. Update android/app/build.gradle

Add at the bottom of the file:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 4. Add Permissions (Android 13+)

In `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
  <!-- ... other permissions -->
</manifest>
```

---

## iOS Setup

### 1. Add GoogleService-Info.plist

1. Download `GoogleService-Info.plist` from Firebase Console
2. Open Xcode: `open ios/YourApp.xcworkspace`
3. Drag and drop `GoogleService-Info.plist` into the `ios/` folder in Xcode
4. Make sure "Copy items if needed" is checked

### 2. Enable Capabilities in Xcode

1. Select your project in Xcode
2. Go to **Signing & Capabilities**
3. Click **+ Capability**
4. Add:
   - **Push Notifications**
   - **Background Modes** → Check **Remote notifications**

---

## Implementation

### Step 1: Create Notification Service

Create `src/services/notificationService.ts`:

```typescript
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const API_BASE_URL = 'http://your-api-url.com/api/v1'; // Replace with your API URL

class NotificationService {
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Request notification permissions
   */
  async requestPermission(): Promise<boolean> {
    try {
      // Android 13+ requires explicit permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Notification permission denied');
          return false;
        }
      }

      // Request Firebase permission
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification permission granted');
        return true;
      } else {
        console.warn('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM token
   */
  async getFcmToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register FCM token with backend
   */
  async registerToken(token: string): Promise<boolean> {
    try {
      if (!this.accessToken) {
        console.warn('Access token not set. Cannot register FCM token.');
        return false;
      }

      const deviceId = await DeviceInfo.getUniqueId();
      const platform = Platform.OS; // 'android' or 'ios'

      const response = await fetch(`${API_BASE_URL}/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          platform,
          deviceId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('FCM token registered successfully:', data);
        return true;
      } else {
        console.error('Failed to register FCM token:', data);
        return false;
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
      return false;
    }
  }

  /**
   * Remove FCM token from backend (on logout)
   */
  async removeToken(token: string): Promise<boolean> {
    try {
      if (!this.accessToken) {
        console.warn('Access token not set. Cannot remove FCM token.');
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/notifications/remove-token`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('FCM token removed successfully');
        return true;
      } else {
        console.error('Failed to remove FCM token:', data);
        return false;
      }
    } catch (error) {
      console.error('Error removing FCM token:', error);
      return false;
    }
  }

  /**
   * Initialize notifications (call on app start)
   */
  async initialize(): Promise<boolean> {
    try {
      // Request permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return false;
      }

      // Get and register token
      const token = await this.getFcmToken();
      if (token && this.accessToken) {
        await this.registerToken(token);
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }
}

export default new NotificationService();
```

### Step 2: Create Notification Hook

Create `src/hooks/useNotifications.ts`:

```typescript
import { useEffect, useRef } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import notificationService from '../services/notificationService';
import { useNavigation } from '@react-navigation/native'; // Adjust import based on your navigation

export const useNotifications = (accessToken: string | null) => {
  const navigation = useNavigation();
  const unsubscribeRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    // Set access token in service
    notificationService.setAccessToken(accessToken);

    // Initialize notifications
    notificationService.initialize();

    // Handle token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM token refreshed:', newToken);
      await notificationService.registerToken(newToken);
    });

    // Handle foreground notifications
    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground notification received:', remoteMessage);

      // Show local notification or custom UI
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Notification',
          remoteMessage.notification.body || '',
          [
            {
              text: 'View',
              onPress: () => {
                // Navigate based on data
                if (remoteMessage.data?.screen) {
                  navigateToScreen(remoteMessage.data);
                }
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      }

      // Navigate if app is in foreground and user taps
      if (remoteMessage.data?.screen) {
        // You can auto-navigate or wait for user interaction
        // navigateToScreen(remoteMessage.data);
      }
    });

    // Handle notification opened from background
    const unsubscribeBackgroundOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app from background:', remoteMessage);
      if (remoteMessage.data?.screen) {
        navigateToScreen(remoteMessage.data);
      }
    });

    // Handle notification opened from killed state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification opened app from killed state:', remoteMessage);
          if (remoteMessage.data?.screen) {
            // Small delay to ensure navigation is ready
            setTimeout(() => {
              navigateToScreen(remoteMessage.data);
            }, 1000);
          }
        }
      });

    // Store unsubscribe functions
    unsubscribeRefs.current = [
      unsubscribeTokenRefresh,
      unsubscribeForeground,
      unsubscribeBackgroundOpened,
    ];

    // Cleanup
    return () => {
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    };
  }, [accessToken, navigation]);

  const navigateToScreen = (data: any) => {
    try {
      const { screen, ...params } = data;

      // Convert string IDs to numbers if needed
      const navigationParams: any = {};
      Object.keys(params).forEach((key) => {
        const value = params[key];
        // Try to convert to number if it looks like an ID
        if (key.toLowerCase().includes('id') && !isNaN(Number(value))) {
          navigationParams[key] = Number(value);
        } else {
          navigationParams[key] = value;
        }
      });

      // Navigate based on screen name
      switch (screen) {
        case 'visitor_logs':
          navigation.navigate('VisitorLogs' as never, navigationParams as never);
          break;
        case 'visitor_log_detail':
          navigation.navigate('VisitorLogDetail' as never, navigationParams as never);
          break;
        case 'maintenance':
          navigation.navigate('Maintenance' as never, navigationParams as never);
          break;
        case 'notices':
          navigation.navigate('Notices' as never, navigationParams as never);
          break;
        case 'emergency':
          navigation.navigate('Emergency' as never, navigationParams as never);
          break;
        default:
          console.warn('Unknown screen:', screen);
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  };
};
```

### Step 3: Setup Background Message Handler

In `index.js` (root of your React Native app):

```javascript
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background message received:', remoteMessage);
  // You can perform background tasks here
  // Note: You cannot update UI from background handler
});

AppRegistry.registerComponent(appName, () => App);
```

---

## Complete Code Examples

### App.tsx Integration

```typescript
import React, { useEffect } from 'react';
import { useNotifications } from './src/hooks/useNotifications';
import { useAuth } from './src/context/AuthContext'; // Your auth context

const App = () => {
  const { accessToken } = useAuth(); // Get access token from your auth context

  // Initialize notifications
  useNotifications(accessToken);

  // ... rest of your app
  return (
    // Your app components
  );
};

export default App;
```

### Login Screen Integration

```typescript
import React, { useState } from 'react';
import { View, Button, TextInput } from 'react-native';
import notificationService from '../services/notificationService';
import { login } from '../services/api'; // Your API service

const LoginScreen = ({ navigation }) => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      
      // Login to your backend
      const response = await login({ mobile, otp: '123456' }); // Your login logic
      const { accessToken } = response.data;

      // Set access token in notification service
      notificationService.setAccessToken(accessToken);

      // Initialize notifications after login
      await notificationService.initialize();

      // Navigate to home
      navigation.replace('Home');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Your login form */}
    </View>
  );
};
```

### Logout Integration

```typescript
import React from 'react';
import { Button } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notificationService from '../services/notificationService';

const LogoutButton = ({ onLogout }) => {
  const handleLogout = async () => {
    try {
      // Get current FCM token
      const token = await messaging().getToken();
      
      // Remove token from backend
      if (token) {
        await notificationService.removeToken(token);
      }

      // Clear access token
      notificationService.setAccessToken('');

      // Delete FCM token locally (optional)
      await messaging().deleteToken();

      // Call your logout function
      onLogout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return <Button title="Logout" onPress={handleLogout} />;
};
```

---

## Integration with Your App

### 1. Update Your Auth Context

If you have an auth context, update it to initialize notifications:

```typescript
// src/context/AuthContext.tsx
import { useEffect } from 'react';
import notificationService from '../services/notificationService';

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      notificationService.setAccessToken(accessToken);
      notificationService.initialize();
    }
  }, [accessToken]);

  // ... rest of your auth context
};
```

### 2. Update API Base URL

In `src/services/notificationService.ts`, update:

```typescript
const API_BASE_URL = 'http://your-api-url.com/api/v1';
```

Replace with your actual API URL:
- Development: `http://localhost:1111/api/v1`
- Production: `https://your-api-domain.com/api/v1`

### 3. Install Additional Dependencies

```bash
npm install react-native-device-info
```

For iOS:
```bash
cd ios
pod install
cd ..
```

---

## Testing

### 1. Test Token Registration

```typescript
// In your app, after login
const testTokenRegistration = async () => {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  
  const registered = await notificationService.registerToken(token);
  console.log('Token registered:', registered);
};
```

### 2. Test Notification Reception

1. Use Firebase Console to send a test notification
2. Or use your backend API:
   ```bash
   POST /api/v1/notifications/send
   {
     "title": "Test Notification",
     "body": "This is a test",
     "data": {
       "screen": "visitor_logs",
       "visitorLogId": "123"
     }
   }
   ```

### 3. Test Navigation

Send a notification with data payload:
```json
{
  "title": "New Visitor",
  "body": "You have a visitor",
  "data": {
    "screen": "visitor_log_detail",
    "visitorLogId": "123"
  }
}
```

The app should navigate to the specified screen when the notification is tapped.

---

## Troubleshooting

### Issue: Token not registering

**Check:**
1. Access token is set: `notificationService.setAccessToken(token)`
2. API URL is correct
3. Backend is running
4. Network request is successful (check console logs)

### Issue: Notifications not received

**Check:**
1. Permission is granted: `await notificationService.requestPermission()`
2. Token is registered in backend
3. App is not in Do Not Disturb mode
4. Firebase project is configured correctly

### Issue: Navigation not working

**Check:**
1. Navigation is initialized before handling notifications
2. Screen names match your navigation structure
3. Parameters are correctly formatted

### Issue: Background notifications not working

**Check:**
1. Background handler is registered in `index.js`
2. iOS: Background Modes → Remote notifications is enabled
3. Android: No special setup needed

---

## Best Practices

1. **Initialize on Login**: Register FCM token after successful login
2. **Remove on Logout**: Remove token when user logs out
3. **Handle Token Refresh**: Always listen for token refresh
4. **Error Handling**: Wrap all notification calls in try-catch
5. **User Permission**: Always request permission before registering token
6. **Navigation Safety**: Check if navigation is ready before navigating

---

## Complete File Structure

```
YourReactNativeApp/
├── src/
│   ├── services/
│   │   └── notificationService.ts
│   ├── hooks/
│   │   └── useNotifications.ts
│   └── context/
│       └── AuthContext.tsx
├── android/
│   └── app/
│       └── google-services.json
├── ios/
│   └── GoogleService-Info.plist
└── index.js
```

---

## Next Steps

1. ✅ Install packages
2. ✅ Setup Android/iOS configuration
3. ✅ Create notification service
4. ✅ Create notification hook
5. ✅ Integrate with your app
6. ✅ Test notifications
7. ✅ Handle navigation from notifications

Your React Native app is now ready to receive and handle Firebase push notifications! 🎉
