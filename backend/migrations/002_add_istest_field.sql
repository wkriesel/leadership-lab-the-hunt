-- Add is_test field to sessions table for marking test sessions
ALTER TABLE sessions ADD COLUMN is_test BOOLEAN DEFAULT FALSE;

-- Create index for fast filtering by is_test
CREATE INDEX idx_sessions_is_test ON sessions(is_test);
