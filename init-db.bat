@echo off

echo Starting PostgreSQL container...
docker-compose up -d

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak

echo Initializing database schema...
docker exec -i professor_ia_db psql -U postgres -d professor_ia < migrations/init.sql

echo Applying additional migrations...
docker exec -i professor_ia_db psql -U postgres -d professor_ia < migrations/add_pdf_content.sql
docker exec -i professor_ia_db psql -U postgres -d professor_ia < migrations/add_book_chunks.sql
docker exec -i professor_ia_db psql -U postgres -d professor_ia < migrations/add_pgvector.sql

echo Database initialized successfully!
echo PostgreSQL is running on localhost:5432
