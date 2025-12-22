// Database connection - Auto-detect PostgreSQL (Neon) or MySQL
const config = require('./config');
const logger = require('./services/logger');

// Check if PostgreSQL (Neon) should be used
const usePostgres = process.env.DATABASE_URL || 
                    process.env.VERCEL || 
                    (config.db?.host && config.db.host.includes('neon.tech'));

console.log('[DB] Initializing database', {
  usePostgres,
  hasDbUrl: !!process.env.DATABASE_URL,
  isVercel: !!process.env.VERCEL
});

let pool;

if (usePostgres) {
  // Use PostgreSQL
  console.log('[DB] Using PostgreSQL (Neon)');
  logger.info('Using PostgreSQL (Neon) database');
  
  const { Pool } = require('pg');
  
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=require`;

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // MySQL-compatible wrapper for both query and execute
  const originalPool = pool;
  
  // Wrap query method
  const originalQuery = originalPool.query.bind(originalPool);
  pool.query = async function(sql, params = []) {
    console.log('[DB] PostgreSQL query called:', { sql: sql.substring(0, 50), paramsCount: params?.length || 0 });
    
    try {
      const result = await originalQuery(sql, params);
      console.log('[DB] Query result:', { rowCount: result.rows?.length || 0 });
      // Return MySQL-compatible format: [rows, fields]
      return [result.rows, result.fields];
    } catch (err) {
      console.error('[DB] Query error:', err.message);
      throw err;
    }
  };
  
  // Wrap execute method
  pool.execute = async function(sql, params = []) {
    console.log('[DB] PostgreSQL execute called:', { sql: sql.substring(0, 50), paramsCount: params.length });
    
    // Convert ? placeholders to $1, $2, etc.
    let paramIndex = 1;
    const pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
    
    try {
      const result = await originalQuery(pgSql, params);
      console.log('[DB] Execute result:', { rowCount: result.rows?.length || 0 });
      // Return MySQL-compatible format: [rows, fields]
      return [result.rows, result.fields];
    } catch (err) {
      console.error('[DB] Execute error:', err.message);
      throw err;
    }
  };

  pool.on('connect', () => {
    console.log('[DB] PostgreSQL connected');
    logger.info('PostgreSQL connection established');
  });

  pool.on('error', (err) => {
    console.error('[DB] PostgreSQL error:', err.message);
    logger.error('PostgreSQL pool error', { error: err.message });
  });

} else {
  // Use MySQL
  console.log('[DB] Using MySQL');
  logger.info('Using MySQL database');
  
  const mysql = require('mysql2/promise');

  pool = mysql.createPool({
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

  pool.getConnection()
    .then(connection => {
      console.log('[DB] MySQL connected');
      logger.info('MySQL connection pool successful');
      connection.release();
    })
    .catch(err => {
      console.error('[DB] MySQL error:', err.message);
      logger.error('MySQL connection error', { error: err.message });
    });
}

async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    logger.error('Database query error', { error: err.message, sql: sql });
    throw err;
  }
}

console.log('[DB] Database module initialized, pool:', !!pool);

module.exports = {
  pool,
  query
};
