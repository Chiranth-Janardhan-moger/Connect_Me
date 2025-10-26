
# API Documentation

This document provides detailed information about the REST API endpoints and WebSocket events for the College Bus Tracking System.

**Base URL**: `http://localhost:4000`

## Authentication

Most endpoints are protected and require a JSON Web Token (JWT) for authorization. To get a token, you must first authenticate using the `/api/auth/login` endpoint.

Include the token in the `Authorization` header for all protected requests:

`Authorization: Bearer <your_jwt_token>`

---

## 1. Auth API

### `POST /api/auth/login`

Authenticates a user (student, driver, or admin) and returns a JWT.

**Request Body:**

```json
{
    "email": "driver@college.edu",
    "password": "password123"
}
```

**Success Response (200 OK):**

```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "_id": "656e12a4b3f8e5c3e8f8f8f8",
        "name": "John Doe (Driver)",
        "role": "driver",
        "busId": "656e12a4b3f8e5c3e8f8f8f6"
    }
}
```

**Error Responses:**
- `400 Bad Request`: If email or password is not provided.
- `401 Unauthorized`: If credentials are invalid.
- `404 Not Found`: If the user with the given email does not exist.
- `500 Internal Server Error`: For server-side errors.

---

## 2. Driver API

**Note**: All endpoints require `Driver` role authentication.

### `POST /api/driver/start-trip`

Starts a trip for the driver's assigned bus. This changes the bus status to `ON_ROUTE` and allows the driver to start sending location updates via WebSocket.

**Headers:**
- `Authorization: Bearer <driver_token>`

**Success Response (200 OK):**

```json
{
    "message": "Trip started successfully.",
    "tripStatus": "ON_ROUTE"
}
```

**Error Responses:**
- `400 Bad Request`: If the trip is already in progress.
- `401 Unauthorized`: If the token is missing or invalid.
- `403 Forbidden`: If a non-driver user attempts to access this route.
- `404 Not Found`: If no bus is assigned to the authenticated driver.

### `POST /api/driver/end-trip`

Manually ends a trip for the driver's assigned bus. This changes the bus status to `REACHED` and clears its current location data.

**Headers:**
- `Authorization: Bearer <driver_token>`

**Success Response (200 OK):**

```json
{
    "message": "Trip ended successfully.",
    "tripStatus": "REACHED"
}
```

**Error Responses:**
- `400 Bad Request`: If there is no trip in progress to end.
- `401 Unauthorized`: If the token is missing or invalid.
- `403 Forbidden`: If a non-driver user attempts to access this route.
- `404 Not Found`: If no bus is assigned to the authenticated driver.

---

## 3. Student API

**Note**: All endpoints require `Student` role authentication.

### `GET /api/student/live-location`

Fetches the most recent known location of the student's assigned bus.

**Headers:**
- `Authorization: Bearer <student_token>`

**Success Response (200 OK):**

```json
{
    "busId": "656e12a4b3f8e5c3e8f8f8f6",
    "status": "ON_ROUTE",
    "location": {
        "latitude": 12.9759,
        "longitude": 77.6018,
        "lastUpdated": "2023-12-04T18:30:00.000Z"
    }
}
```

**Error Responses:**
- `400 Bad Request`: If the user is not assigned to any bus.
- `401 Unauthorized`: If the token is missing or invalid.
- `403 Forbidden`: If a non-student user attempts to access this route.
- `404 Not Found`: If the bus is not found, or if the bus has not started its trip and has no location data yet.

---

## 4. Admin API

**Note**: All endpoints require `Admin` role authentication.

### `POST /api/admin/add-route`

Creates a new bus route with a series of stops.

**Headers:**
- `Authorization: Bearer <admin_token>`

**Request Body:**

```json
{
    "name": "Uptown-Express",
    "stops": [
        { "lat": 12.9716, "lon": 77.5946, "label": "Campus Main Gate" },
        { "lat": 13.0356, "lon": 77.5970, "label": "North Hub" },
        { "lat": 13.0827, "lon": 77.5929, "label": "Uptown Terminus" }
    ]
}
```

**Success Response (201 Created):**

```json
{
    "message": "Route created successfully.",
    "route": {
        "name": "Uptown-Express",
        "stops": [
            { "lat": 12.9716, "lon": 77.5946, "label": "Campus Main Gate", "_id": "..." },
            { "lat": 13.0356, "lon": 77.5970, "label": "North Hub", "_id": "..." },
            { "lat": 13.0827, "lon": 77.5929, "label": "Uptown Terminus", "_id": "..." }
        ],
        "_id": "657abc...",
        "__v": 0
    }
}
```

**Error Responses:**
- `400 Bad Request`: If `name` or `stops` are missing/invalid.
- `401 Unauthorized`/`403 Forbidden`.
- `409 Conflict`: If a route with the same name already exists.

### `POST /api/admin/add-driver`

Creates a new driver user and simultaneously creates and assigns a new bus to them.

**Headers:**
- `Authorization: Bearer <admin_token>`

**Request Body:**

```json
{
    "name": "Alice Ray (Driver)",
    "email": "driver2@college.edu",
    "password": "newpassword123",
    "busNumber": "CB-102",
    "routeId": "657abc..."
}
```

**Success Response (201 Created):**

```json
{
    "message": "Driver and bus created successfully.",
    "driver": {
        "_id": "...",
        "name": "Alice Ray (Driver)",
        "email": "driver2@college.edu",
        "role": "driver",
        "busId": "..."
    },
    "bus": {
        "_id": "...",
        "busNumber": "CB-102",
        "routeId": "657abc...",
        "driverId": "...",
        "tripStatus": "NOT_STARTED",
        "locationHistory": [],
        "__v": 0
    }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields.
- `401 Unauthorized`/`403 Forbidden`.
- `404 Not Found`: If the specified `routeId` does not exist.
- `409 Conflict`: If the driver's email or the bus number is already in use.

### `POST /api/admin/add-student`

Creates a new student user and assigns them to an existing bus.

**Headers:**
- `Authorization: Bearer <admin_token>`

**Request Body:**

```json
{
    "name": "Bob Johnson (Student)",
    "email": "student2@college.edu",
    "password": "newpassword123",
    "busId": "..."
}
```

**Success Response (201 Created):**

```json
{
    "message": "Student created successfully.",
    "student": {
        "_id": "...",
        "name": "Bob Johnson (Student)",
        "email": "student2@college.edu",
        "role": "student",
        "busId": "..."
    }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields.
- `401 Unauthorized`/`403 Forbidden`.
- `404 Not Found`: If the specified `busId` does not exist.
- `409 Conflict`: If the student's email is already in use.

---

## 5. WebSocket Events

The WebSocket server handles real-time communication.

### Client-to-Server Events

#### `student:join`

A student client emits this event to join a room specific to their bus. This allows them to receive location updates for that bus only.

**Payload:**
```javascript
{
  busId: '656e12a4b3f8e5c3e8f8f8f6', // The ID of the student's bus
  studentId: '656e12a4b3f8e5c3e8f8f8fa' // The ID of the student
}
```

#### `driver:location-update`

A driver client emits this event frequently to broadcast their current GPS coordinates.

**Payload:**
```javascript
{
  busId: '656e12a4b3f8e5c3e8f8f8f6',
  latitude: 12.9759,
  longitude: 77.6018
}
```

### Server-to-Client Events

#### `student:location-update`

The server broadcasts this event to all students in a specific bus room when a driver sends a location update.

**Payload:**
```javascript
{
  latitude: 12.9759,
  longitude: 77.6018,
  timestamp: "2023-12-04T18:30:00.000Z"
}
```

#### `bus:reached`

The server broadcasts this event when it detects that a bus has reached its final destination. The trip status is updated to `REACHED`.

**Payload:**
```javascript
{
  busId: "656e12a4b3f8e5c3e8f8f8f6",
  status: "REACHED",
  message: "Bus has reached the destination: Downtown Final Stop."
}
```

#### `driver:trip-ended`

The server sends this event directly to a driver's socket if they send a location update for a trip that has already been marked as `REACHED`. This serves as a signal for the client app to stop sending updates.

**Payload:**
- None