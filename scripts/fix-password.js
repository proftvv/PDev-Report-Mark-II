const { pool } = require('./src/db');

async function fixPassword() {
    // Generate new hash for '2503'
    const newHash = '$2a$10$AvfICVsIEj2tFbhXcAbR.O8txF7bRMGwIf0BBw0mDco29eHNELCqHC';
    try {
        const [res] = await pool.execute('UPDATE users SET password_hash = ? WHERE username = ?', [newHash, 'proftvv']);
        console.log('Password update result:', res);

        if (res.affectedRows > 0) {
            console.log('SUCCESS: Password for proftvv reset to "2503"');
        } else {
            console.log('WARNING: User proftvv not found?');
        }
    } catch (err) {
        console.error('Update failed:', err);
    }
    process.exit();
}

fixPassword();
