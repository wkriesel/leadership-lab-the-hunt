const fs = require('fs');
const path = require('path');
const pool = require('../db');
require('dotenv').config();

async function runMigrations() {
    try {
        console.log('Running migrations...');

        // Read the migration file
        const migrationPath = path.join(__dirname, '001_create_tables.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await pool.query(migrationSQL);

        console.log('✅ Migrations completed successfully!');

        // Only exit if run directly (not via start:prod chain)
        if (require.main === module) {
            await pool.end();
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
        if (require.main === module) {
            process.exit(1);
        }
        throw error;
    }
}

// Export for programmatic use
module.exports = runMigrations;

// Run if called directly
if (require.main === module) {
    runMigrations();
}
