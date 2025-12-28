import 'dotenv/config';
import { Pool } from 'pg';

/**
 * Fix PostgreSQL sequences that are out of sync with actual data
 * This happens when data is inserted manually or sequences get corrupted
 */
async function fixSequences() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Fixing PostgreSQL sequences...\n');

    // List of tables with auto-increment IDs
    const tables = [
      { table: 'units', sequence: 'units_id_seq' },
      { table: 'users', sequence: 'users_id_seq' },
      { table: 'societies', sequence: 'societies_id_seq' },
      { table: 'visitors', sequence: 'visitors_id_seq' },
      { table: 'visitor_logs', sequence: 'visitor_logs_id_seq' },
      { table: 'gates', sequence: 'gates_id_seq' },
      { table: 'approvals', sequence: 'approvals_id_seq' },
      { table: 'unit_members', sequence: 'unit_members_id_seq' },
      { table: 'pre_approved_guests', sequence: 'pre_approved_guests_id_seq' },
      { table: 'audit_logs', sequence: 'audit_logs_id_seq' },
      { table: 'subscription_plans', sequence: 'subscription_plans_id_seq' },
      { table: 'subscriptions', sequence: 'subscriptions_id_seq' },
      { table: 'payments', sequence: 'payments_id_seq' },
      { table: 'invoices', sequence: 'invoices_id_seq' },
      { table: 'roles', sequence: 'roles_id_seq' },
      { table: 'refresh_tokens', sequence: 'refresh_tokens_id_seq' },
      { table: 'otps', sequence: 'otps_id_seq' },
    ];

    for (const { table, sequence } of tables) {
      try {
        // Check if table exists
        const tableCheck = await pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [table]
        );

        if (!tableCheck.rows[0].exists) {
          console.log(`⏭️  ${table}: Skipping (table does not exist)\n`);
          continue;
        }

        // Get the current maximum ID from the table
        const result = await pool.query(
          `SELECT COALESCE(MAX(id), 0) as max_id FROM "${table}"`
        );

        const maxId = parseInt(result.rows[0]?.max_id || 0);
        const nextId = maxId + 1;

        // Check if sequence exists
        const seqCheck = await pool.query(
          `SELECT EXISTS (
            SELECT FROM pg_sequences 
            WHERE schemaname = 'public' 
            AND sequencename = $1
          )`,
          [sequence]
        );

        if (!seqCheck.rows[0].exists) {
          console.log(`⏭️  ${table}: Skipping (sequence ${sequence} does not exist)\n`);
          continue;
        }

        // Reset the sequence to the correct next value
        await pool.query(`SELECT setval('${sequence}', $1, false)`, [nextId]);

        // Verify the sequence value
        const seqResult = await pool.query(
          `SELECT last_value, is_called FROM ${sequence}`
        );

        console.log(`✅ ${table}: Reset sequence to ${nextId} (max_id: ${maxId})`);
        console.log(`   Sequence state: last_value=${seqResult.rows[0].last_value}, is_called=${seqResult.rows[0].is_called}\n`);
      } catch (error) {
        console.error(`❌ ${table}: Error - ${error.message}\n`);
      }
    }

    console.log('✨ Sequence fix completed!');
    await pool.end();
  } catch (error) {
    console.error('❌ Error fixing sequences:', error);
    await pool.end();
    process.exit(1);
  }
}

fixSequences();

