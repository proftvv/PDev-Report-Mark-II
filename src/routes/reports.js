const express = require('express');
const authRequired = require('../middleware/authRequired');
const adminOnly = require('../middleware/adminOnly');
const { sendError } = require('../utils/errorCodes');
const { logAdminAction } = require('../utils/roleValidation');
const { fillPdfTemplate } = require('../services/pdfService');
const { formatDocNumber } = require('../utils/docNumber');
const { buildTemplatePath } = require('../storage');
const { pool } = require('../db');
const logger = require('../services/logger');

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
    if (!template_id) {
      return sendError(res, 'VALIDATION.MISSING_FIELD', { field: 'template_id' });
    }
    if (!field_data) {
      return sendError(res, 'VALIDATION.MISSING_FIELD', { field: 'field_data' });
    }

    // Sablonu cek
    const [tRows] = await pool.execute('SELECT * FROM templates WHERE id = ?', [template_id]);
    const template = tRows[0];

    if (!template) {
      return sendError(res, 'RESOURCE.TEMPLATE_NOT_FOUND');
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

    // Parse and validate customer_id
    // Frontend sends it as a string, but DB expects INT or NULL
    // IMPORTANT: customer_id has a foreign key constraint to customers.id
    let parsedCustomerId = null;
    if (customer_id && customer_id.trim() !== '') {
      const parsed = parseInt(customer_id, 10);
      if (!isNaN(parsed)) {
        // Check if this customer_id exists in customers table
        const [customerRows] = await pool.execute('SELECT id FROM customers WHERE id = ?', [parsed]);
        if (customerRows.length > 0) {
          parsedCustomerId = parsed;
        } else {
          logger.warn('Customer ID not found in database, setting to NULL', { customerId: parsed });
          // If customer doesn't exist, we set to NULL instead of failing
          // Alternative: You could create the customer automatically, or return an error
        }
      }
      // If it's a non-numeric string, we'll store it as null
    }

    const [result] = await pool.execute(
      `INSERT INTO reports (template_id, customer_id, doc_number, file_path, created_by, status, filled_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        template_id,
        parsedCustomerId,
        docNumber,
        pdfPath,
        req.session.user.id,
        'final',
        JSON.stringify(field_data)
      ]
    );

    return res.json({ id: result.insertId, doc_number: docNumber, file_path: pdfPath });
  } catch (err) {
    logger.error('Report generation error', { error: err.message, stack: err.stack });
    return sendError(res, 'PDF.PROCESSING_ERROR');
  }
});

router.get('/', authRequired, async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    logger.error('Reports fetch error', { error: err.message });
    return sendError(res, 'DATABASE.QUERY_ERROR');
  }
});

router.get('/:id', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return sendError(res, 'RESOURCE.REPORT_NOT_FOUND');
    return res.json(rows[0]);
  } catch (err) {
    logger.error('Report fetch by ID error', { error: err.message, reportId: req.params.id });
    return sendError(res, 'DATABASE.QUERY_ERROR');
  }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  try {

    // Get report to find file path
    const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return sendError(res, 'RESOURCE.REPORT_NOT_FOUND');

    // Delete from DB
    await pool.execute('DELETE FROM reports WHERE id = ?', [req.params.id]);

    logAdminAction(req, 'REPORT_DELETED', { 
      reportId: req.params.id
    });

    return res.json({ success: true });
  } catch (err) {
    logger.error('Report delete error', { error: err.message, reportId: req.params.id });
    return sendError(res, 'DATABASE.QUERY_ERROR');
  }
});

module.exports = router;
