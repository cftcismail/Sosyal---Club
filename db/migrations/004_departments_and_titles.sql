-- Create departments and titles canonical tables and backfill from users

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS titles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backfill from existing users table
INSERT INTO departments (name)
SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO titles (name)
SELECT DISTINCT title FROM users WHERE title IS NOT NULL AND title <> ''
ON CONFLICT (name) DO NOTHING;
