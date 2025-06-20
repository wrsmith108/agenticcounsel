export interface UserMemoryBank {
  memory_id: string;
  user_id: string;
  memory_type: 'pattern' | 'insight' | 'context' | 'behavioral';
  category: string;
  content: Record<string, any>;
  confidence_score: number;
  importance_score: number;
  created_at: Date;
  updated_at: Date;
  last_referenced: Date;
}

export interface MemoryPattern {
  pattern_id: string;
  user_id: string;
  pattern_type: 'communication' | 'decision_making' | 'stress_response' | 'goal_setting' | 'learning_style';
  pattern_data: {
    description: string;
    triggers: string[];
    responses: string[];
    context: Record<string, any>;
  };
  frequency_count: number;
  strength_score: number;
  examples: ConversationExample[];
  created_at: Date;
  updated_at: Date;
}

export interface ConversationExample {
  conversation_id: string;
  excerpt: string;
  timestamp: Date;
  relevance_score: number;
}

export interface MemoryInsight {
  insight_id: string;
  user_id: string;
  insight_type: 'breakthrough' | 'realization' | 'goal_shift' | 'pattern_recognition' | 'emotional_growth';
  title: string;
  description: string;
  conversation_id?: string;
  impact_score: number;
  tags: string[];
  created_at: Date;
}

export interface MemoryContext {
  context_id: string;
  user_id: string;
  context_type: 'thread' | 'reference' | 'follow_up' | 'goal_tracking' | 'relationship_dynamic';
  title?: string;
  context_data: {
    summary: string;
    key_points: string[];
    emotional_state?: string;
    action_items?: string[];
    references?: string[];
  };
  related_conversations: string[];
  active: boolean;
  created_at: Date;
  expires_at?: Date;
}

export interface MemoryEmbedding {
  embedding_id: string;
  memory_id: string;
  embedding_vector: number[];
  content_hash: string;
  created_at: Date;
}

// Request/Response types for API
export interface CreateMemoryRequest {
  memory_type: UserMemoryBank['memory_type'];
  category: string;
  content: Record<string, any>;
  confidence_score?: number;
  importance_score?: number;
}

export interface UpdateMemoryRequest {
  content?: Record<string, any>;
  confidence_score?: number;
  importance_score?: number;
  category?: string;
}

export interface CreatePatternRequest {
  pattern_type: MemoryPattern['pattern_type'];
  pattern_data: MemoryPattern['pattern_data'];
  conversation_id?: string;
  strength_score?: number;
}

export interface CreateInsightRequest {
  insight_type: MemoryInsight['insight_type'];
  title: string;
  description: string;
  conversation_id?: string;
  impact_score?: number;
  tags?: string[];
}

export interface CreateContextRequest {
  context_type: MemoryContext['context_type'];
  title?: string;
  context_data: MemoryContext['context_data'];
  related_conversations?: string[];
  expires_at?: Date;
}

export interface MemorySearchQuery {
  query: string;
  memory_types?: UserMemoryBank['memory_type'][];
  categories?: string[];
  min_confidence?: number;
  min_importance?: number;
  limit?: number;
  include_embeddings?: boolean;
}

export interface MemorySearchResult {
  memory: UserMemoryBank;
  relevance_score: number;
  embedding?: MemoryEmbedding;
}

export interface PatternAnalysisResult {
  pattern: MemoryPattern;
  recent_examples: ConversationExample[];
  trend_analysis: {
    frequency_change: number;
    strength_change: number;
    last_occurrence: Date;
  };
}

export interface MemoryBankSummary {
  total_memories: number;
  memories_by_type: Record<string, number>;
  top_patterns: MemoryPattern[];
  recent_insights: MemoryInsight[];
  active_contexts: MemoryContext[];
  memory_health_score: number;
}

export interface MemoryBankConfig {
  max_memories_per_user: number;
  memory_retention_days: number;
  pattern_strength_threshold: number;
  insight_impact_threshold: number;
  context_expiry_days: number;
  embedding_model: string;
  similarity_threshold: number;
}

// Event types for memory bank operations
export interface MemoryBankEvent {
  event_type: 'memory_created' | 'pattern_detected' | 'insight_generated' | 'context_updated';
  user_id: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface MemoryAnalytics {
  user_id: string;
  period_start: Date;
  period_end: Date;
  metrics: {
    memories_created: number;
    patterns_identified: number;
    insights_generated: number;
    contexts_active: number;
    engagement_score: number;
    growth_indicators: string[];
  };
}