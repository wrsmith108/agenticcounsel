interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  timezone?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    country?: string;
    country_code?: string;
  };
}

/**
 * Geocoding service using OpenStreetMap Nominatim API
 * Free service with no API key required
 */
export class GeocodingService {
  private static readonly BASE_URL = 'https://nominatim.openstreetmap.org/search';
  private static readonly TIMEOUT = 10000; // 10 seconds

  /**
   * Convert a location name to coordinates
   */
  static async geocodeLocation(location: string): Promise<GeocodingResult> {
    if (!location || location.trim().length === 0) {
      throw new Error('Location is required');
    }

    const trimmedLocation = location.trim();
    
    try {
      const params = new URLSearchParams({
        q: trimmedLocation,
        format: 'json',
        limit: '1',
        addressdetails: '1'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(`${this.BASE_URL}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'AgenticCounsel/1.0 (https://agenticcounsel.com)',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Geocoding service error: ${response.status} ${response.statusText}`);
      }

      const data: NominatimResponse[] = await response.json();

      if (!data || data.length === 0) {
        throw new Error(`Location "${trimmedLocation}" not found. Please try a more specific location (e.g., "New York, NY, USA")`);
      }

      const result = data[0];
      const latitude = parseFloat(result.lat);
      const longitude = parseFloat(result.lon);

      // Validate coordinates
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error('Invalid coordinates received from geocoding service');
      }

      if (latitude < -90 || latitude > 90) {
        throw new Error('Invalid latitude received from geocoding service');
      }

      if (longitude < -180 || longitude > 180) {
        throw new Error('Invalid longitude received from geocoding service');
      }

      // Estimate timezone based on country (simplified approach)
      const timezone = this.estimateTimezone(result.address?.country_code, longitude);

      return {
        latitude,
        longitude,
        display_name: result.display_name,
        timezone
      };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Geocoding request timed out. Please try again.');
        }
        throw error;
      }
      throw new Error('Failed to geocode location. Please check your internet connection and try again.');
    }
  }

  /**
   * Validate if a location string looks reasonable
   */
  static validateLocationFormat(location: string): boolean {
    if (!location || location.trim().length < 2) {
      return false;
    }

    const trimmed = location.trim();
    
    // Basic validation - should contain at least one letter
    if (!/[a-zA-Z]/.test(trimmed)) {
      return false;
    }

    // Should not be just numbers
    if (/^\d+$/.test(trimmed)) {
      return false;
    }

    return true;
  }

  /**
   * Get location suggestions for autocomplete
   */
  static async getLocationSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        format: 'json',
        limit: limit.toString(),
        addressdetails: '1'
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Shorter timeout for suggestions

      const response = await fetch(`${this.BASE_URL}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'AgenticCounsel/1.0 (https://agenticcounsel.com)',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return [];
      }

      const data: NominatimResponse[] = await response.json();
      
      return data.map(item => item.display_name).slice(0, limit);

    } catch (error) {
      // Silently fail for suggestions
      return [];
    }
  }

  /**
   * Simple timezone estimation based on country code and longitude
   * This is a simplified approach - in production, you'd use a proper timezone API
   */
  private static estimateTimezone(countryCode?: string, longitude?: number): string | undefined {
    if (!countryCode || !longitude) {
      return undefined;
    }

    // Common timezone mappings based on country code
    const timezoneMap: Record<string, string> = {
      'US': this.getUSTimezone(longitude),
      'CA': this.getCanadaTimezone(longitude),
      'GB': 'Europe/London',
      'FR': 'Europe/Paris',
      'DE': 'Europe/Berlin',
      'IT': 'Europe/Rome',
      'ES': 'Europe/Madrid',
      'JP': 'Asia/Tokyo',
      'CN': 'Asia/Shanghai',
      'AU': this.getAustraliaTimezone(longitude),
      'IN': 'Asia/Kolkata',
      'BR': 'America/Sao_Paulo',
      'MX': 'America/Mexico_City',
      'RU': 'Europe/Moscow',
    };

    return timezoneMap[countryCode.toUpperCase()];
  }

  private static getUSTimezone(longitude: number): string {
    if (longitude > -75) return 'America/New_York';      // Eastern
    if (longitude > -90) return 'America/Chicago';       // Central  
    if (longitude > -115) return 'America/Denver';       // Mountain
    return 'America/Los_Angeles';                        // Pacific
  }

  private static getCanadaTimezone(longitude: number): string {
    if (longitude > -60) return 'America/Halifax';       // Atlantic
    if (longitude > -90) return 'America/Toronto';       // Eastern
    if (longitude > -102) return 'America/Winnipeg';     // Central
    if (longitude > -115) return 'America/Edmonton';     // Mountain
    return 'America/Vancouver';                          // Pacific
  }

  private static getAustraliaTimezone(longitude: number): string {
    if (longitude > 153) return 'Australia/Sydney';      // Eastern
    if (longitude > 138) return 'Australia/Adelaide';    // Central
    return 'Australia/Perth';                            // Western
  }
}