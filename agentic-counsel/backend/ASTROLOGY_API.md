# Astrology API Endpoints

This document describes the REST API endpoints for Swiss Ephemeris astrological calculations and natal chart management.

## Base URL
```
http://localhost:3001/api/astrology
```

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Natal Chart
**POST** `/natal-chart`

Creates a new natal chart with complete astrological calculations.

#### Request Body
```json
{
  "birth_date": "1990-01-15",
  "birth_time": "14:30",
  "birth_location": "New York, NY, USA",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timezone": "America/New_York",
  "house_system": "Placidus"
}
```

#### Request Fields
- `birth_date` (required): Birth date in ISO format (YYYY-MM-DD)
- `birth_time` (optional): Birth time in HH:MM format (24-hour)
- `birth_location` (required): Birth location description (1-100 characters)
- `latitude` (required): Latitude in decimal degrees (-90 to 90)
- `longitude` (required): Longitude in decimal degrees (-180 to 180)
- `timezone` (optional): Timezone identifier
- `house_system` (optional): House system - one of: "Placidus", "Koch", "Equal", "Whole Sign", "Campanus" (default: "Placidus")

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "chart_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "user-uuid",
    "birth_data": {
      "birth_date": "1990-01-15",
      "birth_time": "14:30",
      "birth_location": "New York, NY, USA",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "planetary_positions": [
      {
        "celestial_body": "Sun",
        "longitude": 294.5678,
        "latitude": 0.0,
        "house_number": 5,
        "zodiac_sign": "Capricorn",
        "degree_in_sign": 24.5678,
        "retrograde": false
      }
    ],
    "house_cusps": [
      {
        "house_number": 1,
        "cusp_longitude": 120.0,
        "zodiac_sign": "Leo",
        "degree_in_sign": 0.0
      }
    ],
    "aspects": [
      {
        "body1": "Sun",
        "body2": "Moon",
        "aspect_type": "trine",
        "orb": 2.5,
        "exact_angle": 120.0,
        "applying": true
      }
    ],
    "house_system": "Placidus",
    "created_at": "2025-06-17T05:30:00.000Z"
  },
  "message": "Natal chart created successfully",
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### 2. Get User's Natal Chart
**GET** `/natal-chart/:userId`

Retrieves the natal chart data for a specific user.

#### Path Parameters
- `userId`: UUID of the user (must match authenticated user)

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "chart_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": "user-uuid",
    "birth_data": { /* birth data */ },
    "planetary_positions": [ /* array of planetary positions */ ],
    "house_cusps": [ /* array of house cusps */ ],
    "aspects": [ /* array of aspects */ ],
    "house_system": "Placidus",
    "created_at": "2025-06-17T05:30:00.000Z"
  },
  "message": "Natal chart retrieved successfully",
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### 3. Update Natal Chart
**PUT** `/natal-chart/:chartId`

Updates an existing natal chart. Recalculates all astrological data if birth information changes.

#### Path Parameters
- `chartId`: UUID of the natal chart

#### Request Body (all fields optional)
```json
{
  "birth_date": "1990-01-16",
  "birth_time": "15:00",
  "birth_location": "Los Angeles, CA, USA",
  "latitude": 34.0522,
  "longitude": -118.2437,
  "house_system": "Koch"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "chart_id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "message": "Natal chart updated successfully",
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### 4. Delete Natal Chart
**DELETE** `/natal-chart/:chartId`

Deletes a natal chart and all associated data.

#### Path Parameters
- `chartId`: UUID of the natal chart

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "chart_id": "123e4567-e89b-12d3-a456-426614174000"
  },
  "message": "Natal chart deleted successfully",
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### 5. Get Planetary Positions
**GET** `/planetary-positions/:chartId`

Retrieves planetary positions for a specific natal chart.

#### Path Parameters
- `chartId`: UUID of the natal chart

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "celestial_body": "Sun",
      "longitude": 294.5678,
      "latitude": 0.0,
      "house_number": 5,
      "zodiac_sign": "Capricorn",
      "degree_in_sign": 24.5678,
      "retrograde": false
    },
    {
      "celestial_body": "Moon",
      "longitude": 45.1234,
      "latitude": 2.5,
      "house_number": 9,
      "zodiac_sign": "Taurus",
      "degree_in_sign": 15.1234,
      "retrograde": false
    }
  ],
  "message": "Planetary positions retrieved successfully",
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### 6. Get House Cusps
**GET** `/house-cusps/:chartId`

Retrieves house cusps for a specific natal chart.

#### Path Parameters
- `chartId`: UUID of the natal chart

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "house_number": 1,
      "cusp_longitude": 120.0,
      "zodiac_sign": "Leo",
      "degree_in_sign": 0.0
    },
    {
      "house_number": 2,
      "cusp_longitude": 150.0,
      "zodiac_sign": "Virgo",
      "degree_in_sign": 0.0
    }
  ],
  "message": "House cusps retrieved successfully",
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### 7. Get Aspects
**GET** `/aspects/:chartId`

Retrieves aspects for a specific natal chart with optional filtering.

#### Path Parameters
- `chartId`: UUID of the natal chart

#### Query Parameters (optional)
- `aspect_type`: Filter by aspect type (conjunction, opposition, square, trine, sextile, etc.)
- `max_orb`: Maximum orb in degrees (e.g., 5.0)
- `applying_only`: Set to "true" to only return applying aspects

#### Example Request
```
GET /aspects/123e4567-e89b-12d3-a456-426614174000?aspect_type=trine&max_orb=5&applying_only=true
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "body1": "Sun",
      "body2": "Moon",
      "aspect_type": "trine",
      "orb": 2.5,
      "exact_angle": 120.0,
      "applying": true
    },
    {
      "body1": "Venus",
      "body2": "Jupiter",
      "aspect_type": "conjunction",
      "orb": 1.2,
      "exact_angle": 0.0,
      "applying": false
    }
  ],
  "message": "Aspects retrieved successfully",
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

## Error Responses

### Validation Error (400 Bad Request)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "latitude",
        "message": "Latitude must be between -90 and 90 degrees"
      }
    ]
  },
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "User not authenticated"
  },
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### Access Denied (403)
```json
{
  "success": false,
  "error": {
    "code": "ACCESS_DENIED",
    "message": "Access denied. You can only access your own natal charts"
  },
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "CHART_NOT_FOUND",
    "message": "Natal chart not found"
  },
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

### Calculation Error (500)
```json
{
  "success": false,
  "error": {
    "code": "CALCULATION_ERROR",
    "message": "Failed to calculate natal chart: Invalid birth data"
  },
  "timestamp": "2025-06-17T05:30:00.000Z"
}
```

## Data Types

### Celestial Bodies
- Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn
- Uranus, Neptune, Pluto, Ascendant, Midheaven
- North Node, South Node, Lilith

### Zodiac Signs
- Aries, Taurus, Gemini, Cancer, Leo, Virgo
- Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces

### House Systems
- Placidus (default)
- Koch
- Equal
- Whole Sign
- Campanus

### Aspect Types
- conjunction (0°)
- opposition (180°)
- square (90°)
- trine (120°)
- sextile (60°)
- quincunx (150°)
- semisquare (45°)
- sesquiquadrate (135°)

## Rate Limiting
All endpoints are subject to rate limiting:
- 100 requests per 15-minute window per IP address
- Rate limit headers are included in responses

## Security Features
- JWT authentication required for all endpoints
- Users can only access their own natal chart data
- Input validation and sanitization
- SQL injection protection
- CORS protection
- Request logging and monitoring

## Performance Considerations
- Database indexes optimize query performance
- Planetary calculations are cached when possible
- Large result sets are paginated where appropriate
- Response times typically under 500ms for chart calculations