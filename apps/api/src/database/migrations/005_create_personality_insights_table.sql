-- UP
CREATE TABLE personality_insights (
  insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  coaching_language TEXT NOT NULL,
  astrological_basis JSONB,
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  disclosed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_personality_insights_user_id ON personality_insights(user_id);
CREATE INDEX idx_personality_insights_category ON personality_insights(category);
CREATE INDEX idx_personality_insights_created_at ON personality_insights(created_at);
CREATE INDEX idx_personality_insights_disclosed_at ON personality_insights(disclosed_at);
CREATE INDEX idx_personality_insights_accuracy ON personality_insights(accuracy_rating);

-- Create composite indexes for common queries
CREATE INDEX idx_personality_user_category ON personality_insights(user_id, category);
CREATE INDEX idx_personality_user_disclosed ON personality_insights(user_id, disclosed_at);

-- Create GIN index for JSONB astrological_basis queries
CREATE INDEX idx_personality_astrological_basis ON personality_insights USING GIN (astrological_basis);

-- Create partial index for undisclosed insights
CREATE INDEX idx_personality_undisclosed 
ON personality_insights(user_id, created_at) 
WHERE disclosed_at IS NULL;

-- DOWN
DROP INDEX IF EXISTS idx_personality_undisclosed;
DROP INDEX IF EXISTS idx_personality_astrological_basis;
DROP INDEX IF EXISTS idx_personality_user_disclosed;
DROP INDEX IF EXISTS idx_personality_user_category;
DROP INDEX IF EXISTS idx_personality_insights_accuracy;
DROP INDEX IF EXISTS idx_personality_insights_disclosed_at;
DROP INDEX IF EXISTS idx_personality_insights_created_at;
DROP INDEX IF EXISTS idx_personality_insights_category;
DROP INDEX IF EXISTS idx_personality_insights_user_id;
DROP TABLE IF EXISTS personality_insights;