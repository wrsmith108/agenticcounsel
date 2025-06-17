import { BirthData, PersonalityProfile, PersonalityInsight, AstrologicalData, PsychologicalTraits } from '../types';
import { DatabaseService } from './database';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/personality.log' })
  ]
});

export class PersonalityService {
  private databaseService: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
  }

  async generatePersonalityProfile(birthData: BirthData): Promise<PersonalityProfile> {
    try {
      logger.info('Generating personality profile', { birthData: { ...birthData, birth_time: birthData.birth_time ? 'provided' : 'not provided' } });

      // Calculate astrological data
      const astrologicalData = await this.calculateAstrologicalData(birthData);
      
      // Map to psychological traits
      const psychologicalTraits = this.mapToPsychologicalTraits(astrologicalData);
      
      // Calculate confidence based on available data
      const accuracyConfidence = this.calculateAccuracyConfidence(birthData);

      const profile: PersonalityProfile = {
        astrological_basis: astrologicalData,
        psychological_traits: psychologicalTraits,
        accuracy_confidence: accuracyConfidence,
        generated_at: new Date()
      };

      logger.info('Personality profile generated successfully', { 
        userId: 'pending', 
        confidence: accuracyConfidence 
      });

      return profile;
    } catch (error) {
      logger.error('Error generating personality profile:', error);
      throw error;
    }
  }

  async generateInitialInsights(userId: string, personalityProfile: PersonalityProfile): Promise<PersonalityInsight[]> {
    try {
      const insights: PersonalityInsight[] = [];

      // Generate core insights for the first "aha moment"
      const coreInsights = [
        {
          category: 'communication_style' as const,
          insight: this.generateCommunicationStyleInsight(personalityProfile),
          astrological_basis: {
            primary_influence: personalityProfile.astrological_basis.rising_sign,
            secondary_influence: personalityProfile.astrological_basis.mercury_position
          }
        },
        {
          category: 'decision_making' as const,
          insight: this.generateDecisionMakingInsight(personalityProfile),
          astrological_basis: {
            primary_influence: personalityProfile.astrological_basis.sun_sign,
            secondary_influence: personalityProfile.astrological_basis.mars_position
          }
        },
        {
          category: 'stress_response' as const,
          insight: this.generateStressResponseInsight(personalityProfile),
          astrological_basis: {
            primary_influence: personalityProfile.astrological_basis.moon_sign,
            secondary_influence: personalityProfile.astrological_basis.mars_position
          }
        }
      ];

      // Create insight records
      for (const insightData of coreInsights) {
        const insight = await this.databaseService.createPersonalityInsight({
          user_id: userId,
          category: insightData.category,
          astrological_basis: insightData.astrological_basis,
          coaching_language: insightData.insight,
          accuracy_rating: null
        });
        insights.push(insight);
      }

      logger.info('Initial insights generated', { userId, insightCount: insights.length });
      return insights;
    } catch (error) {
      logger.error('Error generating initial insights:', error);
      throw error;
    }
  }

  private async calculateAstrologicalData(birthData: BirthData): Promise<AstrologicalData> {
    // This is a simplified astrological calculation
    // In a real implementation, you would use a proper astrological library
    const birthDate = new Date(birthData.birth_date);
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();

    // Simplified sun sign calculation
    const sunSign = this.calculateSunSign(month, day);
    
    // For moon and rising signs, we need birth time and location
    // If not provided, we'll use simplified defaults
    const moonSign = birthData.birth_time ? this.calculateMoonSign(birthDate, birthData.birth_time) : sunSign;
    const risingSign = birthData.birth_time ? this.calculateRisingSign(birthDate, birthData.birth_time, birthData.birth_location) : sunSign;

    // Planetary positions (simplified)
    const mercuryPosition = this.calculatePlanetaryPosition('mercury', birthDate);
    const venusPosition = this.calculatePlanetaryPosition('venus', birthDate);
    const marsPosition = this.calculatePlanetaryPosition('mars', birthDate);

    return {
      sun_sign: sunSign,
      moon_sign: moonSign,
      rising_sign: risingSign,
      mercury_position: mercuryPosition,
      venus_position: venusPosition,
      mars_position: marsPosition,
      birth_chart_data: {
        birth_date: birthData.birth_date,
        birth_time: birthData.birth_time,
        birth_location: birthData.birth_location,
        calculated_at: new Date().toISOString()
      }
    };
  }

  private mapToPsychologicalTraits(astrologicalData: AstrologicalData): PsychologicalTraits {
    return {
      communication_style: this.mapCommunicationStyle(astrologicalData.rising_sign, astrologicalData.mercury_position),
      decision_making_pattern: this.mapDecisionMakingPattern(astrologicalData.sun_sign, astrologicalData.mars_position),
      stress_response: this.mapStressResponse(astrologicalData.moon_sign),
      leadership_tendency: this.mapLeadershipTendency(astrologicalData.sun_sign, astrologicalData.mars_position),
      growth_orientation: this.mapGrowthOrientation(astrologicalData.sun_sign, astrologicalData.moon_sign)
    };
  }

  private calculateSunSign(month: number, day: number): string {
    const signs = [
      { sign: 'Capricorn', start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
      { sign: 'Aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
      { sign: 'Pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
      { sign: 'Aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
      { sign: 'Taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
      { sign: 'Gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
      { sign: 'Cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
      { sign: 'Leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
      { sign: 'Virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
      { sign: 'Libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
      { sign: 'Scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
      { sign: 'Sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } }
    ];

    for (const signData of signs) {
      if (this.isDateInRange(month, day, signData.start, signData.end)) {
        return signData.sign;
      }
    }

    return 'Capricorn'; // Default fallback
  }

  private isDateInRange(month: number, day: number, start: { month: number; day: number }, end: { month: number; day: number }): boolean {
    if (start.month === end.month) {
      return month === start.month && day >= start.day && day <= end.day;
    } else {
      return (month === start.month && day >= start.day) || (month === end.month && day <= end.day);
    }
  }

  private calculateMoonSign(birthDate: Date, birthTime: string): string {
    // Simplified moon sign calculation
    // In reality, this requires complex astronomical calculations
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const dayOfYear = Math.floor((birthDate.getTime() - new Date(birthDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const timeParts = birthTime.split(':').map(Number);
    const hours = timeParts[0] || 12; // Default to noon if parsing fails
    const index = (dayOfYear + hours) % 12;
    return signs[index] || 'Aries';
  }

  private calculateRisingSign(birthDate: Date, birthTime: string, location: string): string {
    // Simplified rising sign calculation
    // In reality, this requires birth time and geographic coordinates
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const timeParts = birthTime.split(':').map(Number);
    const hours = timeParts[0] || 12; // Default to noon if parsing fails
    const minutes = timeParts[1] || 0; // Default to 0 minutes if parsing fails
    const timeIndex = Math.floor((hours * 60 + minutes) / 120); // 2-hour windows
    const locationHash = location.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const index = (timeIndex + locationHash) % 12;
    return signs[index] || 'Aries';
  }

  private calculatePlanetaryPosition(planet: string, birthDate: Date): string {
    // Simplified planetary position calculation
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const planetOffsets = { mercury: 0, venus: 3, mars: 6 };
    const dayOfYear = Math.floor((birthDate.getTime() - new Date(birthDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const offset = planetOffsets[planet as keyof typeof planetOffsets] || 0;
    const index = (Math.floor(dayOfYear / 30) + offset) % 12;
    return signs[index] || 'Aries';
  }

  private mapCommunicationStyle(risingSign: string, mercuryPosition: string): string {
    const styles: Record<string, string> = {
      'Aries': 'direct and energetic',
      'Taurus': 'steady and practical',
      'Gemini': 'versatile and articulate',
      'Cancer': 'intuitive and empathetic',
      'Leo': 'confident and expressive',
      'Virgo': 'precise and analytical',
      'Libra': 'diplomatic and harmonious',
      'Scorpio': 'intense and perceptive',
      'Sagittarius': 'enthusiastic and philosophical',
      'Capricorn': 'structured and authoritative',
      'Aquarius': 'innovative and independent',
      'Pisces': 'compassionate and imaginative'
    };

    return styles[risingSign] || 'balanced and adaptable';
  }

  private mapDecisionMakingPattern(sunSign: string, marsPosition: string): string {
    const patterns: Record<string, string> = {
      'Aries': 'quick and instinctive',
      'Taurus': 'deliberate and thorough',
      'Gemini': 'analytical and flexible',
      'Cancer': 'intuitive and cautious',
      'Leo': 'confident and decisive',
      'Virgo': 'methodical and detail-oriented',
      'Libra': 'collaborative and balanced',
      'Scorpio': 'strategic and intense',
      'Sagittarius': 'optimistic and broad-minded',
      'Capricorn': 'systematic and goal-oriented',
      'Aquarius': 'innovative and logical',
      'Pisces': 'intuitive and adaptable'
    };

    return patterns[sunSign] || 'thoughtful and measured';
  }

  private mapStressResponse(moonSign: string): string {
    const responses: Record<string, string> = {
      'Aries': 'action-oriented and direct',
      'Taurus': 'seeking stability and comfort',
      'Gemini': 'through communication and analysis',
      'Cancer': 'emotional processing and withdrawal',
      'Leo': 'seeking support and recognition',
      'Virgo': 'organizing and problem-solving',
      'Libra': 'seeking harmony and balance',
      'Scorpio': 'intense focus and transformation',
      'Sagittarius': 'seeking perspective and freedom',
      'Capricorn': 'structured approach and control',
      'Aquarius': 'detachment and innovation',
      'Pisces': 'emotional release and creativity'
    };

    return responses[moonSign] || 'adaptive and resilient';
  }

  private mapLeadershipTendency(sunSign: string, marsPosition: string): string {
    const tendencies: Record<string, string> = {
      'Aries': 'pioneering and decisive',
      'Taurus': 'steady and reliable',
      'Gemini': 'communicative and flexible',
      'Cancer': 'nurturing and protective',
      'Leo': 'inspiring and charismatic',
      'Virgo': 'service-oriented and efficient',
      'Libra': 'collaborative and fair',
      'Scorpio': 'transformational and intense',
      'Sagittarius': 'visionary and motivating',
      'Capricorn': 'strategic and disciplined',
      'Aquarius': 'innovative and humanitarian',
      'Pisces': 'empathetic and intuitive'
    };

    return tendencies[sunSign] || 'balanced and supportive';
  }

  private mapGrowthOrientation(sunSign: string, moonSign: string): string {
    const orientations: Record<string, string> = {
      'Aries': 'developing patience and collaboration',
      'Taurus': 'embracing change and flexibility',
      'Gemini': 'deepening focus and commitment',
      'Cancer': 'building confidence and boundaries',
      'Leo': 'cultivating humility and listening',
      'Virgo': 'accepting imperfection and spontaneity',
      'Libra': 'developing decisiveness and independence',
      'Scorpio': 'practicing trust and openness',
      'Sagittarius': 'developing attention to detail',
      'Capricorn': 'embracing creativity and play',
      'Aquarius': 'deepening emotional connections',
      'Pisces': 'building structure and boundaries'
    };

    return orientations[sunSign] || 'continuous learning and adaptation';
  }

  private calculateAccuracyConfidence(birthData: BirthData): number {
    let confidence = 60; // Base confidence with just birth date

    if (birthData.birth_time) {
      confidence += 25; // Birth time significantly improves accuracy
    }

    if (birthData.birth_location) {
      confidence += 15; // Location helps with rising sign calculation
    }

    return Math.min(confidence, 95); // Cap at 95% to maintain humility
  }

  private generateCommunicationStyleInsight(profile: PersonalityProfile): string {
    const style = profile.psychological_traits.communication_style;
    return `Your natural communication style is ${style}. This means you tend to express yourself in ways that feel authentic and comfortable to you, though you may find that adapting your approach in different situations can enhance your effectiveness with diverse audiences.`;
  }

  private generateDecisionMakingInsight(profile: PersonalityProfile): string {
    const pattern = profile.psychological_traits.decision_making_pattern;
    return `Your decision-making pattern tends to be ${pattern}. This approach serves you well in many situations, and recognizing this pattern can help you leverage your natural strengths while being mindful of when a different approach might be beneficial.`;
  }

  private generateStressResponseInsight(profile: PersonalityProfile): string {
    const response = profile.psychological_traits.stress_response;
    return `When under pressure, you typically respond by ${response}. Understanding this pattern can help you recognize your stress signals early and develop strategies that work with your natural tendencies rather than against them.`;
  }
}