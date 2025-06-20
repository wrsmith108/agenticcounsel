-- UP
-- Core memory bank table
CREATE TABLE user_memory_bank (
  memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  memory_type VARCHAR(50) NOT NULL, -- 'pattern', 'insight', 'context', 'behavioral'
  category VARCHAR(100) NOT NULL,
  content JSONB NOT NULL,
  confidence_score FLOAT DEFAULT 0.7,
  importance_score FLOAT DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_referenced TIMESTAMP DEFAULT NOW()
);

-- Pattern-specific memory
CREATE TABLE memory_patterns (
  pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL, -- 'communication', 'decision_making', 'stress_response'
  pattern_data JSONB NOT NULL,
  frequency_count INTEGER DEFAULT 1,
  strength_score FLOAT DEFAULT 0.5,
  examples JSONB[], -- Array of conversation examples
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Semantic insights and breakthroughs
CREATE TABLE memory_insights (
  insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  insight_type VARCHAR(50) NOT NULL, -- 'breakthrough', 'realization', 'goal_shift'
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  conversation_id UUID REFERENCES coaching_conversations(conversation_id),
  impact_score FLOAT DEFAULT 0.5,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contextual memory for conversation continuity
CREATE TABLE memory_context (
  context_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  context_type VARCHAR(50) NOT NULL, -- 'thread', 'reference', 'follow_up'
  title VARCHAR(255),
  context_data JSONB NOT NULL,
  related_conversations UUID[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Vector embeddings for semantic search
CREATE TABLE memory_embeddings (
  embedding_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES user_memory_bank(memory_id) ON DELETE CASCADE,
  embedding_vector FLOAT[],
  content_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_memory_bank_user_id ON user_memory_bank(user_id);
CREATE INDEX idx_memory_bank_type ON user_memory_bank(memory_type);
CREATE INDEX idx_memory_bank_importance ON user_memory_bank(importance_score DESC);
CREATE INDEX idx_memory_bank_last_referenced ON user_memory_bank(last_referenced DESC);

CREATE INDEX idx_memory_patterns_user_id ON memory_patterns(user_id);
CREATE INDEX idx_memory_patterns_type ON memory_patterns(pattern_type);
CREATE INDEX idx_memory_patterns_strength ON memory_patterns(strength_score DESC);

CREATE INDEX idx_memory_insights_user_id ON memory_insights(user_id);
CREATE INDEX idx_memory_insights_type ON memory_insights(insight_type);
CREATE INDEX idx_memory_insights_impact ON memory_insights(impact_score DESC);

CREATE INDEX idx_memory_context_user_id ON memory_context(user_id);
CREATE INDEX idx_memory_context_active ON memory_context(user_id, active) WHERE active = true;
CREATE INDEX idx_memory_context_expires ON memory_context(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_memory_embeddings_memory_id ON memory_embeddings(memory_id);
CREATE INDEX idx_memory_embeddings_hash ON memory_embeddings(content_hash);

-- Create trigger for updated_at on user_memory_bank
CREATE TRIGGER update_user_memory_bank_updated_at 
    BEFORE UPDATE ON user_memory_bank 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for updated_at on memory_patterns
CREATE TRIGGER update_memory_patterns_updated_at 
    BEFORE UPDATE ON memory_patterns 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- DOWN
DROP TRIGGER IF EXISTS update_memory_patterns_updated_at ON memory_patterns;
DROP TRIGGER IF EXISTS update_user_memory_bank_updated_at ON user_memory_bank;

DROP INDEX IF EXISTS idx_memory_embeddings_hash;
DROP INDEX IF EXISTS idx_memory_embeddings_memory_id;
DROP INDEX IF EXISTS idx_memory_context_expires;
DROP INDEX IF EXISTS idx_memory_context_active;
DROP INDEX IF EXISTS idx_memory_context_user_id;
DROP INDEX IF EXISTS idx_memory_insights_impact;
DROP INDEX IF EXISTS idx_memory_insights_type;
DROP INDEX IF EXISTS idx_memory_insights_user_id;
DROP INDEX IF EXISTS idx_memory_patterns_strength;
DROP INDEX IF EXISTS idx_memory_patterns_type;
DROP INDEX IF EXISTS idx_memory_patterns_user_id;
DROP INDEX IF EXISTS idx_memory_bank_last_referenced;
DROP INDEX IF EXISTS idx_memory_bank_importance;
DROP INDEX IF EXISTS idx_memory_bank_type;
DROP INDEX IF EXISTS idx_memory_bank_user_id;

DROP TABLE IF EXISTS memory_embeddings;
DROP TABLE IF EXISTS memory_context;
DROP TABLE IF EXISTS memory_insights;
DROP TABLE IF EXISTS memory_patterns;
DROP TABLE IF EXISTS user_memory_bank;