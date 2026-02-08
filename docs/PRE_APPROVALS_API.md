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

## 3. Get Pre-Approval by ID

Get details of a specific pre-approval by ID.

### Authorization
- **Allowed Roles**: `RESIDENT`, `SOCIETY_ADMIN`, `SECURITY`
- **Ownership**: Residents must own the pre-approval. Admins/Security must belong to the same society.

---

## 4. Revoke Pre-Approval

Revoke a pre-approval, making the access code invalid.

### Authorization
- **Required Role**: `RESIDENT` only
- **Note**: Resident can only revoke their own pre-approvals.

---

## 5. Verify Access Code and Create Visitor Entry

Security guard verifies the 6-digit access code.

### Authorization
- **Required Role**: `SOCIETY_ADMIN` or `SECURITY`
