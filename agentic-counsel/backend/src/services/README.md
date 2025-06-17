# Swiss Ephemeris Service

The Swiss Ephemeris Service provides precise astrological calculations for the Agentic Counsel platform. This service calculates natal charts, planetary positions, house cusps, and aspects using astronomical algorithms.

## Features

### Core Calculation Methods

- **`calculateNatalChart(birthData, userId, houseSystem)`** - Main method to calculate complete natal chart
- **`calculatePlanetaryPositions(julianDay, latitude, longitude)`** - Calculate all planetary positions
- **`calculateHouseCusps(julianDay, latitude, longitude, houseSystem)`** - Calculate house cusps
- **`calculateAspects(planetaryPositions)`** - Calculate aspects between celestial bodies
- **`convertToJulianDay(dateTime)`** - Convert birth datetime to Julian Day
- **`convertLongitudeToZodiacSign(longitude)`** - Convert degrees to zodiac sign and position

### Celestial Bodies Calculated

- **Planets**: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- **Points**: Ascendant, Midheaven, North Node, South Node, Lilith (Black Moon)

### House Systems Supported

- **Placidus** (default) - Most commonly used system
- **Koch** - Alternative quadrant system
- **Equal House** - 30-degree equal divisions
- **Whole Sign** - Each sign = one house
- **Campanus** - Spatial division system

### Aspect Types

#### Major Aspects
- **Conjunction** (0°) - Orb: 8°
- **Opposition** (180°) - Orb: 8°
- **Square** (90°) - Orb: 8°
- **Trine** (120°) - Orb: 8°
- **Sextile** (60°) - Orb: 6°

#### Minor Aspects
- **Quincunx** (150°) - Orb: 3°
- **Semi-square** (45°) - Orb: 3°
- **Sesquiquadrate** (135°) - Orb: 3°

## Usage

### Basic Usage

```typescript
import { SwissEphemerisService } from './services';
import { SwissBirthData } from './types';

const service = SwissEphemerisService.getInstance();

const birthData: SwissBirthData = {
  birth_date: '1990-06-15',
  birth_time: '14:30',
  birth_location: 'New York, NY, USA',
  latitude: 40.7128,
  longitude: -74.0060,
  timezone: 'America/New_York'
};

// Calculate complete natal chart
const natalChart = await service.calculateNatalChart(birthData, userId, 'Placidus');
```

### Individual Calculations

```typescript
// Convert to Julian Day
const julianDay = service.convertToJulianDay('1990-06-15', '14:30');

// Calculate planetary positions
const positions = await service.calculatePlanetaryPositions(
  julianDay, 
  40.7128, 
  -74.0060
);

// Calculate house cusps
const cusps = await service.calculateHouseCusps(
  julianDay,
  40.7128,
  -74.0060,
  'Placidus'
);

// Calculate aspects
const aspects = service.calculateAspects(positions);

// Convert longitude to zodiac sign
const { sign, degreeInSign } = service.convertLongitudeToZodiacSign(120.5);
```

## Data Structures

### Birth Data Input

```typescript
interface SwissBirthData {
  birth_date: string;      // ISO date string (required)
  birth_time?: string;     // HH:MM format (optional)
  birth_location: string;  // Location name (required)
  latitude: number;        // -90 to 90 (required)
  longitude: number;       // -180 to 180 (required)
  timezone?: string;       // IANA timezone (optional)
}
```

### Natal Chart Output

```typescript
interface NatalChartData {
  chart_id: string;
  user_id: string;
  birth_data: SwissBirthData;
  planetary_positions: PlanetaryPosition[];
  house_cusps: HouseCusp[];
  aspects: AspectData[];
  house_system: HouseSystem;
  created_at: Date;
}
```

### Planetary Position

```typescript
interface PlanetaryPosition {
  celestial_body: CelestialBody;
  longitude: number;        // 0-360 degrees
  latitude: number;         // -90 to 90 degrees
  house_number: number;     // 1-12
  zodiac_sign: ZodiacSign;
  degree_in_sign: number;   // 0-30 degrees
  retrograde: boolean;
}
```

### House Cusp

```typescript
interface HouseCusp {
  house_number: number;     // 1-12
  cusp_longitude: number;   // 0-360 degrees
  zodiac_sign: ZodiacSign;
  degree_in_sign: number;   // 0-30 degrees
}
```

### Aspect Data

```typescript
interface AspectData {
  body1: CelestialBody;
  body2: CelestialBody;
  aspect_type: AspectType;
  orb: number;              // degrees
  exact_angle: number;      // 0-360 degrees
  applying: boolean;        // true if applying, false if separating
}
```

## Error Handling

The service includes comprehensive error handling for:

- **Invalid birth dates/times** - Validates date format and time format
- **Invalid coordinates** - Ensures latitude (-90 to 90) and longitude (-180 to 180) are valid
- **Missing required data** - Validates all required birth data fields
- **Calculation errors** - Handles astronomical calculation failures
- **Database errors** - Manages data persistence issues

### Example Error Handling

```typescript
try {
  const natalChart = await service.calculateNatalChart(birthData, userId);
} catch (error) {
  if (error.message.includes('Invalid birth date')) {
    // Handle date validation error
  } else if (error.message.includes('Valid latitude is required')) {
    // Handle coordinate validation error
  } else {
    // Handle general calculation error
  }
}
```

## Database Integration

The service automatically stores calculated data in the database:

- **natal_charts** table - Birth data and chart metadata
- **planetary_positions** table - Individual planetary positions
- **house_cusps** table - House cusp positions
- **aspects** table - Aspect relationships

All data is linked via the `chart_id` for easy retrieval and analysis.

## Accuracy and Limitations

### Current Implementation

This implementation uses simplified astronomical calculations suitable for astrological purposes. The calculations provide:

- **Sun Sign**: Accurate to within 1 day
- **Planetary Positions**: Approximate positions suitable for astrological interpretation
- **House Cusps**: Simplified calculations for supported house systems
- **Aspects**: Accurate orb calculations with proper aspect detection

### Future Enhancements

For production use with maximum accuracy, consider:

- Integration with the actual Swiss Ephemeris C library
- More precise planetary position calculations
- Support for additional house systems
- Heliocentric and geocentric coordinate options
- Asteroid and fixed star calculations

## Testing

Run the test suite to verify service functionality:

```bash
# Run the test file
ts-node src/services/swissEphemerisService.test.ts
```

The test covers:
- Julian Day conversion
- Zodiac sign calculation
- Planetary position calculation
- House cusp calculation
- Aspect calculation

## Logging

The service includes comprehensive logging for:
- Calculation start/completion
- Error conditions
- Performance metrics
- Data validation issues

Logs are written to `logs/swiss-ephemeris.log` and console output.

## Performance Considerations

- **Singleton Pattern**: Service uses singleton pattern for efficient resource usage
- **Database Connection Pooling**: Leverages existing database service connection pool
- **Calculation Caching**: Consider implementing caching for frequently requested charts
- **Batch Processing**: Service supports batch calculations for multiple users

## Integration with Personality Service

The Swiss Ephemeris Service is designed to work seamlessly with the existing Personality Service:

```typescript
// Calculate natal chart
const natalChart = await swissEphemerisService.calculateNatalChart(birthData, userId);

// Use astrological data for personality analysis
const personalityProfile = await personalityService.generatePersonalityProfile({
  birth_date: birthData.birth_date,
  birth_time: birthData.birth_time,
  birth_location: birthData.birth_location
});
```

This integration provides the foundation for accurate, personalized astrological coaching insights.