const mysql = require('mysql2/promise');
const config = require('../src/config');
const fs = require('fs').promises;
const path = require('path');

async function main() {
    console.log('🔄 Initializing Database...');

    // Connect without DB selected to create it
    const connection = await mysql.createConnection({
        host: 'localhost',
        port: config.db.port,
        user: config.db.user,
        password: config.db.password
    });

    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` DEFAULT CHARACTER SET utf8mb4`);
        console.log(`✅ Database ${config.db.database} created/checked.`);

        await connection.query(`USE \`${config.db.database}\``);

        // Read Schema
        const schemaPath = path.join(__dirname, '../sql/schema.sql');
        let schemaSql = await fs.readFile(schemaPath, 'utf8');

        // Remove "CREATE DATABASE" and "USE" lines from schema.sql properly
        schemaSql = schemaSql
            .replace(/CREATE DATABASE.*;/i, '')
            .replace(/USE `.*;/i, '');

        const statements = schemaSql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const stmt of statements) {
            if (stmt.startsWith('--')) continue;
            await connection.query(stmt);
        }

        console.log(`✅ Schema applied (${statements.length} statements).`);

    } catch (err) {
        console.error('❌ Database init failed:', err);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

main();
