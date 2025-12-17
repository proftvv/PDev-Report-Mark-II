const mysql = require('mysql2/promise');
const config = require('./config');
const logger = require('./services/logger');

// Pool'u olustur
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false
});

// Pool baglantisini test et
pool.getConnection()
  .then(connection => {
    logger.info('Database pool connection successful');
    connection.release();
  })
  .catch(err => {
    console.error('✗ Database pool baglanti hatasi:', err.message);
    if (err.code === 'AUTH_SWITCH_PLUGIN_ERROR' || err.message.includes('auth_gssapi_client')) {
      console.error('\nMariaDB kullanici authentication sorunu var.');
      console.error('Lutfen MariaDB servisini yeniden baslatin:\n');
      console.error('  PowerShell (Admin): Restart-Service MariaDB\n');
    }
  });

async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    logger.error('Database query error', { error: err.message, sql: sql });
    throw err;
  }
}

module.exports = {
  pool,
  query
};

