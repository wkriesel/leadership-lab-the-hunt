-- Add is_test field to sessions table for marking test sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Create index for fast filtering by is_test (if not already exists)
CREATE INDEX IF NOT EXISTS idx_sessions_is_test ON sessions(is_test);
