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
  pdf_content TEXT DEFAULT NULL,
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

-- Create session_history table to track completed sessions
CREATE TABLE IF NOT EXISTS session_history (
  id SERIAL PRIMARY KEY,
  companion_id INTEGER NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_history_companion ON session_history(companion_id);
CREATE INDEX IF NOT EXISTS idx_session_history_user ON session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_session_history_created ON session_history(created_at DESC);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  companion_id INTEGER NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (companion_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_companion ON bookmarks(companion_id);
