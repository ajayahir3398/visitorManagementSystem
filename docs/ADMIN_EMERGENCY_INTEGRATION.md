# Society Admin: Raise Emergency Integration Guide

This guide describes how to implement the "Raise Emergency" feature for Society Admins in the React Native application.

---

## API Specification

- **Endpoint**: `POST /api/v1/emergencies`
- **Authorization**: `Bearer <access_token>`
- **Role Required**: `SOCIETY_ADMIN` (also works for `RESIDENT` and `SECURITY`)

### Request Body
```json
{
  "emergencyType": "FIRE",        // Options: FIRE, MEDICAL, SECURITY, SOS, OTHER
  "notificationType": "ALL",     // Options: ALL, SECURITY, RESIDENT (defaults to ALL)
  "description": "Fire detected in the clubhouse area",
  "location": "Clubhouse / Ground Floor",
  "unitId": null                 // Optional for Admin
}
```

---

## Service Layer (Axios)

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://your-api-domain.com/api/v1';

export const raiseSocietyEmergency = async (emergencyData) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await axios.post(`${API_URL}/emergencies`, 
      emergencyData, 
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to raise emergency');
    }
    throw new Error('Network error');
  }
};
```

---

## UI Implementation Best Practices

1.  **Immediate Feedback**: Provide a clear "Emergency Active" state once raised.
2.  **Notification Strategy**: While the API handles backend alerts, ensure the UI shows that an alert has been broadcast to all residents.
3.  **Confirmation**: Since admins can notify the *entire* society, consider a "Slide to Confirm" interaction to prevent accidental triggers.
4.  **Admin Context**: Admins often raise emergencies for common areas, so ensure the `location` field is descriptive.

---

## Typical Flow

1.  Admin opens the Emergency/Security tab.
2.  Selects "Broadcast Emergency".
3.  Chooses Type (e.g., "Medical").
4.  Inputs location (e.g., "Main Gate Area").
5.  Clicks "Raise Alert".
6.  System notifies all Security guards and Residents via push notifications/sirens.
