-- UP
CREATE TABLE progress_tracking (
  progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  goal_category VARCHAR(100) NOT NULL,
  milestone_type VARCHAR(100),
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER,
  current_progress_data JSONB,
  milestones JSONB,
  personality_aligned_metrics JSONB,
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_progress_tracking_user_id ON progress_tracking(user_id);
CREATE INDEX idx_progress_tracking_goal_category ON progress_tracking(goal_category);
CREATE INDEX idx_progress_tracking_created_at ON progress_tracking(created_at);
CREATE INDEX idx_progress_tracking_achieved_at ON progress_tracking(achieved_at);

-- Create composite indexes for common queries
CREATE INDEX idx_progress_user_goal ON progress_tracking(user_id, goal_category);
CREATE INDEX idx_progress_user_milestone ON progress_tracking(user_id, milestone_type);

-- Create GIN indexes for JSONB queries
CREATE INDEX idx_progress_current_data ON progress_tracking USING GIN (current_progress_data);
CREATE INDEX idx_progress_milestones ON progress_tracking USING GIN (milestones);
CREATE INDEX idx_progress_metrics ON progress_tracking USING GIN (personality_aligned_metrics);

-- Create trigger for updated_at
CREATE TRIGGER update_progress_tracking_updated_at 
    BEFORE UPDATE ON progress_tracking 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- DOWN
DROP TRIGGER IF EXISTS update_progress_tracking_updated_at ON progress_tracking;
DROP INDEX IF EXISTS idx_progress_metrics;
DROP INDEX IF EXISTS idx_progress_milestones;
DROP INDEX IF EXISTS idx_progress_current_data;
DROP INDEX IF EXISTS idx_progress_user_milestone;
DROP INDEX IF EXISTS idx_progress_user_goal;
DROP INDEX IF EXISTS idx_progress_tracking_achieved_at;
DROP INDEX IF EXISTS idx_progress_tracking_created_at;
DROP INDEX IF EXISTS idx_progress_tracking_goal_category;
DROP INDEX IF EXISTS idx_progress_tracking_user_id;
DROP TABLE IF EXISTS progress_tracking;