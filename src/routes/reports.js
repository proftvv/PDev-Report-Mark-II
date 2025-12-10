// v0.0.4
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const authRequired = require('../middleware/authRequired');
const { fillPdfTemplate } = require('../services/pdfService');
const { formatDocNumber } = require('../utils/docNumber');

const router = express.Router();
const REPORTS_FILE = path.join(__dirname, '../../reports.json');
const COUNTERS_FILE = path.join(__dirname, '../../doc-counters.json');

async function getTemplates() {
  try {
    const data = await fs.readFile(path.join(__dirname, '../../templates.json'), 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function getReports() {
  try {
    const data = await fs.readFile(REPORTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveReports(reports) {
  await fs.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2), 'utf8');
}

async function getCounters() {
  try {
    const data = await fs.readFile(COUNTERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function saveCounters(counters) {
  await fs.writeFile(COUNTERS_FILE, JSON.stringify(counters, null, 2), 'utf8');
}

async function reserveDocNumber() {
  const counters = await getCounters();
  const today = new Date().toISOString().split('T')[0];
  counters[today] = (counters[today] || 0) + 1;
  await saveCounters(counters);
  return { date: new Date(today), seq: counters[today] };
}

router.post('/', authRequired, async (req, res) => {
  try {
    const { template_id, customer_id, field_data } = req.body;
    if (!template_id || !field_data) {
      return res.status(400).json({ error: 'template_id ve field_data gerekli' });
    }

    const templates = await getTemplates();
    const template = templates.find(t => t.id === parseInt(template_id));
    if (!template) {
      return res.status(404).json({ error: 'Sablon bulunamadi' });
    }

    const fieldMap = template.field_map_json || [];
    const { date, seq } = await reserveDocNumber();
    const docNumber = formatDocNumber(date, seq);

    const outputName = `${docNumber}.pdf`;
    const pdfPath = await fillPdfTemplate({
      templatePath: template.file_path,
      fieldData: field_data,
      fieldMap,
      docNumber,
      outputName
    });

    const reports = await getReports();
    const newId = reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1;

    reports.push({
      id: newId,
      template_id: parseInt(template_id),
      customer_id: customer_id || null,
      version: 1,
      doc_number: docNumber,
      file_path: pdfPath,
      created_by: req.session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'final',
      filled_json: field_data
    });

    await saveReports(reports);
    return res.json({ id: newId, doc_number: docNumber, file_path: pdfPath });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Rapor olusturulurken hata' });
  }
});

router.get('/', authRequired, async (_req, res) => {
  const reports = await getReports();
  return res.json(reports.map(r => ({
    id: r.id,
    doc_number: r.doc_number,
    template_id: r.template_id,
    customer_id: r.customer_id,
    created_at: r.created_at,
    updated_at: r.updated_at
  })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

router.get('/:id', authRequired, async (req, res) => {
  const reports = await getReports();
  const report = reports.find(r => r.id === parseInt(req.params.id));
  if (!report) return res.status(404).json({ error: 'Rapor bulunamadi' });
  return res.json(report);
});

module.exports = router;

