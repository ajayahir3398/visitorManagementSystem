# Super Admin Dashboard – React Native API Integration Guide

## Base URL

```
Production: https://visitormanagementsystem-10pj.onrender.com/api/v1
Development: http://localhost:1111/api/v1
```

## Authentication

All Super Admin APIs require a valid **SUPER_ADMIN JWT** token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## 1. API Service Setup

Create a dedicated service file for all Super Admin Dashboard API calls.

### `src/services/superAdminService.ts`

```typescript
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "YOUR_API_BASE_URL/api/v1";

// Create axios instance with auth interceptor
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ═══════════════════════════════════════════════════
// DASHBOARD METRICS
// ═══════════════════════════════════════════════════

/** Platform overview summary (KPI cards) */
export const getDashboardSummary = () =>
  api.get("/super-admin/dashboard/summary");

/** Revenue summary (MRR, this month, last month) */
export const getRevenueSummary = () =>
  api.get("/super-admin/dashboard/revenue");

/** Subscription breakdown (active/trial/grace/locked) */
export const getSubscriptionBreakdown = () =>
  api.get("/super-admin/dashboard/subscriptions");


/** Notification stats */
export const getNotificationStats = () =>
  api.get("/super-admin/dashboard/notifications");

// ═══════════════════════════════════════════════════
// CHARTS
// ═══════════════════════════════════════════════════

/** Society status distribution (Pie chart) */
export const getSocietyStatusChart = () =>
  api.get("/super-admin/charts/society-status");

/** Monthly revenue trend (Line chart) */
export const getMonthlyRevenueChart = (year?: number) =>
  api.get("/super-admin/charts/revenue", { params: { year } });


/** Plan distribution (Donut chart) */
export const getPlanDistributionChart = () =>
  api.get("/super-admin/charts/plan-distribution");

/** Trial → Paid conversion (Funnel chart) */
export const getConversionChart = () =>
  api.get("/super-admin/charts/conversion");

/** Top cities by society count */
export const getTopCitiesChart = () =>
  api.get("/super-admin/charts/top-cities");

// ═══════════════════════════════════════════════════
// QUICK ACTIONS
// ═══════════════════════════════════════════════════

/** Lock a society */
export const lockSociety = (societyId: number) =>
  api.post(`/super-admin/society/${societyId}/lock`);

/** Unlock a society */
export const unlockSociety = (societyId: number) =>
  api.post(`/super-admin/society/${societyId}/unlock`);

/** Extend trial period */
export const extendTrial = (societyId: number, days: number) =>
  api.post(`/super-admin/society/${societyId}/extend-trial`, { days });
```

---

## 2. TypeScript Interfaces

### `src/types/superAdmin.ts`

```typescript
// ── Dashboard Summary ──
export interface DashboardSummary {
  totalSocieties: number;
  activeSocieties: number;
  trialSocieties: number;
  lockedSocieties: number;
  totalSocietyAdmins: number;
}

// ── Revenue ──
export interface RevenueSummary {
  mrr: number;
  thisMonth: number;
  lastMonth: number;
  totalRevenue: number;
}

// ── Subscription Breakdown ──
export interface SubscriptionBreakdown {
  active: number;
  trial: number;
  grace: number;
  locked: number;
  expiringIn7Days: number;
}


// ── Notification Stats ──
export interface NotificationStats {
  total: number;
  byType: Record<string, number>;
}

// ── Chart Data ──
export interface StatusChartItem {
  status: string;
  count: number;
}

export interface MonthlyChartItem {
  month: string;
  amount: number;
}


export interface PlanDistributionItem {
  plan: string;
  count: number;
}

export interface ConversionData {
  trial: number;
  paid: number;
}

export interface CityChartItem {
  city: string;
  count: number;
}

// ── Actions ──
export interface ActionResult {
  societyId: number;
  status: string;
}

export interface ExtendTrialResult {
  societyId: number;
  subscriptionId: number;
  newExpiryDate: string;
  status: string;
}

// ── API Response Wrapper ──
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

---

## 3. Usage Example (React Native Screen)

### `src/screens/SuperAdminDashboard.tsx`

```tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  getDashboardSummary,
  getRevenueSummary,
  getSubscriptionBreakdown,
} from "../services/superAdminService";
import type {
  DashboardSummary,
  RevenueSummary,
  SubscriptionBreakdown,
  ApiResponse,
} from "../types/superAdmin";

const SuperAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [subscriptions, setSubscriptions] =
    useState<SubscriptionBreakdown | null>(null);

  const loadData = async () => {
    try {
      const [summaryRes, revenueRes, subsRes] = await Promise.all([
        getDashboardSummary(),
        getRevenueSummary(),
        getSubscriptionBreakdown(),
      ]);

      setSummary(summaryRes.data.data);
      setRevenue(revenueRes.data.data);
      setSubscriptions(subsRes.data.data);
    } catch (error) {
      console.error("Dashboard load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) return <ActivityIndicator size="large" />;

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* KPI Cards */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", padding: 16 }}>
        <KPICard label="Total Societies" value={summary?.totalSocieties} />
        <KPICard label="Active" value={summary?.activeSocieties} />
        <KPICard label="Trial" value={summary?.trialSocieties} />
        <KPICard label="Locked" value={summary?.lockedSocieties} />
      </View>

      {/* Revenue */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold" }}>Revenue</Text>
        <Text>MRR: ₹{revenue?.mrr?.toLocaleString()}</Text>
        <Text>This Month: ₹{revenue?.thisMonth?.toLocaleString()}</Text>
        <Text>Last Month: ₹{revenue?.lastMonth?.toLocaleString()}</Text>
      </View>
    </ScrollView>
  );
};

const KPICard = ({ label, value }: { label: string; value?: number }) => (
  <View
    style={{
      width: "48%",
      margin: "1%",
      padding: 16,
      backgroundColor: "#fff",
      borderRadius: 12,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}
  >
    <Text style={{ fontSize: 24, fontWeight: "bold" }}>{value ?? 0}</Text>
    <Text style={{ color: "#666", marginTop: 4 }}>{label}</Text>
  </View>
);

export default SuperAdminDashboard;
```

---

## 4. Quick Actions Usage

```typescript
import {
  lockSociety,
  unlockSociety,
  extendTrial,
} from "../services/superAdminService";

// Lock
const handleLock = async (societyId: number) => {
  const res = await lockSociety(societyId);
  console.log(res.data.message); // "Society has been locked successfully"
};

// Unlock
const handleUnlock = async (societyId: number) => {
  const res = await unlockSociety(societyId);
  console.log(res.data.message);
};

// Extend Trial by 7 days
const handleExtend = async (societyId: number) => {
  const res = await extendTrial(societyId, 7);
  console.log("New expiry:", res.data.data.newExpiryDate);
};
```

---

## 5. Complete API Endpoint Reference

### Dashboard Metrics

| Method | Endpoint                               | Description            |
| ------ | -------------------------------------- | ---------------------- |
| GET    | `/super-admin/dashboard/summary`       | KPI cards data         |
| GET    | `/super-admin/dashboard/revenue`       | Revenue metrics        |
| GET    | `/super-admin/dashboard/subscriptions` | Subscription breakdown |
| GET    | `/super-admin/dashboard/notifications` | Notification stats     |

### Charts

| Method | Endpoint                                | Query Params | Chart Type |
| ------ | --------------------------------------- | ------------ | ---------- |
| GET    | `/super-admin/charts/society-status`    | —            | Pie        |
| GET    | `/super-admin/charts/revenue`           | `year`       | Line       |
| GET    | `/super-admin/charts/plan-distribution` | —            | Donut      |
| GET    | `/super-admin/charts/conversion`        | —            | Funnel     |
| GET    | `/super-admin/charts/top-cities`        | —            | Bar        |

### Quick Actions

| Method | Endpoint                                | Body               | Description    |
| ------ | --------------------------------------- | ------------------ | -------------- |
| POST   | `/super-admin/society/:id/lock`         | —                  | Lock society   |
| POST   | `/super-admin/society/:id/unlock`       | —                  | Unlock society |
| POST   | `/super-admin/society/:id/extend-trial` | `{ days: number }` | Extend trial   |

---

## 6. Recommended Chart Libraries

| Library                      | Platform      | Best For                      |
| ---------------------------- | ------------- | ----------------------------- |
| `react-native-chart-kit`     | iOS + Android | Simple bar/line/pie charts    |
| `victory-native`             | iOS + Android | Advanced, customizable charts |
| `react-native-gifted-charts` | iOS + Android | Modern, animated charts       |

### Install (example)

```bash
npm install react-native-chart-kit react-native-svg
```

---

## 7. Error Handling

All APIs return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Technical details (development only)"
}
```

### Common HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 400  | Validation error      |
| 401  | Token missing/expired |
| 403  | Not SUPER_ADMIN       |
| 404  | Resource not found    |
| 500  | Server error          |

### Recommended Error Handler

```typescript
const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    if (status === 401) {
      // Token expired → redirect to login
    } else if (status === 403) {
      Alert.alert("Access Denied", "You need Super Admin permissions");
    } else {
      Alert.alert("Error", data.message || "Something went wrong");
    }
  } else {
    Alert.alert("Network Error", "Please check your internet connection");
  }
};
```
