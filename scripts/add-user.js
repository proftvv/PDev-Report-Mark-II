// Kullanici ekleme scripti
// Kullanim: node add-user.js <kullanici_adi> <sifre>

const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');

async function addUser(username, password) {
  try {
    // Mevcut kullanicilari oku
    let users = [];
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      users = JSON.parse(data);
    } catch {
      // Dosya yoksa bos array
    }

    // Kullanici adi kontrolu
    if (users.find(u => u.username === username)) {
      console.error(`HATA: '${username}' kullanici adi zaten mevcut!`);
      process.exit(1);
    }

    // Sifre hash'le
    const password_hash = await bcrypt.hash(password, 10);

    // Yeni kullanici ekle
    const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    users.push({
      id: newId,
      username,
      password_hash
    });

    // Dosyaya yaz
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    console.log(`✓ Kullanici '${username}' basariyla eklendi!`);
  } catch (err) {
    console.error('HATA:', err.message);
    process.exit(1);
  }
}

// Komut satiri argumanlari
const [,, username, password] = process.argv;

if (!username || !password) {
  console.log('Kullanim: node add-user.js <kullanici_adi> <sifre>');
  console.log('Ornek: node add-user.js admin 123456');
  process.exit(1);
}

addUser(username, password);

