# 🛡️ Security Dashboard API Documentation

This document provides technical details for the Security Dashboard APIs in the Visitor Management System.

## 🧱 Dashboard Data Structure

Dashboard widgets can be populated using the following granular endpoints.

---

## 📊 Granular Endpoints

### 1. Dashboard Overview

**Endpoint:** `GET /api/v1/security/dashboard/overview`  
**Returns:**

- `todayVisitors`: Total successful entries today.
- `pendingApprovals`: Count of visitors waiting for resident response.
- `insideVisitors`: Count of visitors currently on premises (not exited).
- `exitedToday`: Count of visitors who left today.

### 2. Pending Approvals

**Endpoint:** `GET /api/v1/security/dashboard/pending-approvals`  
**Description:** Get real-time list of visitors waiting for resident decision.

### 3. Visitors Inside

**Endpoint:** `GET /api/v1/security/dashboard/inside-visitors`  
**Description:** Track who is currently inside the society.

### 4. Recent Activity

**Endpoint:** `GET /api/v1/security/dashboard/recent-activity`  
**Description:** Latest 5 actions (Entry, Exit, Rejected, Pending).

### 5. Active Emergency

**Endpoint:** `GET /api/v1/security/dashboard/emergency`  
**Description:** Returns active emergency details if any (`OPEN` or `ACKNOWLEDGED`).

---

## 🏗️ Operational Actions

### 1. Verify Guest Code

**Endpoint:** `POST /api/v1/security/verify-guest-code`  
**Body:**

```json
{
  "code": "GV-123456",
  "gateId": 1,
  "visitorId": null
}
```

### 2. New Visitor Entry

**Endpoint:** `POST /api/v1/security/visitor-entry`  
**Description:** Register a new visitor and notify the resident. Can use either an existing `visitorId` or provide `name` and `mobile` to create a new visitor.
**Body:**

```json
{
  "name": "Jane Doe",
  "mobile": "9876543210",
  "gateId": 1,
  "unitId": 2,
  "purpose": "Delivery"
}
```

_Note: Alternatively, provide `"visitorId": 123` instead of `name` and `mobile`._

### 3. Mark Visitor Exit

**Endpoint:** `POST /api/v1/security/visitor-exit`  
**Body:**

```json
{
  "visitorLogId": 123,
  "exitTime": "optional ISO date"
}
```

### 4. Raise Emergency Alert

**Endpoint:** `POST /api/v1/security/emergency`  
**Description:** Raise panic/emergency alert from the main gate.

---

## 🔒 Security

- All endpoints require `Authorization: Bearer <token>`
- Only users with the `SECURITY` role can access these endpoints.
- Guards must be associated with a `societyId` to view logs.
