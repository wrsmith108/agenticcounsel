-- UP
CREATE TABLE coaching_conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  title VARCHAR(255),
  session_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  duration_minutes INTEGER,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_coaching_conversations_user_id ON coaching_conversations(user_id);
CREATE INDEX idx_coaching_conversations_created_at ON coaching_conversations(created_at);
CREATE INDEX idx_coaching_conversations_status ON coaching_conversations(status);
CREATE INDEX idx_coaching_conversations_session_type ON coaching_conversations(session_type);

-- Create partial index for active conversations
CREATE INDEX idx_active_coaching_conversations 
ON coaching_conversations(user_id, created_at) 
WHERE status = 'active';

-- Create trigger for updated_at
CREATE TRIGGER update_coaching_conversations_updated_at 
    BEFORE UPDATE ON coaching_conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- DOWN
DROP TRIGGER IF EXISTS update_coaching_conversations_updated_at ON coaching_conversations;
DROP INDEX IF EXISTS idx_active_coaching_conversations;
DROP INDEX IF EXISTS idx_coaching_conversations_session_type;
DROP INDEX IF EXISTS idx_coaching_conversations_status;
DROP INDEX IF EXISTS idx_coaching_conversations_created_at;
DROP INDEX IF EXISTS idx_coaching_conversations_user_id;
DROP TABLE IF EXISTS coaching_conversations;