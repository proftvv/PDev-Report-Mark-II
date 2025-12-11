const { pool } = require('./src/db');

async function fixPassword() {
    const newHash = '$2a$10$zXFFXO0JeSiRI70NGye18uuhesQLl3j1L4Tuupcj2hFbskJt20bXRy'; // 'proftvv'
    try {
        const [res] = await pool.execute('UPDATE users SET password_hash = ? WHERE username = ?', [newHash, 'proftvv']);
        console.log('Password update result:', res);

        if (res.affectedRows > 0) {
            console.log('SUCCESS: Password for proftvv reset to "proftvv"');
        } else {
            console.log('WARNING: User proftvv not found?');
        }
    } catch (err) {
        console.error('Update failed:', err);
    }
    process.exit();
}

fixPassword();
