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

export interface PersonalityProfile {
  astrological_basis: AstrologicalData;
  psychological_traits: PsychologicalTraits;
  accuracy_confidence: number;
  generated_at: Date;
  // Additional properties used by PersonalityDisplay component
  primary_type: string;
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

export interface BirthData {
  birth_date: string;
  birth_time?: string;
  birth_location: string;
}

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
  expires_in: string;
}

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