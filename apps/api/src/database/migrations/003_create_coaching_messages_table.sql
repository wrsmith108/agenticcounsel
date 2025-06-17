-- UP
CREATE TABLE coaching_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES coaching_conversations(conversation_id) ON DELETE CASCADE,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'coach')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_coaching_messages_conversation_id ON coaching_messages(conversation_id);
CREATE INDEX idx_coaching_messages_created_at ON coaching_messages(created_at);
CREATE INDEX idx_coaching_messages_sender_type ON coaching_messages(sender_type);

-- Create composite index for conversation message ordering
CREATE INDEX idx_coaching_messages_conversation_time ON coaching_messages(conversation_id, created_at);

-- Create GIN index for JSONB metadata queries
CREATE INDEX idx_coaching_messages_metadata ON coaching_messages USING GIN (metadata);

-- DOWN
DROP INDEX IF EXISTS idx_coaching_messages_metadata;
DROP INDEX IF EXISTS idx_coaching_messages_conversation_time;
DROP INDEX IF EXISTS idx_coaching_messages_sender_type;
DROP INDEX IF EXISTS idx_coaching_messages_created_at;
DROP INDEX IF EXISTS idx_coaching_messages_conversation_id;
DROP TABLE IF EXISTS coaching_messages;