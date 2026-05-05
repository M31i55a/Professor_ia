#!/bin/bash

# Start PostgreSQL container
echo "Starting PostgreSQL container..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Initialize the database
echo "Initializing database schema..."
docker exec professor_ia_db psql -U postgres -d professor_ia -f /dev/stdin < ./migrations/init.sql

echo "Applying additional migrations..."
docker exec professor_ia_db psql -U postgres -d professor_ia -f /dev/stdin < ./migrations/add_pdf_content.sql
docker exec professor_ia_db psql -U postgres -d professor_ia -f /dev/stdin < ./migrations/add_book_chunks.sql
docker exec professor_ia_db psql -U postgres -d professor_ia -f /dev/stdin < ./migrations/add_pgvector.sql

echo "Database initialized successfully!"
echo "PostgreSQL is running on localhost:5432"
