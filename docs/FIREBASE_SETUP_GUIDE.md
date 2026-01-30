# Firebase Setup Guide - Client vs Server Configuration

This guide explains the difference between client-side and server-side Firebase configuration files.

---

## Two Different Files for Two Different Purposes

### 1. Client-Side Configuration (React Native App)

**Files:**
- **Android:** `google-services.json`
- **iOS:** `GoogleService-Info.plist`

**Purpose:**
- Used by your React Native mobile app
- Allows the app to connect to Firebase
- Used to get FCM tokens
- Receive push notifications

**Where to get it:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → **Project Settings**
4. Scroll to **Your apps** section
5. Click on your Android/iOS app
6. Download `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)

**Where to place it:**
- **Android:** `android/app/google-services.json`
- **iOS:** `ios/GoogleService-Info.plist` (add via Xcode)

**Used in:**
- React Native app initialization
- Getting FCM tokens: `messaging().getToken()`
- Receiving notifications

---

### 2. Server-Side Configuration (Backend API)

**File:**
- **Service Account JSON** (e.g., `firebase-service-account.json`)

**Purpose:**
- Used by your Node.js backend API
- Allows the server to send push notifications
- Admin credentials (more powerful than client config)
- Used by Firebase Admin SDK

**Where to get it:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file (e.g., `firebase-service-account.json`)

**Where to place it:**
- Backend: `config/firebase-service-account.json` (or any secure location)
- **IMPORTANT:** Add to `.gitignore` - never commit this file!

**Used in:**
- Backend API to send notifications
- Firebase Admin SDK initialization
- Server-side notification sending

---

## Visual Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE PROJECT                          │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
    ┌───────▼────────┐            ┌────────▼────────┐
    │  CLIENT-SIDE   │            │  SERVER-SIDE    │
    │  (React Native)│            │  (Node.js API)  │
    └────────────────┘            └─────────────────┘
            │                               │
    ┌───────▼────────┐            ┌────────▼────────┐
    │ google-services│            │ Service Account│
    │     .json      │            │     .json      │
    │                │            │                │
    │ Android/iOS    │            │ Backend Admin  │
    │ Client Config  │            │ Credentials    │
    └────────────────┘            └────────────────┘
            │                               │
            │                               │
    ┌───────▼────────┐            ┌────────▼────────┐
    │ Get FCM Token  │            │ Send Notifications│
    │ Receive Notifs │            │ Manage Tokens    │
    └────────────────┘            └─────────────────┘
```

---

## Setup Steps

### Step 1: Get Client Config (for React Native)

1. Firebase Console → Project Settings → Your apps
2. Download `google-services.json` (Android) or `GoogleService-Info.plist` (iOS)
3. Place in your React Native project:
   - Android: `android/app/google-services.json`
   - iOS: `ios/GoogleService-Info.plist`

### Step 2: Get Service Account (for Backend)

1. Firebase Console → Project Settings → **Service Accounts** tab
2. Click **Generate New Private Key**
3. Download the JSON file
4. Save as `config/firebase-service-account.json` in your backend
5. Add to `.env`:
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
   ```

### Step 3: Secure the Service Account File

**CRITICAL:** The Service Account JSON has admin privileges. Never commit it to version control!

Add to `.gitignore`:
```
config/firebase-service-account.json
*.json
!package.json
!package-lock.json
```

---

## Environment Variables

### Backend (.env)
```env
# Option 1: Path to service account file (recommended)
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json

# Option 2: Service account JSON as string (alternative)
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
```

### React Native
No environment variables needed for Firebase client config. The `google-services.json` file is enough.

---

## File Structure

```
Your Project/
├── backend/
│   ├── config/
│   │   └── firebase-service-account.json  ← Server-side (Admin)
│   ├── .env                                ← Contains path to service account
│   └── services/
│       └── firebaseService.js              ← Uses service account
│
└── mobile-app/
    ├── android/
    │   └── app/
    │       └── google-services.json        ← Client-side (Android)
    └── ios/
        └── GoogleService-Info.plist        ← Client-side (iOS)
```

---

## Quick Reference

| Feature | Client Config | Service Account |
|---------|--------------|-----------------|
| **File Name** | `google-services.json` | `firebase-service-account.json` |
| **Location** | React Native app | Backend API |
| **Purpose** | Get tokens, receive notifications | Send notifications |
| **Permissions** | Client (limited) | Admin (full) |
| **Used By** | React Native Firebase | Firebase Admin SDK |
| **Security** | Can be in app | Must be secret |

---

## Common Mistakes

❌ **Mistake 1:** Using `google-services.json` in backend
- **Why it fails:** Client config doesn't have admin permissions
- **Fix:** Use Service Account JSON instead

❌ **Mistake 2:** Committing Service Account JSON to Git
- **Why it's dangerous:** Anyone with access can send notifications
- **Fix:** Add to `.gitignore`

❌ **Mistake 3:** Using Service Account JSON in React Native
- **Why it's wrong:** Service account is for server-side only
- **Fix:** Use `google-services.json` in React Native

---

## Verification

### Verify Client Config (React Native)
```typescript
import messaging from '@react-native-firebase/messaging';
const token = await messaging().getToken();
console.log('FCM Token:', token); // Should work if config is correct
```

### Verify Service Account (Backend)
```javascript
// In your backend, check if Firebase initializes
import { initializeFirebase } from './services/firebaseService.js';
await initializeFirebase(); // Should log: ✅ Firebase Admin SDK initialized successfully
```

---

## Summary

- **`google-services.json`** = Client-side (React Native) - Get tokens, receive notifications
- **Service Account JSON** = Server-side (Backend) - Send notifications, manage tokens

**You need BOTH files:**
1. Client config for your React Native app
2. Service Account for your backend API
