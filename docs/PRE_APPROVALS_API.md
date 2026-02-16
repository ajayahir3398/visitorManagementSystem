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

---

## API Endpoints

| Method | Endpoint | Description | Required Role |
|--------|----------|-------------|---------------|
| POST | `/pre-approvals` | Create a new pre-approval with access code | RESIDENT |
| GET | `/pre-approvals` | Get pre-approvals (scoped by role) | RESIDENT, ADMIN, SECURITY |
| GET | `/pre-approvals/access-code/:code` | Get pre-approval details by access code | SECURITY |
| GET | `/pre-approvals/:id` | Get pre-approval by ID | RESIDENT, ADMIN, SECURITY |
| POST | `/pre-approvals/:id/revoke` | Revoke a pre-approval | RESIDENT |
| POST | `/pre-approvals/verify` | Verify access code and create visitor entry | SOCIETY_ADMIN, SECURITY |

---

## 1. Create Pre-Approval

Create a new pre-approval with a unique 6-digit access code.

### Authorization
- **Required Role**: `RESIDENT` only

---

## 2. Get All Pre-Approvals

Get a list of pre-approvals. Supports pagination and status filtering.

### Authorization
- **Allowed Roles**: `RESIDENT`, `SOCIETY_ADMIN`, `SECURITY`
- **Scoping**: Residents see only their own. Admins/Security see all in their society.

---

## 3. Get Pre-Approval by Access Code

Get details of a pre-approval using its 6-digit access code. This is a **read-only** endpoint — it does **not** consume the code or create a visitor entry.

### Endpoint

```
GET /api/v1/pre-approvals/access-code/:code
```

### Authorization
- **Required Role**: `SECURITY` only
- **Scoping**: Security guard can only view pre-approvals within their own society.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | ✅ | The 6-digit access code (e.g., `GV-483921`) |

### Example Request

```bash
curl -X GET http://localhost:1111/api/v1/pre-approvals/access-code/GV-483921 \
  -H "Authorization: Bearer <access_token>"
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Pre-approval details retrieved successfully",
  "data": {
    "preApproval": {
      "id": 5,
      "societyId": 1,
      "unitId": 3,
      "residentId": 12,
      "guestName": "Rahul Sharma",
      "guestMobile": "9876543210",
      "photoBase64": null,
      "accessCode": "GV-483921",
      "validFrom": "2026-02-17T08:00:00.000Z",
      "validTill": "2026-02-17T22:00:00.000Z",
      "maxUses": 1,
      "usedCount": 0,
      "status": "ACTIVE",
      "createdAt": "2026-02-17T06:30:00.000Z",
      "updatedAt": "2026-02-17T06:30:00.000Z",
      "unit": {
        "id": 3,
        "unitNo": "A-101",
        "unitType": "APARTMENT",
        "floor": "1",
        "block": "A",
        "societyId": 1
      },
      "resident": {
        "id": 12,
        "name": "John Doe",
        "mobile": "9123456789"
      }
    }
  }
}
```

### Error Responses

| Status | Message | Cause |
|--------|---------|-------|
| 400 | Access code is required | Empty `:code` parameter |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Security guard must be associated with a society | Security guard has no society assigned |
| 403 | Access denied. This pre-approval does not belong to your society. | Code belongs to a different society |
| 404 | Pre-approval not found for this code | Invalid or non-existent access code |

### React Native Integration

```typescript
// In your API service file (e.g., preApprovalService.ts)
import api from './api'; // Your axios instance with baseURL and auth interceptor

export const getPreApprovalByCode = async (accessCode: string) => {
  const response = await api.get(`/pre-approvals/access-code/${accessCode}`);
  return response.data;
};
```

```typescript
// Usage in a component or screen
import { getPreApprovalByCode } from '../api/preApprovalService';

const handleLookupCode = async (code: string) => {
  try {
    const result = await getPreApprovalByCode(code);
    if (result.success) {
      const preApproval = result.data.preApproval;
      console.log('Guest:', preApproval.guestName);
      console.log('Unit:', preApproval.unit.unitNo);
      console.log('Status:', preApproval.status);
      console.log('Valid:', preApproval.validFrom, '→', preApproval.validTill);
    }
  } catch (error: any) {
    const msg = error.response?.data?.message || 'Failed to look up code';
    Alert.alert('Error', msg);
  }
};
```

---

## 4. Get Pre-Approval by ID

Get details of a specific pre-approval by ID.

### Authorization
- **Allowed Roles**: `RESIDENT`, `SOCIETY_ADMIN`, `SECURITY`
- **Ownership**: Residents must own the pre-approval. Admins/Security must belong to the same society.

---

## 5. Revoke Pre-Approval

Revoke a pre-approval, making the access code invalid.

### Authorization
- **Required Role**: `RESIDENT` only
- **Note**: Resident can only revoke their own pre-approvals.

---

## 6. Verify Access Code and Create Visitor Entry

Security guard verifies the 6-digit access code.

### Authorization
- **Required Role**: `SOCIETY_ADMIN` or `SECURITY`
