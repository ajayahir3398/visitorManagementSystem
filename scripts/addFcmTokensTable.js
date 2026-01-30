import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Connecting to database...');
    
    // Read SQL file
    const sqlPath = join(__dirname, '../prisma/migrations/manual_add_fcm_tokens.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Running migration: Creating FCM tokens table...');
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ FCM tokens table created with all indexes.');
    
    // Verify table exists
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'fcm_tokens'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification: fcm_tokens table exists in database.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.log('ℹ️  Table already exists. This is okay.');
    } else {
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
