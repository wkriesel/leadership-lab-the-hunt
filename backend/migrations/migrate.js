const fs = require('fs');
const path = require('path');
const pool = require('../db');
require('dotenv').config();

async function runMigrations() {
    try {
        console.log('Running migrations...');

        // Run all migration files in order
        const migrationFiles = fs.readdirSync(__dirname)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of migrationFiles) {
            console.log(`  Running ${file}...`);
            const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
            await pool.query(sql);
        }

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
