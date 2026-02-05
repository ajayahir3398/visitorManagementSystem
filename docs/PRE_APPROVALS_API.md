# Pre-Approvals API Documentation

Complete documentation for Pre-Approvals API endpoints with React Native integration examples.

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

## Overview

Pre-Approvals allow residents to generate **6-digit access codes** for guests before they arrive. When the guest arrives at the gate, security can verify the code and the visitor entry is **automatically approved** without requiring resident interaction.

### Key Features

- ✅ **6-digit access codes** in format `GV-XXXXXX` (e.g., `GV-483921`)
- ✅ **Time-based validity** (validFrom to validTill)
- ✅ **Usage limits** (maxUses - how many times code can be used)
- ✅ **Auto-approved entries** - No resident approval needed at gate time
- ✅ **Auto-expiration** - Codes expire after validTill or when max uses reached
- ✅ **Revocable** - Residents can revoke codes anytime

---

## API Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| POST | `/pre-approvals` | Create a new pre-approval with access code | RESIDENT |
| GET | `/pre-approvals` | Get all pre-approvals (with pagination & filters) | RESIDENT |
| GET | `/pre-approvals/:id` | Get pre-approval by ID | RESIDENT |
| POST | `/pre-approvals/:id/revoke` | Revoke a pre-approval | RESIDENT |
| POST | `/pre-approvals/verify` | Verify access code and create visitor entry | SOCIETY_ADMIN, SECURITY |

---

## 1. Create Pre-Approval

Create a new pre-approval with a unique 6-digit access code. The code can be shared with guests for instant entry at the gate.

### Endpoint

```
POST /api/v1/pre-approvals
```

### Authorization

- **Required Role**: `RESIDENT` only
- **Note**: Resident must be a member of the specified unit

### Request Body

```json
{
  "unitId": 5,
  "guestName": "Rahul",
  "guestMobile": "9876543210",
  "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "validFrom": "2024-01-20T08:00:00.000Z",
  "validTill": "2024-01-20T22:00:00.000Z",
  "maxUses": 1
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `unitId` | integer | Yes | Unit ID where guest will visit |
| `guestName` | string | No | Name of the guest (optional) |
| `guestMobile` | string | No | Mobile number of the guest (optional, helps auto-create visitor) |
| `photoBase64` | string | No | Base64 data URI for the guest photo (optional) |
| `validFrom` | string (ISO 8601) | Yes | Code becomes valid from this time |
| `validTill` | string (ISO 8601) | Yes | Code expires at this time |
| `maxUses` | integer | No | Maximum number of times this code can be used (default: 1) |

### Success Response (201)

```json
{
  "success": true,
  "message": "Pre-approval created successfully",
  "data": {
    "preApproval": {
      "id": 1,
      "societyId": 1,
      "unitId": 5,
      "residentId": 10,
      "guestName": "Rahul",
      "guestMobile": "9876543210",
      "photoBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
      "accessCode": "GV-483921",
      "validFrom": "2024-01-20T08:00:00.000Z",
      "validTill": "2024-01-20T22:00:00.000Z",
      "maxUses": 1,
      "usedCount": 0,
      "status": "ACTIVE",
      "createdAt": "2024-01-20T07:00:00.000Z",
      "updatedAt": "2024-01-20T07:00:00.000Z",
      "unit": {
        "id": 5,
        "unitNo": "A-101",
        "unitType": "2BHK"
      },
      "resident": {
        "id": 10,
        "name": "John Doe",
        "mobile": "1234567890"
      }
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `preApproval.id` | integer | Pre-approval ID |
| `preApproval.accessCode` | string | 6-digit access code (e.g., "GV-483921") |
| `preApproval.status` | string | Status: "ACTIVE", "EXPIRED", "USED", or "REVOKED" |
| `preApproval.validFrom` | string (ISO 8601) | Code becomes valid from this time |
| `preApproval.validTill` | string (ISO 8601) | Code expires at this time |
| `preApproval.maxUses` | integer | Maximum number of uses |
| `preApproval.usedCount` | integer | Current number of uses |
| `preApproval.photoBase64` | string | Guest photo in base64 data URI format (optional) |
| `preApproval.unit` | object | Unit information |
| `preApproval.resident` | object | Resident information |

### Error Responses

**400 Bad Request** - Validation error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "unitId is required",
      "param": "unitId",
      "location": "body"
    }
  ]
}
```

**400 Bad Request** - Invalid dates
```json
{
  "success": false,
  "message": "validTill must be after validFrom"
}
```

**403 Forbidden** - Not a member of the unit
```json
{
  "success": false,
  "message": "Access denied. You can only create pre-approvals for your units."
}
```

**404 Not Found** - Unit not found
```json
{
  "success": false,
  "message": "Unit not found"
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Not RESIDENT role
```json
{
  "success": false,
  "message": "Insufficient permissions. Required role: RESIDENT"
}
```

---

## 2. Get All Pre-Approvals

Get a list of all pre-approvals created by the resident. Supports pagination and status filtering.

### Endpoint

```
GET /api/v1/pre-approvals
```

### Authorization

- **Required Role**: `RESIDENT` only
- **Note**: Returns only pre-approvals created by the resident

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number for pagination |
| `limit` | integer | No | 10 | Number of items per page |
| `status` | string | No | - | Filter by status: `ACTIVE`, `EXPIRED`, `USED`, `REVOKED` |

### Success Response (200)

```json
{
  "success": true,
  "message": "Pre-approvals retrieved successfully",
  "data": {
    "preApprovals": [
      {
        "id": 1,
        "societyId": 1,
        "unitId": 5,
        "residentId": 10,
        "guestName": "Rahul",
        "guestMobile": "9876543210",
        "accessCode": "GV-483921",
        "validFrom": "2024-01-20T08:00:00.000Z",
        "validTill": "2024-01-20T22:00:00.000Z",
        "maxUses": 1,
        "usedCount": 0,
        "status": "ACTIVE",
        "createdAt": "2024-01-20T07:00:00.000Z",
        "updatedAt": "2024-01-20T07:00:00.000Z",
        "unit": {
          "id": 5,
          "unitNo": "A-101",
          "unitType": "2BHK"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Error Responses

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Not RESIDENT role
```json
{
  "success": false,
  "message": "Insufficient permissions. Required role: RESIDENT"
}
```

---

## 3. Get Pre-Approval by ID

Get details of a specific pre-approval by ID.

### Endpoint

```
GET /api/v1/pre-approvals/:id
```

### Authorization

- **Required Role**: `RESIDENT` only
- **Note**: Resident can only view their own pre-approvals

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Pre-approval ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Pre-approval retrieved successfully",
  "data": {
    "preApproval": {
      "id": 1,
      "societyId": 1,
      "unitId": 5,
      "residentId": 10,
      "guestName": "Rahul",
      "guestMobile": "9876543210",
      "accessCode": "GV-483921",
      "validFrom": "2024-01-20T08:00:00.000Z",
      "validTill": "2024-01-20T22:00:00.000Z",
      "maxUses": 1,
      "usedCount": 0,
      "status": "ACTIVE",
      "createdAt": "2024-01-20T07:00:00.000Z",
      "updatedAt": "2024-01-20T07:00:00.000Z",
      "unit": {
        "id": 5,
        "unitNo": "A-101",
        "unitType": "2BHK"
      },
      "resident": {
        "id": 10,
        "name": "John Doe",
        "mobile": "1234567890"
      }
    }
  }
}
```

### Error Responses

**400 Bad Request** - Invalid ID
```json
{
  "success": false,
  "message": "Invalid pre-approval ID"
}
```

**404 Not Found** - Pre-approval not found
```json
{
  "success": false,
  "message": "Pre-approval not found"
}
```

**403 Forbidden** - Not owner of pre-approval
```json
{
  "success": false,
  "message": "Access denied. You can only view your own pre-approvals."
}
```

---

## 4. Revoke Pre-Approval

Revoke a pre-approval, making the access code invalid. Cannot revoke already used or revoked codes.

### Endpoint

```
POST /api/v1/pre-approvals/:id/revoke
```

### Authorization

- **Required Role**: `RESIDENT` only
- **Note**: Resident can only revoke their own pre-approvals

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | Pre-approval ID |

### Success Response (200)

```json
{
  "success": true,
  "message": "Pre-approval revoked successfully",
  "data": {
    "preApproval": {
      "id": 1,
      "status": "REVOKED",
      "accessCode": "GV-483921",
      "unit": {
        "id": 5,
        "unitNo": "A-101",
        "unitType": "2BHK"
      }
    }
  }
}
```

### Error Responses

**400 Bad Request** - Already revoked or used
```json
{
  "success": false,
  "message": "Pre-approval is already revoked",
  "data": {
    "preApproval": { /* pre-approval object */ }
  }
}
```

**404 Not Found** - Pre-approval not found
```json
{
  "success": false,
  "message": "Pre-approval not found"
}
```

**403 Forbidden** - Not owner of pre-approval
```json
{
  "success": false,
  "message": "Access denied. You can only revoke your own pre-approvals."
}
```

---

## 5. Verify Access Code and Create Visitor Entry

Security guard verifies the 6-digit access code and creates an auto-approved visitor entry. This is the main endpoint used at the gate.

### Endpoint

```
POST /api/v1/pre-approvals/verify
```

### Authorization

- **Required Role**: `SOCIETY_ADMIN` or `SECURITY`
- **Note**: Security guard must be associated with a society

### Request Body

```json
{
  "accessCode": "GV-483921",
  "gateId": 1,
  "visitorId": 1
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accessCode` | string | Yes | 6-digit access code (e.g., "GV-483921") |
| `gateId` | integer | Yes | Gate ID where guest is entering |
| `visitorId` | integer | No | Optional: Visitor ID if guest already exists in system |

### Success Response (200)

```json
{
  "success": true,
  "message": "Access code verified and entry approved successfully",
  "data": {
    "visitorLog": {
      "id": 1,
      "societyId": 1,
      "gateId": 1,
      "visitorId": 1,
      "unitId": 5,
      "preApprovalId": 1,
      "purpose": "Pre-approved guest - Code: GV-483921",
      "entryTime": "2024-01-20T10:00:00.000Z",
      "exitTime": null,
      "status": "approved",
      "createdBy": 3,
      "createdAt": "2024-01-20T10:00:00.000Z",
      "visitor": {
        "id": 1,
        "name": "Rahul",
        "mobile": "9876543210",
        "photoBase64": null
      },
      "unit": {
        "id": 5,
        "unitNo": "A-101",
        "unitType": "2BHK"
      },
      "gate": {
        "id": 1,
        "name": "Main Gate"
      },
      "createdByUser": {
        "id": 3,
        "name": "Security Guard"
      }
    },
    "preApproval": {
      "id": 1,
      "accessCode": "GV-483921",
      "usedCount": 1,
      "status": "USED",
      "maxUses": 1
    },
    "unit": {
      "id": 5,
      "unitNo": "A-101",
      "unitType": "2BHK"
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `visitorLog` | object | Auto-approved visitor log entry |
| `visitorLog.status` | string | Status: "approved" (auto-approved) |
| `visitorLog.preApprovalId` | integer | ID of the pre-approval used |
| `preApproval` | object | Updated pre-approval with new usedCount and status |
| `unit` | object | Unit information for the entry |

### Error Responses

**400 Bad Request** - Invalid code format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "accessCode is required",
      "param": "accessCode",
      "location": "body"
    }
  ]
}
```

**404 Not Found** - Invalid access code
```json
{
  "success": false,
  "message": "Invalid access code"
}
```

**400 Bad Request** - Code expired
```json
{
  "success": false,
  "message": "Code has expired",
  "data": {
    "preApproval": { /* pre-approval object */ }
  }
}
```

**400 Bad Request** - Code already used
```json
{
  "success": false,
  "message": "Code has reached maximum uses",
  "data": {
    "preApproval": { /* pre-approval object */ }
  }
}
```

**400 Bad Request** - Code not yet valid
```json
{
  "success": false,
  "message": "Code is not yet valid",
  "data": {
    "preApproval": { /* pre-approval object */ }
  }
}
```

**400 Bad Request** - Code revoked
```json
{
  "success": false,
  "message": "Code is revoked",
  "data": {
    "preApproval": { /* pre-approval object */ }
  }
}
```

**403 Forbidden** - Code belongs to different society
```json
{
  "success": false,
  "message": "Access denied. This code does not belong to your society."
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**403 Forbidden** - Not SECURITY or SOCIETY_ADMIN role
```json
{
  "success": false,
  "message": "Insufficient permissions. Required role: SOCIETY_ADMIN or SECURITY"
}
```

---

## React Native Integration

### Setup

1. Install required dependencies (if not already installed):
```bash
npm install axios
# or
yarn add axios
```

2. Create an API service file for pre-approvals:

### Pre-Approval Service (`services/preApprovalService.js`)

```javascript
import axios from 'axios';
import { getAccessToken } from './authService'; // Your auth service

const BASE_URL = 'http://localhost:1111/api/v1'; // Replace with your production URL

const preApprovalService = {
  /**
   * Create a new pre-approval
   * @param {Object} data - Pre-approval data
   * @param {number} data.unitId - Unit ID
   * @param {string} [data.guestName] - Guest name (optional)
   * @param {string} [data.guestMobile] - Guest mobile (optional)
   * @param {string} data.validFrom - Valid from date (ISO 8601)
   * @param {string} data.validTill - Valid till date (ISO 8601)
   * @param {number} [data.maxUses=1] - Maximum uses (default: 1)
   * @returns {Promise<Object>} Created pre-approval with access code
   */
  async create(unitId, validFrom, validTill, options = {}) {
    try {
      const token = await getAccessToken();
      const payload = {
        unitId,
        validFrom,
        validTill,
        maxUses: options.maxUses || 1,
        ...(options.guestName && { guestName: options.guestName }),
        ...(options.guestMobile && { guestMobile: options.guestMobile }),
      };

      const response = await axios.post(`${BASE_URL}/pre-approvals`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.preApproval;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (status === 403) {
          throw new Error(data.message || 'Access denied. RESIDENT role required.');
        } else if (status === 400) {
          throw new Error(data.message || 'Invalid request data.');
        } else {
          throw new Error(data.message || 'Failed to create pre-approval');
        }
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },

  /**
   * Get all pre-approvals
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @param {string} [status] - Filter by status (ACTIVE, EXPIRED, USED, REVOKED)
   * @returns {Promise<Object>} Response with preApprovals and pagination
   */
  async getAll(page = 1, limit = 10, status = null) {
    try {
      const token = await getAccessToken();
      const params = { page, limit };
      if (status) params.status = status;

      const response = await axios.get(`${BASE_URL}/pre-approvals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      });

      return response.data.data;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (status === 403) {
          throw new Error('Access denied. RESIDENT role required.');
        } else {
          throw new Error(data.message || 'Failed to fetch pre-approvals');
        }
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },

  /**
   * Get pre-approval by ID
   * @param {number} preApprovalId - Pre-approval ID
   * @returns {Promise<Object>} Pre-approval details
   */
  async getById(preApprovalId) {
    try {
      const token = await getAccessToken();
      const response = await axios.get(`${BASE_URL}/pre-approvals/${preApprovalId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data.preApproval;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (status === 403) {
          throw new Error(data.message || 'Access denied.');
        } else if (status === 404) {
          throw new Error('Pre-approval not found.');
        } else {
          throw new Error(data.message || 'Failed to fetch pre-approval');
        }
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },

  /**
   * Revoke a pre-approval
   * @param {number} preApprovalId - Pre-approval ID
   * @returns {Promise<Object>} Revoked pre-approval
   */
  async revoke(preApprovalId) {
    try {
      const token = await getAccessToken();
      const response = await axios.post(
        `${BASE_URL}/pre-approvals/${preApprovalId}/revoke`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data.preApproval;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (status === 403) {
          throw new Error(data.message || 'Access denied.');
        } else if (status === 400) {
          throw new Error(data.message || 'Cannot revoke this pre-approval.');
        } else if (status === 404) {
          throw new Error('Pre-approval not found.');
        } else {
          throw new Error(data.message || 'Failed to revoke pre-approval');
        }
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },

  /**
   * Verify access code (for SECURITY/SOCIETY_ADMIN)
   * @param {string} accessCode - 6-digit access code (e.g., "GV-483921")
   * @param {number} gateId - Gate ID
   * @param {number} [visitorId] - Optional visitor ID
   * @returns {Promise<Object>} Response with visitorLog and preApproval
   */
  async verifyCode(accessCode, gateId, visitorId = null) {
    try {
      const token = await getAccessToken();
      const payload = {
        accessCode: accessCode.trim(),
        gateId,
        ...(visitorId && { visitorId }),
      };

      const response = await axios.post(`${BASE_URL}/pre-approvals/verify`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.data;
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          throw new Error('Session expired. Please login again.');
        } else if (status === 403) {
          throw new Error(data.message || 'Access denied. SECURITY or SOCIETY_ADMIN role required.');
        } else if (status === 400) {
          throw new Error(data.message || 'Invalid or expired code.');
        } else if (status === 404) {
          throw new Error('Invalid access code.');
        } else {
          throw new Error(data.message || 'Failed to verify code');
        }
      } else {
        throw new Error('Network error. Please check your connection.');
      }
    }
  },
};

export default preApprovalService;
```

### React Native Component Examples

#### Resident: Create Pre-Approval Screen

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import preApprovalService from '../services/preApprovalService';

const CreatePreApprovalScreen = ({ navigation, route }) => {
  const { unitId } = route.params; // Unit ID from previous screen
  const [guestName, setGuestName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [validFrom, setValidFrom] = useState(new Date());
  const [validTill, setValidTill] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [maxUses, setMaxUses] = useState('1');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showTillPicker, setShowTillPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!guestName.trim()) {
      Alert.alert('Error', 'Please enter guest name');
      return;
    }

    try {
      setLoading(true);
      const preApproval = await preApprovalService.create(
        unitId,
        validFrom.toISOString(),
        validTill.toISOString(),
        {
          guestName: guestName.trim(),
          guestMobile: guestMobile.trim() || null,
          maxUses: parseInt(maxUses) || 1,
        }
      );

      Alert.alert(
        'Success',
        `Pre-approval created!\n\nAccess Code: ${preApproval.accessCode}\n\nShare this code with your guest.`,
        [
          {
            text: 'Share Code',
            onPress: () => {
              // Share code via WhatsApp/SMS
              // You can use react-native-share library
            },
          },
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Guest Name *</Text>
        <TextInput
          style={styles.input}
          value={guestName}
          onChangeText={setGuestName}
          placeholder="Enter guest name"
        />

        <Text style={styles.label}>Guest Mobile (Optional)</Text>
        <TextInput
          style={styles.input}
          value={guestMobile}
          onChangeText={setGuestMobile}
          placeholder="Enter mobile number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Valid From *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowFromPicker(true)}
        >
          <Text>{validFrom.toLocaleString()}</Text>
        </TouchableOpacity>
        {showFromPicker && (
          <DateTimePicker
            value={validFrom}
            mode="datetime"
            is24Hour={true}
            onChange={(event, date) => {
              setShowFromPicker(false);
              if (date) setValidFrom(date);
            }}
          />
        )}

        <Text style={styles.label}>Valid Till *</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowTillPicker(true)}
        >
          <Text>{validTill.toLocaleString()}</Text>
        </TouchableOpacity>
        {showTillPicker && (
          <DateTimePicker
            value={validTill}
            mode="datetime"
            is24Hour={true}
            minimumDate={validFrom}
            onChange={(event, date) => {
              setShowTillPicker(false);
              if (date) setValidTill(date);
            }}
          />
        )}

        <Text style={styles.label}>Max Uses</Text>
        <TextInput
          style={styles.input}
          value={maxUses}
          onChangeText={setMaxUses}
          placeholder="1"
          keyboardType="number-pad"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Pre-Approval</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreatePreApprovalScreen;
```

#### Resident: List Pre-Approvals Screen

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import preApprovalService from '../services/preApprovalService';

const PreApprovalsScreen = () => {
  const [preApprovals, setPreApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadPreApprovals();
  }, []);

  const loadPreApprovals = async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await preApprovalService.getAll(pageNum, 10);
      
      if (refresh || pageNum === 1) {
        setPreApprovals(result.preApprovals);
      } else {
        setPreApprovals(prev => [...prev, ...result.preApprovals]);
      }

      setPagination(result.pagination);
      setHasMore(result.pagination.page < result.pagination.pages);
      setPage(pageNum);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRevoke = async (preApprovalId) => {
    Alert.alert(
      'Revoke Pre-Approval',
      'Are you sure you want to revoke this pre-approval? The access code will no longer be valid.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await preApprovalService.revoke(preApprovalId);
              Alert.alert('Success', 'Pre-approval revoked successfully');
              loadPreApprovals(1, true);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'EXPIRED':
        return '#FF9800';
      case 'USED':
        return '#2196F3';
      case 'REVOKED':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.codeText}>{item.accessCode}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      {item.guestName && (
        <Text style={styles.guestName}>Guest: {item.guestName}</Text>
      )}
      {item.guestMobile && (
        <Text style={styles.guestMobile}>Mobile: {item.guestMobile}</Text>
      )}

      <Text style={styles.unitText}>Unit: {item.unit.unitNo}</Text>
      <Text style={styles.validityText}>
        Valid: {new Date(item.validFrom).toLocaleString()} - {new Date(item.validTill).toLocaleString()}
      </Text>
      <Text style={styles.usesText}>
        Uses: {item.usedCount} / {item.maxUses}
      </Text>

      {item.status === 'ACTIVE' && (
        <TouchableOpacity
          style={styles.revokeButton}
          onPress={() => handleRevoke(item.id)}
        >
          <Text style={styles.revokeButtonText}>Revoke</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && preApprovals.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={preApprovals}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        onEndReached={() => {
          if (!loading && hasMore) {
            loadPreApprovals(page + 1);
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadPreApprovals(1, true)} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No pre-approvals found</Text>
          </View>
        }
      />
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
  card: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 5,
    color: '#333',
  },
  guestMobile: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  validityText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  usesText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  revokeButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#f44336',
    borderRadius: 6,
    alignItems: 'center',
  },
  revokeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 50,
  },
});

export default PreApprovalsScreen;
```

#### Security: Verify Code Screen

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import preApprovalService from '../services/preApprovalService';

const VerifyCodeScreen = ({ navigation, route }) => {
  const { gateId } = route.params; // Gate ID from previous screen
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!accessCode.trim()) {
      Alert.alert('Error', 'Please enter access code');
      return;
    }

    // Format: GV-XXXXXX
    const codePattern = /^GV-\d{6}$/;
    if (!codePattern.test(accessCode.trim())) {
      Alert.alert('Error', 'Invalid code format. Expected: GV-XXXXXX');
      return;
    }

    try {
      setLoading(true);
      const result = await preApprovalService.verifyCode(accessCode.trim(), gateId);

      Alert.alert(
        'Success',
        `Entry approved!\n\nGuest: ${result.visitorLog.visitor?.name || 'N/A'}\nUnit: ${result.unit.unitNo}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setAccessCode('');
              // Navigate to visitor log detail or refresh list
              navigation.navigate('VisitorLogDetail', { logId: result.visitorLog.id });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Enter Access Code</Text>
        <TextInput
          style={styles.input}
          value={accessCode}
          onChangeText={setAccessCode}
          placeholder="GV-483921"
          autoCapitalize="characters"
          maxLength={9}
        />
        <Text style={styles.hint}>
          Format: GV-XXXXXX (e.g., GV-483921)
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify & Allow Entry</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VerifyCodeScreen;
```

### Using the Service in Your App

```javascript
import preApprovalService from './services/preApprovalService';

// Create pre-approval
const createPreApproval = async () => {
  try {
    const preApproval = await preApprovalService.create(
      5, // unitId
      '2024-01-20T08:00:00.000Z', // validFrom
      '2024-01-20T22:00:00.000Z', // validTill
      {
        guestName: 'Rahul',
        guestMobile: '9876543210',
        photoBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...',
        maxUses: 1,
      }
    );
    console.log('Access Code:', preApproval.accessCode);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Get all pre-approvals
const loadPreApprovals = async () => {
  try {
    const result = await preApprovalService.getAll(1, 10, 'ACTIVE');
    console.log('Pre-approvals:', result.preApprovals);
  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Verify code (Security)
const verifyCode = async () => {
  try {
    const result = await preApprovalService.verifyCode('GV-483921', 1);
    console.log('Entry approved:', result.visitorLog);
  } catch (error) {
    console.error('Error:', error.message);
  }
};
```

---

## Role-Based Access Summary

| Operation | SUPER_ADMIN | SOCIETY_ADMIN | SECURITY | RESIDENT |
|-----------|-------------|---------------|----------|----------|
| Create Pre-Approval | ❌ | ❌ | ❌ | ✅ (own units only) |
| Get Pre-Approvals | ❌ | ❌ | ❌ | ✅ (own pre-approvals only) |
| Get Pre-Approval by ID | ❌ | ❌ | ❌ | ✅ (own pre-approvals only) |
| Revoke Pre-Approval | ❌ | ❌ | ❌ | ✅ (own pre-approvals only) |
| Verify Access Code | ❌ | ✅ | ✅ | ❌ |

---

## Special Notes

### Access Code Format

- Format: `GV-XXXXXX` where XXXXXX is a 6-digit number
- Example: `GV-483921`
- Codes are case-sensitive
- Always include the `GV-` prefix when entering codes

### Code Validity

- Codes are valid only between `validFrom` and `validTill` times
- Codes automatically expire when past `validTill`
- Codes cannot be used before `validFrom`
- All times are in UTC (ISO 8601 format)

### Usage Limits

- `maxUses` determines how many times a code can be used
- `usedCount` tracks current usage
- When `usedCount >= maxUses`, code status changes to `USED`
- Once `USED`, code cannot be used again

### Status Values

- **ACTIVE**: Code is valid and can be used
- **EXPIRED**: Code has passed its `validTill` time
- **USED**: Code has reached maximum uses
- **REVOKED**: Code was manually revoked by resident

### Auto-Approval

- When security verifies a code, the visitor entry is **automatically approved**
- No resident interaction needed at gate time
- Visitor log status is set to `"approved"` immediately
- Visitor log includes `preApprovalId` to link back to the pre-approval

### Visitor Auto-Creation

- If `guestMobile` is provided when creating pre-approval:
  - System tries to find existing visitor by mobile
  - If not found and `guestName` is provided, creates new visitor
  - This helps link the entry to the correct visitor record

### Revocation

- Residents can revoke pre-approvals anytime
- Revoked codes cannot be used
- Cannot revoke already `USED` or `REVOKED` codes
- Revocation is immediate - code becomes invalid right away

### Security Considerations

- Codes are unique across the system
- Codes belong to specific societies (security can only verify codes from their society)
- Codes are validated for time, usage, and status before allowing entry
- All code verifications create audit trail via visitor logs

### Best Practices

1. **Share codes securely**: Use secure channels (WhatsApp, SMS) to share codes
2. **Set appropriate validity**: Don't make codes valid for too long
3. **Use maxUses wisely**: Set `maxUses` based on expected number of guests
4. **Revoke unused codes**: Revoke codes if plans change
5. **Monitor usage**: Check `usedCount` to see if codes have been used

---

## Testing with Swagger UI

You can test all endpoints using Swagger UI:

1. Start your server: `npm run dev`
2. Open browser: `http://localhost:1111/api-docs`
3. Navigate to **v1 - Pre-Approvals** section
4. Click "Authorize" and enter your Bearer token
5. Test each endpoint

---

## Next Steps

1. Set up authentication in your React Native app (see [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md))
2. Implement the pre-approval service in your app
3. Create UI components for:
   - Create pre-approval form with date/time pickers
   - Display access code prominently
   - Share code functionality (WhatsApp/SMS)
   - List of pre-approvals with status indicators
   - Code verification screen for security
   - Revoke confirmation dialogs
4. Add proper error handling and loading states
5. Implement pull-to-refresh functionality
6. Add code validation (format checking)
7. Consider adding QR code generation (future enhancement)
8. Add notifications when codes are used
9. Test with multiple scenarios:
   - Creating codes with different validity periods
   - Verifying codes at different times
   - Revoking active codes
   - Using codes multiple times (if maxUses > 1)
   - Expired codes
   - Invalid codes

---

## Related Documentation

- **Visitor Logs API**: [VISITOR_LOGS_CRUD_API.md](./VISITOR_LOGS_CRUD_API.md) - Pre-approvals create auto-approved visitor logs
- **Approvals API**: [APPROVALS_CRUD_API.md](./APPROVALS_CRUD_API.md) - Regular approval flow (different from pre-approval)
- **Units API**: [UNITS_CRUD_API.md](./UNITS_CRUD_API.md) - Units are required for pre-approvals
- **Visitors API**: [VISITORS_CRUD_API.md](./VISITORS_CRUD_API.md) - Visitors can be auto-created from pre-approvals
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)

---

## Support

- **Swagger UI**: `http://localhost:1111/api-docs`
- **API Base URL**: `http://localhost:1111/api/v1`
- **Authentication Docs**: [API_DOCUMENTATION_V1_AUTHENTICATION.md](./API_DOCUMENTATION_V1_AUTHENTICATION.md)
- **React Native Setup**: [REACT_NATIVE_QUICK_START.md](./REACT_NATIVE_QUICK_START.md)


