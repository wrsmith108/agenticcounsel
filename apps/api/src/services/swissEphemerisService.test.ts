import { SwissEphemerisService } from './swissEphemerisService';
import { SwissBirthData } from '../types';

// Example usage and test of the Swiss Ephemeris Service
async function testSwissEphemerisService() {
  const service = SwissEphemerisService.getInstance();
  
  // Example birth data
  const birthData: SwissBirthData = {
    birth_date: '1990-06-15',
    birth_time: '14:30',
    birth_location: 'New York, NY, USA',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York'
  };

  try {
    console.log('Testing Swiss Ephemeris Service...');
    
    // Test Julian Day conversion
    const julianDay = service.convertToJulianDay(birthData.birth_date, birthData.birth_time);
    console.log('Julian Day:', julianDay);
    
    // Test zodiac sign conversion
    const zodiacTest = service.convertLongitudeToZodiacSign(120.5);
    console.log('Zodiac Sign for 120.5°:', zodiacTest);
    
    // Test planetary positions calculation
    const positions = await service.calculatePlanetaryPositions(
      julianDay, 
      birthData.latitude, 
      birthData.longitude
    );
    console.log('Planetary Positions:', positions.length, 'bodies calculated');
    
    // Test house cusps calculation
    const cusps = await service.calculateHouseCusps(
      julianDay,
      birthData.latitude,
      birthData.longitude,
      'Placidus'
    );
    console.log('House Cusps:', cusps.length, 'houses calculated');
    
    // Test aspects calculation
    const aspects = service.calculateAspects(positions);
    console.log('Aspects:', aspects.length, 'aspects found');
    
    console.log('Swiss Ephemeris Service test completed successfully!');
    
  } catch (error) {
    console.error('Error testing Swiss Ephemeris Service:', error);
  }
}

// Export for potential use in other test files
export { testSwissEphemerisService };

// Run test if this file is executed directly
if (require.main === module) {
  testSwissEphemerisService();
}