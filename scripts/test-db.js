#!/usr/bin/env node

/**
 * Database initialization and connection test for PostgreSQL
 * This script validates that the database is properly set up and accessible
 */

const { Pool } = require('pg');

// Get connection details from environment
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'professor_ia',
});

const testDatabaseConnection = async () => {
  console.log('🔧 Testing PostgreSQL Database Connection...\n');
  console.log(`📍 Connection Details:`);
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'professor_ia'}`);
  console.log(`   User: ${process.env.DB_USER || 'postgres'}\n`);

  try {
    // Test basic connection
    console.log('⏳ Attempting to connect...');
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Connection successful!\n');

    // Check if tables exist
    console.log('📊 Checking database schema...');
    const companionsTable = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'companions'
      )`
    );

    const usersTable = await pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
      )`
    );

    if (companionsTable.rows[0].exists) {
      console.log('✅ companions table exists');
    } else {
      console.log('❌ companions table NOT found - running migrations...');
    }

    if (usersTable.rows[0].exists) {
      console.log('✅ users table exists\n');
    } else {
      console.log('⚠️  users table NOT found\n');
    }

    // Get table counts
    const companionCount = await pool.query('SELECT COUNT(*) as count FROM companions');
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users');

    console.log('📈 Data Summary:');
    console.log(`   Companions: ${companionCount.rows[0].count} records`);
    console.log(`   Users: ${userCount.rows[0].count} records\n`);

    console.log('🎉 Database is Ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message, '\n');
    console.error('Troubleshooting:');
    console.error('1. Ensure Docker container is running: docker-compose ps');
    console.error('2. Check logs: docker-compose logs postgres');
    console.error('3. Verify .env.local has correct credentials\n');
    process.exit(1);
  }
};

// Run the test
testDatabaseConnection().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
