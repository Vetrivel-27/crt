-- Complaint Resolution Tracker Database Schema

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS complaint_history CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS complaint_status CASCADE;
DROP TYPE IF EXISTS complaint_urgency CASCADE;
DROP TYPE IF EXISTS action_type CASCADE;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('student', 'worker', 'admin');
CREATE TYPE complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE complaint_urgency AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE action_type AS ENUM ('created', 'status_change', 'note_added', 'assigned', 'reassigned', 'feedback_added', 'resolved');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    department VARCHAR(100),
    student_id VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaints table
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    urgency complaint_urgency NOT NULL DEFAULT 'medium',
    status complaint_status NOT NULL DEFAULT 'open',
    priority INTEGER DEFAULT 0,
    assigned_worker_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_department VARCHAR(100),
    ai_summary TEXT,
    resolution_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Complaint history table
CREATE TABLE complaint_history (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type action_type NOT NULL,
    old_status complaint_status,
    new_status complaint_status,
    note TEXT,
    is_public BOOLEAN DEFAULT false,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(complaint_id, student_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_complaints_student_id ON complaints(student_id);
CREATE INDEX idx_complaints_assigned_worker_id ON complaints(assigned_worker_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_created_at ON complaints(created_at);
CREATE INDEX idx_complaint_history_complaint_id ON complaint_history(complaint_id);
CREATE INDEX idx_complaint_history_timestamp ON complaint_history(timestamp);
CREATE INDEX idx_feedback_complaint_id ON feedback(complaint_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' with bcrypt (10 rounds)
INSERT INTO users (name, email, password_hash, role, department) VALUES
('System Admin', 'admin@crt.edu', '$2b$10$rKvVPZQGvGGGqH8qN8qN8eYxYxYxYxYxYxYxYxYxYxYxYxYxYxYxY', 'admin', 'Administration');

-- Note: The above password hash is a placeholder. 
-- In production, generate proper bcrypt hash using the actual password.
