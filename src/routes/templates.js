const express = require('express');
const fs = require('fs').promises; // Dosya tasima icin gerekli
const path = require('path');
const multer = require('multer');
const { buildTemplatePath } = require('../storage');
const authRequired = require('../middleware/authRequired');
const adminOnly = require('../middleware/adminOnly');
const { sendError } = require('../utils/errorCodes');
const { checkAdminPermission, logAdminAction } = require('../utils/roleValidation');
const { pool } = require('../db');

const upload = multer({ dest: 'temp_uploads/' });
const router = express.Router();

// Sablon ekleme - Admin only
router.post('/', authRequired, adminOnly, upload.single('file'), async (req, res) => {

  const { name, description, field_map_json } = req.body;
  
  if (!name || !name.trim()) {
    return sendError(res, 'VALIDATION.MISSING_FIELD', { field: 'name' });
  }
  
  if (!req.file) {
    return sendError(res, 'VALIDATION.MISSING_FILE');
  }

  if (!req.file.mimetype.includes('pdf')) {
    await fs.unlink(req.file.path).catch(() => {});
    return sendError(res, 'FILE.INVALID_TYPE');
  }

  const safeName = name.replace(/\s+/g, '_');
  const filename = `${Date.now()}_${safeName}.pdf`;
  const dest = buildTemplatePath(filename);

  try {
    // Dosyayi tasi
    await fs.rename(req.file.path, dest);

    const fieldMap = field_map_json ? JSON.parse(field_map_json) : [];

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

    logAdminAction(req, 'TEMPLATE_CREATED', { 
      templateId: result.insertId,
      templateName: name
    });

    return res.json({ id: result.insertId, name, file_path: filename });
  } catch (err) {
    const logger = require('../services/logger');
    logger.error('Template insert error', { message: err.message });
    return sendError(res, 'DATABASE.QUERY_ERROR');
  }
});

router.get('/', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM templates ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    const logger = require('../services/logger');
    logger.error('Templates list error', { message: err.message });
    return sendError(res, 'DATABASE.QUERY_ERROR');
  }
});

router.get('/:id', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    const template = rows[0];
    if (!template) return sendError(res, 'RESOURCE.TEMPLATE_NOT_FOUND');
    return res.json(template);
  } catch (err) {
    logger.error('Template get error', { error: err.message, stack: err.stack });
    return sendError(res, 'DATABASE.QUERY_ERROR');
  }
});

// Sablon adını güncelleme - Admin only
router.put('/:id/rename', authRequired, adminOnly, async (req, res) => {
  const { name } = req.body;
  
  if (!name || !name.trim()) {
    return sendError(res, 'VALIDATION.MISSING_FIELD', { field: 'name' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    const template = rows[0];
    if (!template) return sendError(res, 'RESOURCE.TEMPLATE_NOT_FOUND');

    await pool.execute(
      'UPDATE templates SET name = ? WHERE id = ?',
      [name.trim(), req.params.id]
    );

    logAdminAction(req, 'TEMPLATE_RENAMED', { 
      templateId: req.params.id,
      oldName: template.name,
      newName: name
    });

    return res.json({ success: true, id: req.params.id, name });
  } catch (err) {
    logger.error('Template rename error', { error: err.message, templateId: req.params.id });
    return sendError(res, 'DATABASE.QUERY_ERROR');
  }
});

// Sablon alanlarını güncelleme - Admin only
router.put('/:id', authRequired, adminOnly, async (req, res) => {
  const { name, description, field_map_json } = req.body;

  try {
    const [rows] = await pool.execute('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    const template = rows[0];
    if (!template) return sendError(res, 'RESOURCE.TEMPLATE_NOT_FOUND');

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description;
    if (field_map_json) {
      try {
        JSON.parse(field_map_json);
        updateFields.field_map_json = field_map_json;
      } catch {
        return sendError(res, 'VALIDATION.INVALID_JSON');
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return sendError(res, 'VALIDATION.NO_UPDATE_FIELDS');
    }

    const setClause = Object.keys(updateFields).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(updateFields), req.params.id];

    await pool.execute(`UPDATE templates SET ${setClause} WHERE id = ?`, values);

    logAdminAction(req, 'TEMPLATE_UPDATED', { 
      templateId: req.params.id,
      templateName: name || template.name,
      changes: Object.keys(updateFields)
    });

    return res.json({ success: true, id: req.params.id, ...updateFields });
  } catch (err) {
    logger.error('Template update error', { error: err.message, templateId: req.params.id });
    return sendError(res, 'DATABASE.QUERY_ERROR');
  }
});

// Sablon silme - Admin only
router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    const template = rows[0];
    if (!template) return sendError(res, 'RESOURCE.TEMPLATE_NOT_FOUND');

    // Bu şablonu kullanan rapor sayısını kontrol et
    const [reportRows] = await pool.execute(
      'SELECT COUNT(*) as count FROM reports WHERE template_id = ?',
      [req.params.id]
    );
    const reportCount = reportRows[0].count;

    if (reportCount > 0) {
      return sendError(res, 'VALIDATION.TEMPLATE_IN_USE', {
        message: `Bu şablon ${reportCount} rapor tarafından kullanılıyor. Önce bu raporları silin.`,
        reportCount
      });
    }

    // PDF dosyasını sil
    const filePath = buildTemplatePath(template.file_path);
    await fs.unlink(filePath).catch(() => {});

    await pool.execute('DELETE FROM templates WHERE id = ?', [req.params.id]);

    logAdminAction(req, 'TEMPLATE_DELETED', { 
      templateId: req.params.id,
      templateName: template.name,
      fileName: template.file_path
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error('Template delete error', { error: err.message, templateId: req.params.id });
    return sendError(res, 'DATABASE.QUERY_ERROR');
  }
});

module.exports = router;
