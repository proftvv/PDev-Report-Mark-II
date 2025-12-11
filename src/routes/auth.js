const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanici ve sifre gerekli' });
    }

    // DB'den kullaniciyi bul
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Gecersiz bilgiler' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      console.log('Password mismatch for user:', username);
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
