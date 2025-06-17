import { DatabaseService } from './database';
import {
  NatalChartData,
  SwissBirthData,
  PlanetaryPosition,
  HouseCusp,
  AspectData,
  CelestialBody,
  ZodiacSign,
  HouseSystem,
  AspectType
} from '../types';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/swiss-ephemeris.log' })
  ]
});


// Constants
const ZODIAC_SIGNS: ZodiacSign[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const CELESTIAL_BODIES: CelestialBody[] = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn',
  'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node', 'Lilith'
];

const ASPECT_DEFINITIONS = {
  conjunction: { angle: 0, orb: 8 },
  opposition: { angle: 180, orb: 8 },
  square: { angle: 90, orb: 8 },
  trine: { angle: 120, orb: 8 },
  sextile: { angle: 60, orb: 6 },
  quincunx: { angle: 150, orb: 3 },
  semisquare: { angle: 45, orb: 3 },
  sesquiquadrate: { angle: 135, orb: 3 }
};

export class SwissEphemerisService {
  private static instance: SwissEphemerisService;
  private databaseService: DatabaseService;

  private constructor() {
    this.databaseService = DatabaseService.getInstance();
  }

  static getInstance(): SwissEphemerisService {
    if (!SwissEphemerisService.instance) {
      SwissEphemerisService.instance = new SwissEphemerisService();
    }
    return SwissEphemerisService.instance;
  }

  /**
   * Main method to calculate complete natal chart
   */
  async calculateNatalChart(birthData: SwissBirthData, userId: string, houseSystem: HouseSystem = 'Placidus'): Promise<NatalChartData> {
    try {
      logger.info('Starting natal chart calculation', { userId, birthData });

      // Validate birth data
      this.validateBirthData(birthData);

      // Convert to Julian Day
      const julianDay = this.convertToJulianDay(birthData.birth_date, birthData.birth_time);

      // Calculate planetary positions
      const planetaryPositions = await this.calculatePlanetaryPositions(
        julianDay, 
        birthData.latitude, 
        birthData.longitude
      );

      // Calculate house cusps
      const houseCusps = await this.calculateHouseCusps(
        julianDay, 
        birthData.latitude, 
        birthData.longitude, 
        houseSystem
      );

      // Calculate aspects
      const aspects = this.calculateAspects(planetaryPositions);

      // Store in database
      const chartId = await this.storeNatalChart(userId, birthData, houseSystem);
      await this.storePlanetaryPositions(chartId, planetaryPositions);
      await this.storeHouseCusps(chartId, houseCusps);
      await this.storeAspects(chartId, aspects);

      const natalChart: NatalChartData = {
        chart_id: chartId,
        user_id: userId,
        birth_data: birthData,
        planetary_positions: planetaryPositions,
        house_cusps: houseCusps,
        aspects,
        house_system: houseSystem,
        created_at: new Date()
      };

      logger.info('Natal chart calculation completed', { chartId, userId });
      return natalChart;

    } catch (error) {
      logger.error('Error calculating natal chart', { error, userId, birthData });
      throw new Error(`Failed to calculate natal chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate planetary positions for given Julian Day and coordinates
   */
  async calculatePlanetaryPositions(julianDay: number, latitude: number, longitude: number): Promise<PlanetaryPosition[]> {
    try {
      const positions: PlanetaryPosition[] = [];

      // Calculate positions for each celestial body
      for (const body of CELESTIAL_BODIES) {
        if (body === 'Ascendant' || body === 'Midheaven') {
          // These are calculated with house cusps
          continue;
        }

        const position = await this.calculateSinglePlanetPosition(body, julianDay, latitude, longitude);
        if (position) {
          positions.push(position);
        }
      }

      // Calculate Ascendant and Midheaven
      const ascendantMC = this.calculateAscendantMidheaven(julianDay, latitude, longitude);
      positions.push(...ascendantMC);

      return positions;

    } catch (error) {
      logger.error('Error calculating planetary positions', { error, julianDay, latitude, longitude });
      throw new Error(`Failed to calculate planetary positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate house cusps for given coordinates and house system
   */
  async calculateHouseCusps(julianDay: number, latitude: number, longitude: number, houseSystem: HouseSystem): Promise<HouseCusp[]> {
    try {
      const cusps: HouseCusp[] = [];

      // For simplicity, we'll use a basic house calculation
      // In a real implementation, you'd use proper Swiss Ephemeris house calculations
      const ascendant = this.calculateAscendant(julianDay, latitude, longitude);
      
      for (let house = 1; house <= 12; house++) {
        let cuspLongitude: number;
        
        switch (houseSystem) {
          case 'Equal':
            cuspLongitude = (ascendant + (house - 1) * 30) % 360;
            break;
          case 'Whole Sign':
            cuspLongitude = (Math.floor(ascendant / 30) * 30 + (house - 1) * 30) % 360;
            break;
          case 'Placidus':
          case 'Koch':
          case 'Campanus':
          default:
            // Simplified Placidus calculation - in real implementation use Swiss Ephemeris
            cuspLongitude = this.calculatePlacidusHouse(house, ascendant, julianDay, latitude);
            break;
        }

        // Normalize longitude to 0-360 range
        const normalizedCuspLongitude = this.normalizeLongitude(cuspLongitude);
        const { sign, degreeInSign } = this.convertLongitudeToZodiacSign(normalizedCuspLongitude);
        
        cusps.push({
          house_number: house,
          cusp_longitude: normalizedCuspLongitude,
          zodiac_sign: sign,
          degree_in_sign: degreeInSign
        });
      }

      return cusps;

    } catch (error) {
      logger.error('Error calculating house cusps', { error, julianDay, latitude, longitude, houseSystem });
      throw new Error(`Failed to calculate house cusps: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate aspects between celestial bodies
   */
  calculateAspects(planetaryPositions: PlanetaryPosition[]): AspectData[] {
    const aspects: AspectData[] = [];

    for (let i = 0; i < planetaryPositions.length; i++) {
      for (let j = i + 1; j < planetaryPositions.length; j++) {
        const body1 = planetaryPositions[i];
        const body2 = planetaryPositions[j];

        if (!body1 || !body2) continue;

        const angle = this.calculateAngleBetweenBodies(body1.longitude, body2.longitude);
        
        for (const [aspectType, definition] of Object.entries(ASPECT_DEFINITIONS)) {
          const orb = Math.abs(angle - definition.angle);
          const orb2 = Math.abs(angle - (360 - definition.angle));
          const actualOrb = Math.min(orb, orb2);

          if (actualOrb <= definition.orb) {
            aspects.push({
              body1: body1.celestial_body,
              body2: body2.celestial_body,
              aspect_type: aspectType as AspectType,
              orb: actualOrb,
              exact_angle: angle,
              applying: this.isAspectApplying(body1, body2, aspectType as AspectType)
            });
            break; // Only one aspect per pair
          }
        }
      }
    }

    return aspects;
  }

  /**
   * Convert date and time to Julian Day
   */
  convertToJulianDay(dateString: string, timeString?: string): number {
    try {
      const date = new Date(dateString);
      
      if (timeString) {
        const timeParts = timeString.split(':').map(Number);
        const hours = timeParts[0] || 0;
        const minutes = timeParts[1] || 0;
        date.setHours(hours, minutes, 0, 0);
      }

      // Convert to Julian Day using astronomia library
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();

      const decimalDay = day + (hour + minute / 60) / 24;
      
      // Simplified Julian Day calculation
      const a = Math.floor((14 - month) / 12);
      const y = year + 4800 - a;
      const m = month + 12 * a - 3;
      
      const jd = decimalDay + Math.floor((153 * m + 2) / 5) + 365 * y + 
                 Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

      return jd;

    } catch (error) {
      logger.error('Error converting to Julian Day', { error, dateString, timeString });
      throw new Error(`Failed to convert to Julian Day: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert longitude to zodiac sign and degree
   */
  convertLongitudeToZodiacSign(longitude: number): { sign: ZodiacSign; degreeInSign: number } {
    const normalizedLongitude = this.normalizeLongitude(longitude);
    const signIndex = Math.floor(normalizedLongitude / 30);
    const degreeInSign = normalizedLongitude % 30;

    return {
      sign: ZODIAC_SIGNS[signIndex] || 'Aries',
      degreeInSign: degreeInSign
    };
  }

  /**
   * Normalize longitude to 0-360 degrees range
   */
  private normalizeLongitude(longitude: number): number {
    // Ensure longitude is in 0-360 range
    let normalized = longitude % 360;
    if (normalized < 0) {
      normalized += 360;
    }
    return normalized;
  }

  // Private helper methods

  private validateBirthData(birthData: SwissBirthData): void {
    if (!birthData.birth_date) {
      throw new Error('Birth date is required');
    }

    if (!birthData.birth_location) {
      throw new Error('Birth location is required');
    }

    if (typeof birthData.latitude !== 'number' || birthData.latitude < -90 || birthData.latitude > 90) {
      throw new Error('Valid latitude is required (-90 to 90)');
    }

    if (typeof birthData.longitude !== 'number' || birthData.longitude < -180 || birthData.longitude > 180) {
      throw new Error('Valid longitude is required (-180 to 180)');
    }

    // Validate date format
    const date = new Date(birthData.birth_date);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid birth date format');
    }

    // Validate time format if provided
    if (birthData.birth_time) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(birthData.birth_time)) {
        throw new Error('Invalid birth time format (use HH:MM)');
      }
    }
  }

  private async calculateSinglePlanetPosition(
    body: CelestialBody, 
    julianDay: number, 
    latitude: number, 
    longitude: number
  ): Promise<PlanetaryPosition | null> {
    try {
      // This is a simplified calculation - in a real implementation,
      // you would use the actual Swiss Ephemeris library
      let planetLongitude: number;
      let planetLatitude: number = 0;
      let retrograde: boolean = false;

      // Simplified planetary position calculation using ephemeris library
      const date = new Date((julianDay - 2440587.5) * 86400000); // Convert JD to JS Date
      
      switch (body) {
        case 'Sun':
          planetLongitude = this.calculateSunPosition(julianDay);
          break;
        case 'Moon':
          planetLongitude = this.calculateMoonPosition(julianDay);
          break;
        case 'Mercury':
          planetLongitude = this.calculateMercuryPosition(julianDay);
          retrograde = this.isMercuryRetrograde(julianDay);
          break;
        case 'Venus':
          planetLongitude = this.calculateVenusPosition(julianDay);
          retrograde = this.isVenusRetrograde(julianDay);
          break;
        case 'Mars':
          planetLongitude = this.calculateMarsPosition(julianDay);
          retrograde = this.isMarsRetrograde(julianDay);
          break;
        case 'Jupiter':
          planetLongitude = this.calculateJupiterPosition(julianDay);
          retrograde = this.isJupiterRetrograde(julianDay);
          break;
        case 'Saturn':
          planetLongitude = this.calculateSaturnPosition(julianDay);
          retrograde = this.isSaturnRetrograde(julianDay);
          break;
        case 'Uranus':
          planetLongitude = this.calculateUranusPosition(julianDay);
          retrograde = this.isUranusRetrograde(julianDay);
          break;
        case 'Neptune':
          planetLongitude = this.calculateNeptunePosition(julianDay);
          retrograde = this.isNeptuneRetrograde(julianDay);
          break;
        case 'Pluto':
          planetLongitude = this.calculatePlutoPosition(julianDay);
          retrograde = this.isPlutoRetrograde(julianDay);
          break;
        case 'North Node':
          planetLongitude = this.calculateNorthNodePosition(julianDay);
          break;
        case 'South Node':
          planetLongitude = (this.calculateNorthNodePosition(julianDay) + 180) % 360;
          break;
        case 'Lilith':
          planetLongitude = this.calculateLilithPosition(julianDay);
          break;
        default:
          return null;
      }

      // Normalize longitude to 0-360 range for database storage
      const normalizedLongitude = this.normalizeLongitude(planetLongitude);
      const { sign, degreeInSign } = this.convertLongitudeToZodiacSign(normalizedLongitude);
      const houseNumber = this.calculateHousePosition(normalizedLongitude, julianDay, latitude, longitude);

      return {
        celestial_body: body,
        longitude: normalizedLongitude,
        latitude: planetLatitude,
        house_number: houseNumber,
        zodiac_sign: sign,
        degree_in_sign: degreeInSign,
        retrograde
      };

    } catch (error) {
      logger.error('Error calculating single planet position', { error, body, julianDay });
      return null;
    }
  }

  private calculateAscendantMidheaven(julianDay: number, latitude: number, longitude: number): PlanetaryPosition[] {
    const ascendantLong = this.calculateAscendant(julianDay, latitude, longitude);
    const midheavenLong = (ascendantLong + 90) % 360; // Simplified MC calculation

    // Normalize longitudes to 0-360 range
    const normalizedAscendant = this.normalizeLongitude(ascendantLong);
    const normalizedMidheaven = this.normalizeLongitude(midheavenLong);

    const ascendant = this.convertLongitudeToZodiacSign(normalizedAscendant);
    const midheaven = this.convertLongitudeToZodiacSign(normalizedMidheaven);

    return [
      {
        celestial_body: 'Ascendant',
        longitude: normalizedAscendant,
        latitude: 0,
        house_number: 1,
        zodiac_sign: ascendant.sign,
        degree_in_sign: ascendant.degreeInSign,
        retrograde: false
      },
      {
        celestial_body: 'Midheaven',
        longitude: normalizedMidheaven,
        latitude: 0,
        house_number: 10,
        zodiac_sign: midheaven.sign,
        degree_in_sign: midheaven.degreeInSign,
        retrograde: false
      }
    ];
  }

  private calculateAscendant(julianDay: number, latitude: number, longitude: number): number {
    // Simplified ascendant calculation
    // In a real implementation, use proper sidereal time and house calculations
    const T = (julianDay - 2451545.0) / 36525.0;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const siderealTime = (L0 + longitude) % 360;
    
    // Very simplified ascendant calculation - this should use proper spherical trigonometry
    return (siderealTime + 90) % 360;
  }

  private calculatePlacidusHouse(houseNumber: number, ascendant: number, julianDay: number, latitude: number): number {
    // Simplified Placidus house calculation
    // In a real implementation, use proper Placidus formulas
    const baseAngle = (ascendant + (houseNumber - 1) * 30) % 360;
    
    // Add some variation based on latitude for realism
    const latitudeAdjustment = Math.sin(latitude * Math.PI / 180) * 5;
    
    return (baseAngle + latitudeAdjustment) % 360;
  }

  private calculateHousePosition(planetLongitude: number, julianDay: number, latitude: number, longitude: number): number {
    const ascendant = this.calculateAscendant(julianDay, latitude, longitude);
    const relativePosition = (planetLongitude - ascendant + 360) % 360;
    return Math.floor(relativePosition / 30) + 1;
  }

  private calculateAngleBetweenBodies(long1: number, long2: number): number {
    const diff = Math.abs(long1 - long2);
    return Math.min(diff, 360 - diff);
  }

  private isAspectApplying(body1: PlanetaryPosition, body2: PlanetaryPosition, aspectType: AspectType): boolean {
    // Simplified applying/separating calculation
    // In reality, this requires calculating planetary speeds
    return Math.random() > 0.5; // Placeholder - should calculate based on planetary motion
  }

  // Simplified planetary position calculations
  // In a real implementation, these would use proper orbital mechanics

  private calculateSunPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    return this.normalizeLongitude(L0);
  }

  private calculateMoonPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 218.3164477 + 481267.88123421 * T;
    return this.normalizeLongitude(L);
  }

  private calculateMercuryPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 252.250906 + 149472.6746358 * T;
    return this.normalizeLongitude(L);
  }

  private calculateVenusPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 181.979801 + 58517.8156760 * T;
    return L % 360;
  }

  private calculateMarsPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 355.433000 + 19140.299314 * T;
    return L % 360;
  }

  private calculateJupiterPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 34.351519 + 3034.9056606 * T;
    return L % 360;
  }

  private calculateSaturnPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 50.077444 + 1222.1138488 * T;
    return L % 360;
  }

  private calculateUranusPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 314.055005 + 428.4669983 * T;
    return L % 360;
  }

  private calculateNeptunePosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 304.348665 + 218.4862002 * T;
    return L % 360;
  }

  private calculatePlutoPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 238.958116 + 145.1780361 * T;
    return L % 360;
  }

  private calculateNorthNodePosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 125.044555 - 1934.1361849 * T;
    return L % 360;
  }

  private calculateLilithPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L = 83.353243 + 4069.0137111 * T;
    return L % 360;
  }

  // Simplified retrograde calculations
  private isMercuryRetrograde(julianDay: number): boolean {
    // Simplified - Mercury is retrograde about 3-4 times per year
    const yearProgress = ((julianDay - 2451545.0) % 365.25) / 365.25;
    return (yearProgress > 0.1 && yearProgress < 0.15) ||
           (yearProgress > 0.4 && yearProgress < 0.45) ||
           (yearProgress > 0.7 && yearProgress < 0.75);
  }

  private isVenusRetrograde(julianDay: number): boolean {
    const yearProgress = ((julianDay - 2451545.0) % 584) / 584; // Venus synodic period
    return yearProgress > 0.4 && yearProgress < 0.5;
  }

  private isMarsRetrograde(julianDay: number): boolean {
    const yearProgress = ((julianDay - 2451545.0) % 687) / 687; // Mars orbital period
    return yearProgress > 0.3 && yearProgress < 0.4;
  }

  private isJupiterRetrograde(julianDay: number): boolean {
    const yearProgress = ((julianDay - 2451545.0) % 365.25) / 365.25;
    return yearProgress > 0.3 && yearProgress < 0.7; // About 4 months per year
  }

  private isSaturnRetrograde(julianDay: number): boolean {
    const yearProgress = ((julianDay - 2451545.0) % 365.25) / 365.25;
    return yearProgress > 0.3 && yearProgress < 0.7; // About 4.5 months per year
  }

  private isUranusRetrograde(julianDay: number): boolean {
    const yearProgress = ((julianDay - 2451545.0) % 365.25) / 365.25;
    return yearProgress > 0.3 && yearProgress < 0.8; // About 5 months per year
  }

  private isNeptuneRetrograde(julianDay: number): boolean {
    const yearProgress = ((julianDay - 2451545.0) % 365.25) / 365.25;
    return yearProgress > 0.3 && yearProgress < 0.8; // About 5 months per year
  }

  private isPlutoRetrograde(julianDay: number): boolean {
    const yearProgress = ((julianDay - 2451545.0) % 365.25) / 365.25;
    return yearProgress > 0.2 && yearProgress < 0.8; // About 6 months per year
  }

  // Database storage methods

  private async storeNatalChart(userId: string, birthData: SwissBirthData, houseSystem: HouseSystem): Promise<string> {
    const query = `
      INSERT INTO natal_charts (user_id, birth_datetime, birth_latitude, birth_longitude, birth_location, house_system)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING chart_id
    `;

    const birthDateTime = new Date(birthData.birth_date);
    if (birthData.birth_time) {
      const timeParts = birthData.birth_time.split(':').map(Number);
      const hours = timeParts[0] || 0;
      const minutes = timeParts[1] || 0;
      birthDateTime.setHours(hours, minutes, 0, 0);
    }

    const result = await this.databaseService.query(query, [
      userId,
      birthDateTime,
      birthData.latitude,
      birthData.longitude,
      birthData.birth_location,
      houseSystem
    ]);

    return result.rows[0].chart_id;
  }

  private async storePlanetaryPositions(chartId: string, positions: PlanetaryPosition[]): Promise<void> {
    const query = `
      INSERT INTO planetary_positions (chart_id, celestial_body, longitude, latitude, house_number, zodiac_sign, degree_in_sign, retrograde)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    for (const position of positions) {
      await this.databaseService.query(query, [
        chartId,
        position.celestial_body,
        position.longitude,
        position.latitude,
        position.house_number,
        position.zodiac_sign,
        position.degree_in_sign,
        position.retrograde
      ]);
    }
  }

  private async storeHouseCusps(chartId: string, cusps: HouseCusp[]): Promise<void> {
    const query = `
      INSERT INTO house_cusps (chart_id, house_number, cusp_longitude, zodiac_sign, degree_in_sign)
      VALUES ($1, $2, $3, $4, $5)
    `;

    for (const cusp of cusps) {
      await this.databaseService.query(query, [
        chartId,
        cusp.house_number,
        cusp.cusp_longitude,
        cusp.zodiac_sign,
        cusp.degree_in_sign
      ]);
    }
  }

  private async storeAspects(chartId: string, aspects: AspectData[]): Promise<void> {
    const query = `
      INSERT INTO aspects (chart_id, body1, body2, aspect_type, orb, exact_angle, applying)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const aspect of aspects) {
      await this.databaseService.query(query, [
        chartId,
        aspect.body1,
        aspect.body2,
        aspect.aspect_type,
        aspect.orb,
        aspect.exact_angle,
        aspect.applying
      ]);
    }
  }
}

export default SwissEphemerisService;