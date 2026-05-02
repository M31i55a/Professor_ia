-- Stores chunked PDF content for RAG (Retrieval-Augmented Generation).
-- Each companion that was created from a PDF gets its text split into
-- 500-word overlapping segments stored here.  At query time, the VAPI
-- voice assistant calls /api/vapi/search-content to fetch the 3 most
-- relevant chunks instead of relying on a hard-capped static excerpt.

CREATE TABLE IF NOT EXISTS companion_chunks (
  id           SERIAL PRIMARY KEY,
  companion_id INTEGER NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  chunk_index  INTEGER NOT NULL,
  content      TEXT    NOT NULL,
  word_count   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fast look-up by companion
CREATE INDEX IF NOT EXISTS idx_companion_chunks_companion
  ON companion_chunks(companion_id);

-- Enforce no duplicate chunk positions per companion
CREATE UNIQUE INDEX IF NOT EXISTS idx_companion_chunks_unique
  ON companion_chunks(companion_id, chunk_index);

-- Full-text search index (used by /api/vapi/search-content)
CREATE INDEX IF NOT EXISTS idx_companion_chunks_fts
  ON companion_chunks USING gin(to_tsvector('english', content));
