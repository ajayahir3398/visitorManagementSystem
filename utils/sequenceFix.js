import prisma from '../lib/prisma.js';

/**
 * Fix PostgreSQL sequence for a given table if out of sync
 * This prevents unique constraint errors on id fields
 *
 * @param {string} tableName - The name of the table (e.g., 'units', 'users')
 * @returns {Promise<void>}
 */
export async function fixSequence(tableName) {
  try {
    await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('${tableName}', 'id'),
        COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1,
        true
      );
    `);
  } catch (seqError) {
    // If sequence fix fails, log but continue (might work anyway)
    console.warn(`⚠️  Warning: Could not fix ${tableName} sequence:`, seqError.message);
  }
}
