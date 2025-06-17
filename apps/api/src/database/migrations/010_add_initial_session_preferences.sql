-- UP
ALTER TABLE users ADD COLUMN initial_session_preferences JSONB;

-- Create index for performance if needed
CREATE INDEX idx_users_session_preferences ON users USING GIN (initial_session_preferences);

-- DOWN
DROP INDEX IF EXISTS idx_users_session_preferences;
ALTER TABLE users DROP COLUMN IF EXISTS initial_session_preferences;