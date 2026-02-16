# Notification API Integration Guide (React Native)

This guide provides instructions on how to integrate the Notification API into your React Native application.

## Overview

The Notification API allows you to:
-   Fetch a list of notifications for the logged-in user.
-   Get the count of unread notifications.
-   Mark individual notifications as read.
-   Mark all notifications as read.

## Base URL

All endpoints are relative to your API base URL (e.g., `https://api.yoursocietyapp.com/api/v1`).

---

## 1. Get Notifications

Fetch a paginated list of notifications.

**Endpoint:** `GET /notifications`

**Query Parameters:**
-   `page` (optional): Page number (default: 1)
-   `limit` (optional): Items per page (default: 20)

**Response:**

```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "userId": 101,
        "title": "New Visitor",
        "body": "John Doe is at the gate.",
        "data": {
          "screen": "visitor_logs",
          "visitorLogId": "55"
        },
        "isRead": false,
        "type": "VISITOR",
        "createdAt": "2023-10-27T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    },
    "unreadCount": 5
  }
}
```

### React Native Implementation (Axios)

```javascript
import axios from 'axios';

// ... assuming you have an axios instance with auth header configured
// const api = axios.create({ baseURL: '...', headers: { Authorization: 'Bearer ...' } });

export const fetchNotifications = async (page = 1, limit = 20) => {
  try {
    const response = await api.get(`/notifications`, {
      params: { page, limit }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};
```

---

## 2. Get Unread Count

Get the number of unread notifications to display a badge.

**Endpoint:** `GET /notifications/unread-count`

**Response:**

```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### React Native Implementation

```javascript
export const getUnreadNotificationCount = async () => {
  try {
    const response = await api.get(`/notifications/unread-count`);
    return response.data.data.count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};
```

---

## 3. Mark as Read

Mark a single notification as read when the user taps on it.

**Endpoint:** `PUT /notifications/:id/read`

**Response:**

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

### React Native Implementation

```javascript
export const markNotificationAsRead = async (notificationId) => {
  try {
    await api.put(`/notifications/${notificationId}/read`);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};
```

---

## 4. Mark All as Read

Mark all notifications as read (e.g., "Mark all as read" button).

**Endpoint:** `PUT /notifications/read-all`

**Response:**

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### React Native Implementation

```javascript
export const markAllNotificationsAsRead = async () => {
  try {
    await api.put(`/notifications/read-all`);
    return true;
  } catch (error) {
    console.error('Error marking all as read:', error);
    return false;
  }
};
```

---

## UI Integration Tips

1.  **Polling vs Push:**
    -   Use **FCM (Push Notifications)** to trigger a refresh of the notification list or increment the badge count in real-time.
    -   When the app comes to the foreground, call `getUnreadNotificationCount` to ensure the badge is accurate.

2.  **Infinite Scroll:**
    -   Use `FlatList` with `onEndReached` to load more pages using the `page` parameter in `fetchNotifications`.

3.  **Optimistic Updates:**
    -   When a user clicks a notification, locally mark it as read (update state) immediately while sending the API request in the background.

## Example Component Structure

```javascript
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';
import { fetchNotifications, markNotificationAsRead } from './api';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await fetchNotifications(page);
      if (page === 1) {
        setNotifications(data.notifications);
      } else {
        setNotifications(prev => [...prev, ...data.notifications]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [page]);

  const handlePress = async (id) => {
      // Optimistic update
      setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, isRead: true } : n
      ));
      await markNotificationAsRead(id);
  };

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handlePress(item.id)}>
          <Text style={{ fontWeight: item.isRead ? 'normal' : 'bold' }}>
            {item.title}
          </Text>
          <Text>{item.body}</Text>
        </TouchableOpacity>
      )}
      onEndReached={() => setPage(p => p + 1)}
    />
  );
};
```
