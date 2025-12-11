const { pool } = require('./src/db');
const fs = require('fs');
const path = require('path');
const config = require('./src/config');

async function debug() {
    console.log('--- DEBUG START ---');
    console.log('Storage Root:', config.storageRoot);
    console.log('Templates Dir:', config.paths.templates);

    try {
        const [rows] = await pool.query('SELECT id, name, file_path FROM templates');
        console.log('\nDB Templates:');

        for (const t of rows) {
            console.log(`[ID: ${t.id}] Name: ${t.name}`);
            console.log(`  DB file_path: ${t.file_path}`);

            const expectedPath = path.join(config.paths.templates, path.basename(t.file_path));
            const exists = fs.existsSync(expectedPath);
            console.log(`  Expected Disk Path: ${expectedPath}`);
            console.log(`  Exists on Disk? ${exists ? 'YES' : 'NO'}`);

            const isAbsolute = path.isAbsolute(t.file_path);
            console.log(`  Is DB path absolute? ${isAbsolute ? 'YES' : 'NO'}`);

            if (isAbsolute) {
                console.log('  (!) WARNING: DB path is absolute. Frontend requires relative filename for static serving.');
            }
        }
    } catch (err) {
        console.error('DB Error:', err);
    }
    console.log('--- DEBUG END ---');
    process.exit();
}

debug();
