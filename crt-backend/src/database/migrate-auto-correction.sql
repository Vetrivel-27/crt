-- Migration: Auto-Correction System
-- Adds columns to the complaints table to track AI-driven auto-corrections

ALTER TABLE complaints
    ADD COLUMN IF NOT EXISTS auto_corrected BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS student_selected_category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS student_selected_urgency complaint_urgency,
    ADD COLUMN IF NOT EXISTS correction_reason TEXT;

-- Index for efficient filtering of auto-corrected complaints on admin dashboard
CREATE INDEX IF NOT EXISTS idx_complaints_auto_corrected ON complaints(auto_corrected);
