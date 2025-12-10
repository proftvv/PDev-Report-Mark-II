// v0.0.4
const express = require('express');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const USERS_FILE = path.join(__dirname, '../../users.json');

// Kullanici dosyasini oku
async function getUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Kullanici dosyasi okuma hatasi:', err);
    return [];
  }
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanici ve sifre gerekli' });
    }
    
    const users = await getUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
      return res.status(401).json({ error: 'Gecersiz bilgiler' });
    }
    
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Gecersiz bilgiler' });
    }
    
    req.session.user = { id: user.id, username: user.username };
    return res.json({ user: req.session.user });
  } catch (err) {
    console.error('Login hatasi:', err);
    return res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Oturum yok' });
  }
  return res.json({ user: req.session.user });
});

module.exports = router;

