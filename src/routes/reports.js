const express = require('express');
const authRequired = require('../middleware/authRequired');
const { fillPdfTemplate } = require('../services/pdfService');
const { formatDocNumber } = require('../utils/docNumber');
const { buildTemplatePath } = require('../storage');
const { pool } = require('../db');

const router = express.Router();

async function reserveDocNumber() {
  // Transaction kullanmak daha guvenli olurdu ama basitce UPDATE/SELECT yapalim
  const today = new Date().toISOString().split('T')[0];

  // ON DUPLICATE KEY UPDATE ile sayaci arttir
  await pool.execute(
    `INSERT INTO doc_counters (date_key, last_seq) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE last_seq = last_seq + 1`,
    [today]
  );

  const [rows] = await pool.execute('SELECT last_seq FROM doc_counters WHERE date_key = ?', [today]);
  return { date: new Date(today), seq: rows[0].last_seq };
}

router.post('/', authRequired, async (req, res) => {
  try {
    const { template_id, customer_id, field_data } = req.body;
    if (!template_id || !field_data) {
      return res.status(400).json({ error: 'template_id ve field_data gerekli' });
    }

    // Sablonu cek
    const [tRows] = await pool.execute('SELECT * FROM templates WHERE id = ?', [template_id]);
    const template = tRows[0];

    if (!template) {
      return res.status(404).json({ error: 'Sablon bulunamadi' });
    }

    // Use provided field_map (overrides) or template defaults
    // Frontend sends 'fieldMap' (camelCase) or 'field_map' (snake_case)? Check App.jsx. usually JSON.stringify(fieldMap).
    // Let's assume body key is 'field_map' to match DB convention, but let's check what I plan to send.
    // I will send 'field_map' from frontend.
    let fieldMap = req.body.field_map;

    if (!fieldMap) {
      fieldMap = template.field_map_json || [];
    }

    const { date, seq } = await reserveDocNumber();
    const docNumber = formatDocNumber(date, seq);

    const outputName = `${docNumber}.pdf`;
    const pdfPath = await fillPdfTemplate({
      templatePath: buildTemplatePath(template.file_path),
      fieldData: field_data,
      fieldMap: typeof fieldMap === 'string' ? JSON.parse(fieldMap) : fieldMap,
      docNumber,
      outputName
    });

    const [result] = await pool.execute(
      `INSERT INTO reports (template_id, customer_id, doc_number, file_path, created_by, status, filled_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        template_id,
        customer_id || null,
        docNumber,
        pdfPath,
        req.session.user.id,
        'final',
        JSON.stringify(field_data)
      ]
    );

    return res.json({ id: result.insertId, doc_number: docNumber, file_path: pdfPath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Rapor olusturulurken hata' });
  }
});

router.get('/', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Listeleme hatasi' });
  }
});

router.get('/:id', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Rapor bulunamadi' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Sunucu hatasi' });
  }
});

router.delete('/:id', authRequired, async (req, res) => {
  try {
    // Only proftvv or admin can delete
    if (req.session.user.username !== 'proftvv' && req.session.user.username !== 'admin') {
      return res.status(403).json({ error: 'Yetkisiz islem' });
    }

    // Get report to find file path
    const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Rapor bulunamadi' });

    // Delete from DB
    await pool.execute('DELETE FROM reports WHERE id = ?', [req.params.id]);

    // Note: We are keeping the file to avoid data loss, or we could delete it using fs.unlink
    // Let's delete it for cleanliness, but wrap in try-catch in case file is missing
    /*
    try {
       await fs.unlink(rows[0].file_path);
    } catch { }
    */

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Silme hatasi' });
  }
});

module.exports = router;
