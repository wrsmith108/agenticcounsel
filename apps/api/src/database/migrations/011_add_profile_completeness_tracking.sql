-- UP
-- Add profile completeness tracking for progressive onboarding
ALTER TABLE users 
ADD COLUMN profile_completeness_tier INTEGER DEFAULT 1,
ADD COLUMN birth_data_added_at TIMESTAMP,
ADD COLUMN last_enhancement_prompt_at TIMESTAMP;

-- Create index for tier tracking
CREATE INDEX idx_users_completeness_tier ON users(profile_completeness_tier);

-- Add comments for clarity
COMMENT ON COLUMN users.profile_completeness_tier IS 'User profile tier: 1=basic, 2=birth_date, 3=complete_birth_data';
COMMENT ON COLUMN users.birth_data_added_at IS 'Timestamp when user first added any birth data';
COMMENT ON COLUMN users.last_enhancement_prompt_at IS 'Last time user was prompted to enhance profile';

-- DOWN
DROP INDEX IF EXISTS idx_users_completeness_tier;
ALTER TABLE users 
DROP COLUMN IF EXISTS last_enhancement_prompt_at,
DROP COLUMN IF EXISTS birth_data_added_at,
DROP COLUMN IF EXISTS profile_completeness_tier;