// Core User Types
export interface User {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  birth_date?: Date;
  birth_time?: string;
  birth_location?: string;
  personality_profile?: PersonalityProfile;
  coaching_goals?: string[];
  onboarding_completed: boolean;
  created_at: Date;
  updated_at: Date;
}

// Backend-specific User type (extends base User)
export interface UserWithPassword extends User {
  password_hash: string;
}

export interface PersonalityProfile {
  astrological_basis: AstrologicalData;
  psychological_traits: PsychologicalTraits;
  accuracy_confidence: number;
  generated_at: Date;
  // Frontend-specific properties for PersonalityDisplay component
  primary_type?: string;
  description?: string;
  key_traits?: string[];
  strengths?: string[];
  growth_areas?: string[];
  coaching_recommendations?: string[];
  created_at: Date;
  confidence_score?: number;
}

export interface AstrologicalData {
  sun_sign: string;
  moon_sign: string;
  rising_sign: string;
  mercury_position: string;
  venus_position: string;
  mars_position: string;
  birth_chart_data: Record<string, any>;
}

export interface PsychologicalTraits {
  communication_style: string;
  decision_making_pattern: string;
  stress_response: string;
  leadership_tendency: string;
  growth_orientation: string;
}

export interface PersonalityInsight {
  insight_id: string;
  user_id: string;
  category: InsightCategory;
  astrological_basis: Record<string, any>;
  coaching_language: string;
  accuracy_rating?: number;
  disclosed_at?: Date;
  created_at: Date;
}

export type InsightCategory = 
  | 'communication_style'
  | 'decision_making'
  | 'stress_response'
  | 'leadership'
  | 'growth_areas'
  | 'relationship_patterns';

// Coaching Session Types
export interface CoachingSession {
  conversation_id: string;
  user_id: string;
  session_type: SessionType;
  status: SessionStatus;
  duration_minutes?: number;
  satisfaction_rating?: number;
  created_at: Date;
  ended_at?: Date;
}

export type SessionType = 
  | 'initial_insights'
  | 'goal_setting'
  | 'coaching_conversation'
  | 'progress_review'
  | 'action_planning';

export type SessionStatus = 'active' | 'completed' | 'cancelled';

export interface Message {
  message_id: string;
  conversation_id: string;
  sender_type: 'user' | 'coach';
  content: string;
  metadata?: MessageMetadata;
  created_at: Date;
}

export interface MessageMetadata {
  personality_context?: string;
  aha_moment_type?: AhaMomentType;
  coaching_technique?: string;
  response_time_ms?: number;
}

export type AhaMomentType = 
  | 'personality_recognition'
  | 'empathetic_understanding'
  | 'personalized_guidance'
  | 'progress_clarity';

// Progress Tracking Types
export interface ProgressTracking {
  tracking_id: string;
  user_id: string;
  goal_category: string;
  current_progress: ProgressData;
  milestones: Milestone[];
  personality_aligned_metrics: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface ProgressData {
  completion_percentage: number;
  current_phase: string;
  achievements: Achievement[];
  challenges: Challenge[];
}

export interface Milestone {
  milestone_id: string;
  title: string;
  description: string;
  target_date?: Date;
  completed: boolean;
  completed_at?: Date;
}

export interface Achievement {
  achievement_id: string;
  title: string;
  description: string;
  earned_at: Date;
}

export interface Challenge {
  challenge_id: string;
  description: string;
  suggested_actions: string[];
  identified_at: Date;
}

// Birth Data Types
export interface BirthData {
  birth_date: string;
  birth_time?: string;
  birth_location: string;
}

// Authentication Types
export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  birth_date: string;
  birth_time?: string;
  birth_location: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
  expires_in?: string;
  refresh_token?: string;
}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  errors?: ValidationError[];
  timestamp?: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

// Frontend-specific Progress Types
export interface ProgressOverview {
  total_goals: number;
  average_progress: number;
  completed_milestones: number;
  total_milestones: number;
  milestone_completion_rate: number;
  recent_activity: any[];
  progress_by_category: {
    goal_category: string;
    completion_percentage: number;
    current_phase: string;
    last_updated: Date;
  }[];
}

export interface ProgressInsight {
  type: string;
  title: string;
  description: string;
  action_suggestion: string;
}

export interface ProgressRecommendation {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ProgressEntry {
  entry_id: string;
  user_id: string;
  goal_category: string;
  progress_percentage: number;
  recorded_at: Date;
  notes?: string;
  milestone_achieved?: boolean;
  metadata?: Record<string, any>;
}

// Backend-specific Coaching Types
export interface CoachingContext {
  user_first_name?: string;
  user_last_name?: string;
  user_personality: PersonalityProfile;
  conversation_history: Message[];
  current_message: string;
  session_type: SessionType;
  coaching_goals: string[];
  aha_moments_delivered: AhaMomentType[];
}

export interface CoachingResponse {
  content: string;
  metadata: {
    personality_applied: boolean;
    aha_moment_type?: AhaMomentType;
    coaching_technique: string;
    confidence_score: number;
  };
}

// Backend Configuration Types
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string | undefined;
  db?: number;
}

export interface OpenAIConfig {
  api_key: string;
  model: string;
  max_tokens: number;
  temperature: number;
}

export interface AppConfig {
  port: number;
  jwt_secret: string;
  jwt_expires_in: string;
  refresh_token_expires_in: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  openai: OpenAIConfig;
  cors_origin: string;
  rate_limit: {
    window_ms: number;
    max_requests: number;
  };
}

// Swiss Ephemeris / Astrology Types
export interface BirthDataForm {
  birth_date: string; // ISO date string (YYYY-MM-DD)
  birth_time?: string; // HH:MM format
  birth_location: string;
  house_system: HouseSystem;
}

export interface NatalChart {
  chart_id: string;
  user_id: string;
  birth_data: SwissBirthData;
  planetary_positions: PlanetaryPosition[];
  house_cusps: HouseCusp[];
  aspects: AspectData[];
  house_system: HouseSystem;
  created_at: Date;
}

// Alias for backend compatibility
export interface NatalChartData extends NatalChart {}

export interface SwissBirthData {
  birth_date: string; // ISO date string
  birth_time?: string; // HH:MM format
  birth_location: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export interface PlanetaryPosition {
  celestial_body: CelestialBody;
  longitude: number; // 0-360 degrees
  latitude: number; // -90 to 90 degrees
  house_number: number; // 1-12
  zodiac_sign: ZodiacSign;
  degree_in_sign: number; // 0-30 degrees
  retrograde: boolean;
}

export interface HouseCusp {
  house_number: number; // 1-12
  cusp_longitude: number; // 0-360 degrees
  zodiac_sign: ZodiacSign;
  degree_in_sign: number; // 0-30 degrees
}

export interface AspectData {
  body1: CelestialBody;
  body2: CelestialBody;
  aspect_type: AspectType;
  orb: number; // degrees
  exact_angle: number; // 0-360 degrees
  applying: boolean;
}

export type CelestialBody =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn'
  | 'Uranus' | 'Neptune' | 'Pluto' | 'Ascendant' | 'Midheaven'
  | 'North Node' | 'South Node' | 'Lilith';

export type ZodiacSign =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer' | 'Leo' | 'Virgo'
  | 'Libra' | 'Scorpio' | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces';

export type HouseSystem = 'Placidus' | 'Koch' | 'Equal' | 'Whole Sign' | 'Campanus';

export type AspectType =
  | 'conjunction' | 'opposition' | 'square' | 'trine' | 'sextile'
  | 'quincunx' | 'semisquare' | 'sesquiquadrate';

// Astrology API Request/Response Types
export interface CreateNatalChartRequest {
  birth_date: string; // ISO date string (YYYY-MM-DD)
  birth_time?: string; // HH:MM format
  birth_location: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  house_system?: HouseSystem;
}

export interface UpdateNatalChartRequest {
  birth_date?: string; // ISO date string (YYYY-MM-DD)
  birth_time?: string; // HH:MM format
  birth_location?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  house_system?: HouseSystem;
}

export interface NatalChartResponse {
  chart_id: string;
  user_id: string;
  birth_data: SwissBirthData;
  planetary_positions: PlanetaryPosition[];
  house_cusps: HouseCusp[];
  aspects: AspectData[];
  house_system: HouseSystem;
  created_at: Date;
}

export interface PlanetaryPositionsResponse {
  planetary_positions: PlanetaryPosition[];
}

export interface HouseCuspsResponse {
  house_cusps: HouseCusp[];
}

export interface AspectsResponse {
  aspects: AspectData[];
}

export interface AspectsQueryParams {
  aspect_type?: AspectType;
  max_orb?: number;
  applying_only?: boolean;
}

// Swiss Ephemeris Error Types
export interface SwissEphemerisError {
  code: 'CALCULATION_ERROR' | 'INVALID_BIRTH_DATA' | 'CHART_NOT_FOUND' | 'ACCESS_DENIED';
  message: string;
  details?: any;
}