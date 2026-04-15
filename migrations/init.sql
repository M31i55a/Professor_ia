-- Create companions table
CREATE TABLE IF NOT EXISTS companions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  style VARCHAR(100) NOT NULL,
  voice VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on author for faster queries
CREATE INDEX IF NOT EXISTS idx_companions_author ON companions(author);
CREATE INDEX IF NOT EXISTS idx_companions_subject ON companions(subject);
CREATE INDEX IF NOT EXISTS idx_companions_created_at ON companions(created_at DESC);

-- Create users table (optional, for future user profile storage)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add foreign key constraint to link companions to users
-- This ensures every companion belongs to a valid user and cannot be orphaned
ALTER TABLE companions
ADD CONSTRAINT fk_companions_author
FOREIGN KEY (author) REFERENCES users(id) ON DELETE CASCADE;
