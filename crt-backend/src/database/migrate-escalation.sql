-- Add new role to ENUM
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'department_head';

-- Add custom JSONB field for dynamic inputs (like Hostel Block)
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add flag to mark complaints that have been algorithmically escalated
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT false;

-- Add index on is_escalated to make dashboard queries fast for Department Heads
CREATE INDEX IF NOT EXISTS idx_complaints_is_escalated ON complaints(is_escalated);
