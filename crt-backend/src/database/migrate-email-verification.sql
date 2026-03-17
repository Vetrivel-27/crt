-- Migration: Add email verification columns to users table
-- Run this once against your live database.

ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;

-- The seeded admin and any existing users are considered pre-verified
UPDATE users SET email_verified = true WHERE verification_token IS NULL;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
