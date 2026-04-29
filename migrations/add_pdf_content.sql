-- Migration: Add pdf_content column to companions table
-- Run this if you already have a companions table and want to add PDF support.
ALTER TABLE companions
ADD COLUMN IF NOT EXISTS pdf_content TEXT DEFAULT NULL;
