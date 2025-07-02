-- FILE: apps/data-ingestion-service/src/migrations/004_create_knowledge_embeddings_table.sql

-- Enable the pgvector extension if it doesn't already exist.
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the new table to store our AI's knowledge base.
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metadata to track the origin of the knowledge
  source_file TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  
  -- Columns for the unique business key
  system_uuid UUID NOT NULL,
  time_period TIMESTAMPTZ NOT NULL,
  
  -- The original, human-readable text that was embedded
  content TEXT NOT NULL,
  
  -- The vector embedding itself.
  embedding VECTOR(768)
);

-- Create a unique constraint on the combination of the system's UUID and the timestamp.
-- This enforces your business rule directly in the database.
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_embeddings_system_time_idx
ON knowledge_embeddings (system_uuid, time_period);

-- Create an index on the 'embedding' column for efficient similarity search.
CREATE INDEX IF NOT EXISTS hnsw_knowledge_embeddings_embedding_idx
ON knowledge_embeddings
USING HNSW (embedding vector_l2_ops);
