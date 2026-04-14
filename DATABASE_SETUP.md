# PostgreSQL Database Setup Guide

This document explains the PostgreSQL database setup for the Professor IA SaaS application.

## Overview

The application has been migrated from Supabase to a self-hosted PostgreSQL database while keeping Clerk for authentication.

### What Was Changed

1. **Removed** - `lib/supabase.ts` (unused Supabase client)
2. **Kept** - PostgreSQL connection pool in `lib/db.ts` (already configured)
3. **Verified** - All API routes use direct PostgreSQL queries

## Quick Start

### 1. Start the Database

```bash
# Start PostgreSQL container
docker-compose up -d

# Verify it's running
docker-compose ps
```

### 2. Run Migrations

The database schema should be initialized automatically by Docker. To manually apply migrations:

```bash
# Using the batch script (Windows)
.\init-db.bat

# Using the shell script (Linux/Mac)
./init-db.sh

# Or manually with psql
docker-compose exec postgres psql -U postgres -d professor_ia -f migrations/init.sql
```

### 3. Test the Connection

```bash
# Run the database test script
node scripts/test-db.js

# Or use the dev command
npm run dev
```

## Environment Configuration

Your `.env.local` should contain:

```env
# Database Connection
DB_USER=postgres
DB_PASSWORD=postgres123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=professor_ia

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Database Schema

### companions Table

- `id` - SERIAL PRIMARY KEY
- `name` - VARCHAR(255) - Companion name
- `subject` - VARCHAR(100) - Subject area
- `topic` - VARCHAR(255) - Topic
- `style` - VARCHAR(100) - Teaching style
- `voice` - VARCHAR(100) - Voice type
- `duration` - INTEGER - Duration in seconds
- `author` - VARCHAR(255) - Clerk user ID (author)
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**Indexes**: `author`, `subject`, `created_at DESC`

### users Table

- `id` - VARCHAR(255) PRIMARY KEY - Clerk user ID
- `email` - VARCHAR(255) UNIQUE
- `name` - VARCHAR(255)
- `image` - VARCHAR(500) - Profile image URL
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

**Indexes**: `email`

## API Routes

All API endpoints use PostgreSQL directly through the `query()` function:

- `GET /api/companions` - Get user's companions
- `POST /api/companions` - Create companion
- `GET /api/companions/[id]` - Get specific companion
- `PUT /api/companions/[id]` - Update companion
- `DELETE /api/companions/[id]` - Delete companion

## Docker Compose Setup

The `docker-compose.yml` defines:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
      POSTGRES_DB: professor_ia
    ports:
      - "5432:5432"
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Connection refused

```bash
# Verify container is running
docker-compose ps

# Check if port 5432 is in use
netstat -tulpn | grep 5432
```

### Migration issues

```bash
# Connect directly to database
docker-compose exec postgres psql -U postgres -d professor_ia

# In psql, verify tables
\dt
```

### Permission denied errors

```bash
# Fix ownership (if needed)
docker-compose exec postgres psql -U postgres -d professor_ia -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;"
```

## Development Workflow

### 1. Start development environment

```bash
docker-compose up -d
npm run dev
```

### 2. Access database

```bash
# Via psql
docker-compose exec postgres psql -U postgres -d professor_ia

# Via node test script
node scripts/test-db.js
```

### 3. Make schema changes

1. Update `migrations/init.sql`
2. Drop and recreate tables (dev only):
   ```bash
   docker-compose exec postgres psql -U postgres -d professor_ia
   DROP TABLE IF EXISTS companions CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   \q
   ```
3. Re-run migrations

### 4. Cleanup

```bash
# Stop containers
docker-compose down

# Remove volumes (data loss)
docker-compose down -v
```

## Production Migration Notes

For production deployment:

1. Use managed PostgreSQL service (AWS RDS, GCP Cloud SQL, etc.)
2. Update connection string in environment
3. Run migrations on the remote database
4. Update Docker Compose to remove postgres service
5. Verify Clerk tokens are validated on API routes

## Security Best Practices

1. **Never commit** `.env.local` to version control
2. **Use strong passwords** for production databases
3. **Enable SSL** for database connections in production
4. **Validate all** Clerk tokens on API routes (already implemented)
5. **Restrict database** access to application IP only
6. **Enable** audit logging for compliance

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Docs](https://docs.docker.com/)
- [Clerk Auth Docs](https://clerk.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
