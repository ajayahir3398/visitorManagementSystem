# 🛡️ Security Dashboard — Complete Design Document

> **Purpose:** Operational tool for security guards to handle visitors, emergencies, and gate access quickly and efficiently.
> **Target Device:** Mobile (primary) / Tablet / Kiosk

---

## 🎯 Main Purpose

Security dashboard should allow guards to:

- Add visitors quickly
- Check pending approvals
- Verify pre-approved guest codes
- Handle emergencies
- Track people currently inside

> ❌ No finance. No admin analytics. Operations only.

---

## 🧱 Dashboard Structure Overview

```
HEADER
Quick Actions (2×2 grid)
Visitor Summary Cards (2×2 grid)
Pending Approvals
Visitors Inside
Guest Code Verification
Emergency Alert (conditional)
Recent Activity
Bottom Navigation
```

---

## 1️⃣ Top Bar (Header)

**Height:** 56px | **Padding:** 16px

```
┌────────────────────────────────────┐
│  Green Valley Society              │
│  Gate: Main Gate                   │
│  🔔 Notifications       👤 Guard   │
└────────────────────────────────────┘
```

---

## 2️⃣ Quick Action Buttons (Most Important)

These must be **large, always visible, one-tap access**.

**Layout:** 2×2 Grid | **Card Height:** 90px | **Border Radius:** 12px | **Gap:** 12px

```
┌──────────────────┬──────────────────┐
│  ➕ New Visitor  │  🔑 Verify Code  │
│     Entry        │                  │
├──────────────────┼──────────────────┤
│  🚨 Emergency    │  📋 Visitor Log  │
│     Alert        │                  │
└──────────────────┴──────────────────┘
```

**Rules:**

- Full-width buttons
- Always visible at top
- Single tap access to each action

---

## 3️⃣ Today's Visitor Summary

Simple stats — helps security understand current gate traffic.

**Layout:** 2×2 Cards | **Card Height:** 70px | **Border Radius:** 10px | **Gap:** 10px

```
┌──────────────────┬──────────────────┐
│  Today           │  Pending         │
│  Visitors        │  Approvals       │
│  42              │  3               │
├──────────────────┼──────────────────┤
│  Inside          │  Exited          │
│  Premises        │  Today           │
│  21              │  18              │
└──────────────────┴──────────────────┘
```

**API:** `GET /security/dashboard/overview`

---

## 4️⃣ Pending Approvals

**Most frequently checked section.** Shows visitors waiting for resident approval.

**Row Height:** 60px | **Padding:** 12px | **Max Rows:** 3 (then scroll)

```
Pending Visitor Requests
──────────────────────────────────────
Rahul (Delivery) → A-302
Swiggy → B-101
Amazon → C-404
```

**Actions per row:**

| Action              | Description              |
| ------------------- | ------------------------ |
| Call Resident       | Directly call to approve |
| Resend Notification | Push notification again  |
| Cancel Entry        | Remove pending request   |

**API:** `GET /security/dashboard/pending-approvals`

---

## 5️⃣ Active Visitors (Inside Premises)

Shows all visitors currently inside. Helps maintain security accountability.

**Row Height:** 56px | **Exit Button Width:** 72px

```
Visitors Inside
──────────────────────────────────────
Ramesh — A-201        Entry: 10:30 AM    [Mark Exit]
Amazon Delivery — B-302  Entry: 11:10 AM  [Mark Exit]
Food Delivery — C-105  Entry: 11:45 AM   [Mark Exit]
```

**API:** `GET /security/dashboard/inside-visitors`
**Exit Action:** `POST /security/visitor-exit`

---

## 6️⃣ Pre-Approved Guest Code Verification

Residents generate codes in advance. Security verifies at gate.

**Input Height:** 44px | **Button Height:** 44px | **Border Radius:** 8px

```
Verify Guest Code
──────────────────────────────────────

  [ Enter 6-digit code: _________ ]

  [         Verify Entry          ]
```

**If valid, system responds:**

```
✅ Entry Approved
Unit: A-302
Resident: Amit Shah
Guest: Rajesh
Purpose: Family Visit
```

**API:** `POST /security/verify-guest-code`

---

## 7️⃣ Emergency Alert Panel

Only visible when an active emergency exists.

**Card Height:** 100px | **Background:** Red-tinted | **Border Radius:** 12px

```
🚨 EMERGENCY ACTIVE
──────────────────────────────────────
Type:       Medical
Location:   Flat B-205
Raised by:  Resident
Time:       11:20 AM
```

**Actions:**

| Button      | Action            |
| ----------- | ----------------- |
| Acknowledge | Mark as seen      |
| Respond     | Dispatch response |

**API:** `GET /security/dashboard/emergency` | `POST /security/emergency`

---

## 8️⃣ Recent Activity Log

Shows latest 5 system actions. Helps guard verify what has happened.

**Row Height:** 48px | **Max Rows:** 5

```
Recent Activity
──────────────────────────────────────
✅  Visitor entered → A-201       10:45 AM
✅  Visitor exited → B-404        10:30 AM
🔑  Pre-approved guest verified   10:15 AM
🚨  Emergency acknowledged        10:00 AM
✅  Visitor entered → C-105       09:50 AM
```

**API:** `GET /security/dashboard/recent-activity`

---

## 9️⃣ Shift Information (Optional)

Useful for accountability and handover tracking.

```
Guard:  Rajesh Kumar
Gate:   Main Gate
Shift:  8:00 AM – 8:00 PM
```

---

## 🔟 Bottom Navigation

**Height:** 56px | **4 icons**

```
┌──────────────────────────────────────┐
│  🏠 Dashboard  |  👤 Entry  |  📋 Logs  |  🚨 Emergency │
└──────────────────────────────────────┘
```

---

## 📱 Visitor Entry Flow (Step-by-Step)

### Screen Map

```
Login
  ↓
Security Dashboard
  ↓
Visitor Entry Form
  ↓
Unit / Resident Search
  ↓
Resident Approval Status  ←→  Guest Code Verification
  ↓
Entry Success Screen
  ↓
Visitors Inside List
  ↓
Visitor Exit
```

### Step 1 — Visitor Details

Minimal fields only:

| Field          | Type     | Required |
| -------------- | -------- | -------- |
| Visitor Name   | Text     | ✅       |
| Phone Number   | Number   | Optional |
| Purpose        | Dropdown | ✅       |
| Vehicle Number | Text     | Optional |
| Photo          | Camera   | Optional |

**Purpose options:** Guest · Delivery · Service · Cab · Other

### Step 2 — Select Unit

```
Search Flat / Unit

A-101   A-102
A-201   B-301   B-404...
```

Filter by building. Large tap targets.

### Step 3 — Entry Method

**Option A — Resident Approval Required:**

```
Visitor Request Sent
Waiting for Resident Approval...

[Call Resident]   [Resend]   [Cancel]
```

**Option B — Pre-Approved Guest Code:**

```
Enter Guest Code
[ 482917 ]   [ Verify ]

✅ Approved | Flat A-302 | Resident: Amit Shah

[ Allow Entry ]
```

### Step 4 — Entry Success

```
✅ Visitor Entry Successful

Visitor:     Rahul
Flat:        A-302
Entry Time:  10:45 AM

[Add Another Visitor]   [Back to Dashboard]
```

---

## 🔌 Complete API Reference

| Widget                     | Method | Endpoint                                |
| -------------------------- | ------ | --------------------------------------- |
| Full Dashboard (1 request) | GET    | `/security/dashboard`                   |
| Visitor Summary            | GET    | `/security/dashboard/overview`          |
| Pending Approvals          | GET    | `/security/dashboard/pending-approvals` |
| Visitors Inside            | GET    | `/security/dashboard/inside-visitors`   |
| Recent Activity            | GET    | `/security/dashboard/recent-activity`   |
| Emergency Alert            | GET    | `/security/dashboard/emergency`         |
| Guest Code Verify          | POST   | `/security/verify-guest-code`           |
| New Visitor Entry          | POST   | `/security/visitor-entry`               |
| Mark Visitor Exit          | POST   | `/security/visitor-exit`                |
| Raise Emergency            | POST   | `/security/emergency`                   |

### Optimized Single Dashboard Load

```http
GET /security/dashboard
```

```json
{
  "overview": { "todayVisitors": 42, "pendingApprovals": 3, "insideVisitors": 21, "exitedToday": 18 },
  "pendingApprovals": [...],
  "insideVisitors": [...],
  "recentActivity": [...],
  "emergency": { "active": false }
}
```

---

## 🔒 Role-Based Access Rules

Security role **can access:**

- ✅ Visitor entry / exit
- ✅ Pending approvals
- ✅ Guest code verification
- ✅ Emergency alerts
- ✅ Entry/exit activity logs

Security role **cannot access:**

- ❌ Maintenance & payments
- ❌ Resident analytics or list
- ❌ Notices or rules management
- ❌ Subscription or billing details
- ❌ Admin reports

---

## 🎨 Design System

### Colors

| Token      | Hex       | Usage                   |
| ---------- | --------- | ----------------------- |
| Primary    | `#2563EB` | Buttons, highlights     |
| Success    | `#16A34A` | Entry confirmed, active |
| Warning    | `#F59E0B` | Pending approvals       |
| Danger     | `#DC2626` | Emergency, cancel       |
| Background | `#F5F7FA` | App background          |

### Typography

| Element     | Size | Weight  |
| ----------- | ---- | ------- |
| Heading     | 18px | Bold    |
| Card Number | 24px | Bold    |
| Labels      | 12px | Regular |
| Buttons     | 14px | Medium  |

### Spacing System

```
Base: 8px
Scale: 8 / 16 / 24 / 32
```

### Grid (Mobile Primary)

```
Width:    390px
Padding:  16px
Columns:  4
Gutter:   8px
```

---

## 📱 Complete Screen List (8 Screens)

| Screen            | Purpose                    |
| ----------------- | -------------------------- |
| Login             | Guard authentication       |
| Dashboard         | Main operational overview  |
| Visitor Entry     | New visitor form           |
| Unit Search       | Select resident / flat     |
| Approval Status   | Wait for resident response |
| Visitors Inside   | Track all active visitors  |
| Guest Code Verify | Pre-approved guest entry   |
| Emergency         | Raise or respond to alert  |

---

## 🧠 UX Design Principles

> Security guards operate under pressure. Design for speed.

- ✔ **Minimal taps** — most actions in 1–2 taps
- ✔ **Large buttons** — finger-friendly tap targets
- ✔ **Most-used actions on top** — no scrolling for critical tasks
- ✔ **Mobile-first** — single column, no clutter
- ✔ **Clear section separation** — guard knows where to look instantly
- ✔ **Camera support** — photo capture for visitors
- ✔ **Offline fallback** — basic entry still works without internet

---

## 🚀 Priority Order

| Priority | Feature                  |
| -------- | ------------------------ |
| 1️⃣       | New Visitor Entry        |
| 2️⃣       | Pending Approvals        |
| 3️⃣       | Active Visitors (Inside) |
| 4️⃣       | Emergency Alerts         |
| 5️⃣       | Guest Code Verification  |
| 6️⃣       | Recent Activity          |
| 7️⃣       | Shift Info               |
