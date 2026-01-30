# React Native Firebase Notifications - Setup Checklist

Use this checklist to ensure you've completed all steps for implementing Firebase notifications in your React Native app.

## Prerequisites

- [ ] React Native CLI project (not Expo)
- [ ] Firebase project created
- [ ] `google-services.json` downloaded (Android)
- [ ] `GoogleService-Info.plist` downloaded (iOS)
- [ ] Backend API running with notification endpoints

## Installation

- [ ] Install `@react-native-firebase/app`
- [ ] Install `@react-native-firebase/messaging`
- [ ] Install `react-native-device-info`
- [ ] Run `pod install` in iOS folder

## Android Setup

- [ ] Place `google-services.json` in `android/app/`
- [ ] Add `classpath 'com.google.gms:google-services:4.4.0'` to `android/build.gradle`
- [ ] Add `apply plugin: 'com.google.gms.google-services'` to `android/app/build.gradle`
- [ ] Add `POST_NOTIFICATIONS` permission to `AndroidManifest.xml` (Android 13+)

## iOS Setup

- [ ] Add `GoogleService-Info.plist` to iOS project via Xcode
- [ ] Enable **Push Notifications** capability in Xcode
- [ ] Enable **Background Modes** → **Remote notifications** in Xcode

## Code Implementation

- [ ] Create `src/services/notificationService.ts`
- [ ] Create `src/hooks/useNotifications.ts`
- [ ] Add background message handler in `index.js`
- [ ] Integrate notification hook in `App.tsx`
- [ ] Update login flow to register token
- [ ] Update logout flow to remove token
- [ ] Update API base URL in notification service

## Testing

- [ ] Test permission request
- [ ] Test token registration
- [ ] Test foreground notifications
- [ ] Test background notifications
- [ ] Test killed state notifications
- [ ] Test navigation from notifications

## Production Checklist

- [ ] Update API URL to production endpoint
- [ ] Test on real devices (Android & iOS)
- [ ] Verify notifications work in all app states
- [ ] Test token refresh handling
- [ ] Verify logout removes token
- [ ] Test with different notification types

---

## Quick Commands

```bash
# Install packages
npm install @react-native-firebase/app @react-native-firebase/messaging react-native-device-info

# iOS setup
cd ios && pod install && cd ..

# Test on Android
npx react-native run-android

# Test on iOS
npx react-native run-ios
```

---

## Documentation

- **Complete Guide**: [REACT_NATIVE_FIREBASE_NOTIFICATIONS.md](./REACT_NATIVE_FIREBASE_NOTIFICATIONS.md)
- **API Documentation**: [FIREBASE_NOTIFICATIONS_API.md](./FIREBASE_NOTIFICATIONS_API.md)
- **Backend Setup**: [FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)
