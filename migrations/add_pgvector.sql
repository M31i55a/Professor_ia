-- Enable pgvector extension (requires pgvector/pgvector Docker image or a hosted
-- Postgres that has the extension available, e.g. Neon, Supabase, Railway).
CREATE EXTENSION IF NOT EXISTS vector;

-- Add a 1536-dimensional embedding column to companion_chunks.
-- text-embedding-3-small (OpenAI) produces 1536-dim vectors.
ALTER TABLE companion_chunks
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- HNSW index for fast approximate cosine-similarity search.
-- Cosine distance is best for normalized text embeddings.
CREATE INDEX IF NOT EXISTS idx_companion_chunks_embedding
  ON companion_chunks
  USING hnsw (embedding vector_cosine_ops);
