// MariaDB baglanti test scripti
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './env' });

async function testConnection() {
  console.log('MariaDB baglanti testi baslatiliyor...\n');
  console.log('Baglanti bilgileri:');
  console.log(`  Host: ${process.env.DB_HOST}`);
  console.log(`  Port: ${process.env.DB_PORT}`);
  console.log(`  User: ${process.env.DB_USER}`);
  console.log(`  Database: ${process.env.DB_NAME}\n`);

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: false
    });

    console.log('✓ Baglanti basarili!\n');

    // Basit bir sorgu test et
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✓ Sorgu testi basarili:', result[0]);
    
    // Veritabani tablolarini kontrol et
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`\n✓ Veritabaninda ${tables.length} tablo bulundu:`);
    tables.forEach(t => {
      const tableName = Object.values(t)[0];
      console.log(`  - ${tableName}`);
    });

    await connection.end();
    console.log('Test tamamlandi.');
    process.exit(0);
  } catch (err) {
    console.error('\n✗ Baglanti hatasi:\n');
    console.error(err.message);
    console.error('\nHata kodu:', err.code);
    
    if (err.code === 'AUTH_SWITCH_PLUGIN_ERROR' || err.message.includes('auth_gssapi_client')) {
      console.error('\n=== COZUM ===');
      console.error('MariaDB kullanici authentication plugin sorunu var.');
      console.error('HeidiSQL\'de su komutlari calistirin:\n');
      console.error('DROP USER IF EXISTS \'proftvv\'@\'localhost\';');
      console.error('CREATE USER \'proftvv\'@\'localhost\' IDENTIFIED BY \'2503\';');
      console.error('ALTER USER \'proftvv\'@\'localhost\' IDENTIFIED VIA mysql_native_password USING PASSWORD(\'2503\');');
      console.error('GRANT ALL PRIVILEGES ON `Report-Mark2`.* TO \'proftvv\'@\'localhost\';');
      console.error('FLUSH PRIVILEGES;');
    }
    
    process.exit(1);
  }
}

testConnection();

