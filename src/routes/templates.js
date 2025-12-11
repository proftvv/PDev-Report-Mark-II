const express = require('express');
const fs = require('fs').promises; // Dosya tasima icin gerekli
const path = require('path');
const multer = require('multer');
const { buildTemplatePath } = require('../storage');
const authRequired = require('../middleware/authRequired');
const { pool } = require('../db');

const upload = multer({ dest: 'temp_uploads/' });
const router = express.Router();

// Sablon ekleme - sadece proftvv kullanıcısı (veya admin)
router.post('/', authRequired, upload.single('file'), async (req, res) => {
  // TODO: Rol kontrolunu DB uzerinden yapmak daha iyi olur ama su anlik username check yeterli
  if (req.session.user.username !== 'proftvv' && req.session.user.username !== 'admin') {
    return res.status(403).json({ error: 'Sadece yetkili hesap şablon ekleyebilir' });
  }

  const { name, description, field_map_json } = req.body;
  if (!name || !req.file) {
    return res.status(400).json({ error: 'Isim ve PDF gerekli' });
  }

  const safeName = name.replace(/\s+/g, '_');
  const filename = `${Date.now()}_${safeName}.pdf`;
  const dest = buildTemplatePath(filename);

  // Dosyayi tasi
  await fs.rename(req.file.path, dest);

  const fieldMap = field_map_json ? JSON.parse(field_map_json) : [];

  try {
    const [result] = await pool.execute(
      `INSERT INTO templates (name, description, file_path, field_map_json, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        description || '',
        filename,
        JSON.stringify(fieldMap),
        req.session.user.id
      ]
    );

    return res.json({ id: result.insertId, name, file_path: filename });
  } catch (err) {
    console.error('Template insert error:', err);
    return res.status(500).json({ error: 'Veritabanina kaydedilemedi' });
  }
});

router.get('/', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM templates ORDER BY created_at DESC');
    // Field map JSON olarak geliyor mysql2 ile (eger JSON column ise object doner mi? mysql2 doner)
    // Ama degilse parsing gerekebilir.
    return res.json(rows);
  } catch (err) {
    console.error('Templates list error:', err);
    return res.status(500).json({ error: 'Sablonlar alinamadi' });
  }
});

router.get('/:id', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    const template = rows[0];
    if (!template) return res.status(404).json({ error: 'Sablon bulunamadi' });
    return res.json(template);
  } catch (err) {
    console.error('Template get error:', err);
    return res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

module.exports = router;
