@echo off

echo Starting PostgreSQL container...
docker-compose up -d

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak

echo Initializing database schema...
docker exec professor_ia_db psql -U postgres -d professor_ia < migrations/init.sql

echo Database initialized successfully!
echo PostgreSQL is running on localhost:5432
