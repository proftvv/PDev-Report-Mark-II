const { pool } = require('./src/db');
const bcrypt = require('bcryptjs');

async function debugLogin() {
    console.log('--- DEBUG LOGIN START ---');
    try {
        console.log('Testing DB Connection...');
        const [rows] = await pool.execute('SELECT * FROM users');
        console.log(`Found ${rows.length} users.`);

        for (const user of rows) {
            console.log(`User: ${user.username}, Hash: ${user.password_hash}`);
        }

        // Test specific user 'proftvv'
        const [u] = await pool.execute('SELECT * FROM users WHERE username = ?', ['proftvv']);
        if (u.length > 0) {
            console.log('User proftvv found.');
            // Test password check (assuming 'proftvv' is password)
            // You can change this to whatever the expected password is
            const ok = await bcrypt.compare('proftvv', u[0].password_hash);
            console.log(`Password 'proftvv' valid? ${ok}`);
        } else {
            console.log('User proftvv NOT found.');
        }

    } catch (err) {
        console.error('CRITICAL ERROR:', err);
    }
    console.log('--- DEBUG LOGIN END ---');
    process.exit();
}

debugLogin();
