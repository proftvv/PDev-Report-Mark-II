// v0.0.3
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const { buildTemplatePath } = require('../storage');
const authRequired = require('../middleware/authRequired');

const upload = multer({ dest: 'temp_uploads/' });
const router = express.Router();
const TEMPLATES_FILE = path.join(__dirname, '../../templates.json');

async function getTemplates() {
  try {
    const data = await fs.readFile(TEMPLATES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTemplates(templates) {
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf8');
}

// Sablon ekleme - sadece proftvv kullanıcısı
router.post('/', authRequired, upload.single('file'), async (req, res) => {
  if (req.session.user.username !== 'proftvv') {
    return res.status(403).json({ error: 'Sadece ana hesap şablon ekleyebilir' });
  }

  const { name, description, field_map_json } = req.body;
  if (!name || !req.file) {
    return res.status(400).json({ error: 'Isim ve PDF gerekli' });
  }

  const templates = await getTemplates();
  const safeName = name.replace(/\s+/g, '_');
  const filename = `${Date.now()}_${safeName}.pdf`;
  const dest = buildTemplatePath(filename);
  
  await fs.rename(req.file.path, dest);

  const fieldMap = field_map_json ? JSON.parse(field_map_json) : [];
  const newId = templates.length > 0 ? Math.max(...templates.map(t => t.id)) + 1 : 1;

  // Frontend'de doğru URL'i oluştursun diye sadece filename kaydet
  templates.push({
    id: newId,
    name,
    description: description || '',
    file_path: filename,
    field_map_json: fieldMap,
    created_by: req.session.user.id,
    created_at: new Date().toISOString()
  });

  await saveTemplates(templates);
  return res.json({ id: newId, name, file_path: dest });
});

router.get('/', authRequired, async (_req, res) => {
  const templates = await getTemplates();
  return res.json(templates.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    file_path: t.file_path,
    created_at: t.created_at
  })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
});

router.get('/:id', authRequired, async (req, res) => {
  const templates = await getTemplates();
  const template = templates.find(t => t.id === parseInt(req.params.id));
  if (!template) return res.status(404).json({ error: 'Sablon bulunamadi' });
  return res.json(template);
});

module.exports = router;

