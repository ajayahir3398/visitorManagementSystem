# Society Admin Dashboard – React Native API Integration Guide

## Base URL

```
Production: https://visitormanagementsystem-10pj.onrender.com/api/v1
Development: http://localhost:1111/api/v1
```

## Authentication

All Society Admin APIs require a valid **SOCIETY_ADMIN JWT** token:

```
Authorization: Bearer <token>
```

---

## 1. API Service

### `src/services/societyAdminService.ts`

```typescript
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "YOUR_API_BASE_URL/api/v1";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Dashboard Metrics ──

export const getDashboardOverview = () => api.get("/admin/dashboard/overview");

export const getMaintenanceSummary = () =>
  api.get("/admin/dashboard/maintenance");

export const getVisitorSummary = () => api.get("/admin/dashboard/visitors");

export const getEmergencySummary = () =>
  api.get("/admin/dashboard/emergencies");

export const getNoticeSummary = () => api.get("/admin/dashboard/notices");

export const getRecentActivity = () => api.get("/admin/dashboard/activity");

// ── Charts ──

export const getMaintenanceCollectionChart = () =>
  api.get("/admin/charts/maintenance-collection");

export const getVisitorTrendChart = () =>
  api.get("/admin/charts/visitor-trend");

export const getEmergencyTypesChart = () =>
  api.get("/admin/charts/emergency-types");

export const getMaintenanceStatusChart = () =>
  api.get("/admin/charts/maintenance-status");
```

---

## 2. TypeScript Interfaces

### `src/types/societyAdmin.ts`

```typescript
export interface DashboardOverview {
  totalUnits: number;
  totalResidents: number;
  activeSecurity: number;
  openEmergencies: number;
  pendingViolations: number;
}

export interface MaintenanceSummary {
  upcomingBills: number;
  unpaidBills: number;
  overdueBills: number;
  collectedThisMonth: number;
  overdueAmount: number;
}

export interface VisitorSummary {
  todayVisitors: number;
  pendingApprovals: number;
  insidePremises: number;
  preApprovedToday: number;
}

export interface EmergencySummary {
  openEmergencies: number;
  resolvedThisMonth: number;
  avgResponseMinutes: number;
}

export interface NoticeSummary {
  activeNotices: number;
  totalReads: number;
  recentNotice: {
    title: string;
    createdAt: string;
    noticeType: string;
  } | null;
  activeRules: number;
}

export interface ActivityItem {
  id: number;
  action: string;
  entity: string;
  description: string;
  createdAt: string;
  user: { id: number; name: string };
}

// ── Charts ──

export interface CollectionChartItem {
  month: string;
  month_num: number;
  total: number;
}

export interface VisitorTrendItem {
  day: string;
  date: string;
  count: number;
}

export interface EmergencyTypeItem {
  type: string;
  count: number;
}

export interface BillStatusItem {
  status: string;
  count: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
```

---

## 3. Screen Example

### `src/screens/SocietyAdminDashboard.tsx`

```tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import {
  getDashboardOverview,
  getMaintenanceSummary,
  getVisitorSummary,
  getEmergencySummary,
} from "../services/societyAdminService";
import type {
  DashboardOverview,
  MaintenanceSummary,
  VisitorSummary,
  EmergencySummary,
} from "../types/societyAdmin";

const SocietyAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceSummary | null>(
    null,
  );
  const [visitors, setVisitors] = useState<VisitorSummary | null>(null);
  const [emergencies, setEmergencies] = useState<EmergencySummary | null>(null);

  const loadData = async () => {
    try {
      const [ovRes, mtRes, vsRes, emRes] = await Promise.all([
        getDashboardOverview(),
        getMaintenanceSummary(),
        getVisitorSummary(),
        getEmergencySummary(),
      ]);
      setOverview(ovRes.data.data);
      setMaintenance(mtRes.data.data);
      setVisitors(vsRes.data.data);
      setEmergencies(emRes.data.data);
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
        />
      }
    >
      {/* ── KPI Row ── */}
      <View style={styles.row}>
        <KPI label="Units" value={overview?.totalUnits} />
        <KPI label="Residents" value={overview?.totalResidents} />
        <KPI label="Security" value={overview?.activeSecurity} />
      </View>

      {/* ── Urgent Alert ── */}
      {(overview?.openEmergencies ?? 0) > 0 && (
        <View style={styles.alert}>
          <Text style={styles.alertText}>
            🚨 {overview?.openEmergencies} Open Emergency
          </Text>
        </View>
      )}

      {/* ── Maintenance ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💰 Maintenance</Text>
        <Text>
          Unpaid: {maintenance?.unpaidBills} | Overdue:{" "}
          {maintenance?.overdueBills}
        </Text>
        <Text>
          Collected: ₹{maintenance?.collectedThisMonth?.toLocaleString()}
        </Text>
        <Text>
          Overdue Amt: ₹{maintenance?.overdueAmount?.toLocaleString()}
        </Text>
      </View>

      {/* ── Visitors ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏠 Visitors Today</Text>
        <Text>
          Total: {visitors?.todayVisitors} | Inside: {visitors?.insidePremises}
        </Text>
        <Text>
          Pending: {visitors?.pendingApprovals} | Pre-approved:{" "}
          {visitors?.preApprovedToday}
        </Text>
      </View>
    </ScrollView>
  );
};

const KPI = ({ label, value }: { label: string; value?: number }) => (
  <View style={styles.kpi}>
    <Text style={styles.kpiValue}>{value ?? 0}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA", padding: 16 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  kpi: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
  },
  kpiValue: { fontSize: 28, fontWeight: "bold", color: "#2563EB" },
  kpiLabel: { fontSize: 12, color: "#666", marginTop: 4 },
  alert: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  alertText: { color: "#DC2626", fontWeight: "600", fontSize: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
});

export default SocietyAdminDashboard;
```

---

## 4. Complete API Reference

### Dashboard Metrics (`/api/v1/admin/dashboard/`)

| Method | Endpoint       | Description                                                      |
| ------ | -------------- | ---------------------------------------------------------------- |
| GET    | `/overview`    | KPI cards (units, residents, security, emergencies, violations)  |
| GET    | `/maintenance` | Financial (upcoming, unpaid, overdue, collected, overdue amount) |
| GET    | `/visitors`    | Activity (today, pending, inside, pre-approved)                  |
| GET    | `/emergencies` | Safety (open, resolved, avg response time)                       |
| GET    | `/notices`     | Communication (active, reads, recent, rules count)               |
| GET    | `/activity`    | Last 10 audit log entries                                        |

### Charts (`/api/v1/admin/charts/`)

| Method | Endpoint                  | Chart Type      |
| ------ | ------------------------- | --------------- |
| GET    | `/maintenance-collection` | Line (6 months) |
| GET    | `/visitor-trend`          | Bar (7 days)    |
| GET    | `/emergency-types`        | Pie             |
| GET    | `/maintenance-status`     | Donut           |

---

## 5. Error Handling

```typescript
const handleApiError = (error: any) => {
  if (error.response) {
    const { status, data } = error.response;
    if (status === 401) {
      // Token expired → redirect to login
    } else if (status === 403) {
      Alert.alert("Access Denied", "Society Admin access required");
    } else {
      Alert.alert("Error", data.message || "Something went wrong");
    }
  } else {
    Alert.alert("Network Error", "Check your internet connection");
  }
};
```
