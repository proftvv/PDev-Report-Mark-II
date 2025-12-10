// v0.0.2
import { useEffect, useState, useRef } from 'react';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [status, setStatus] = useState('');
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    fieldMapJson: '[]'
  });
  const [templateFile, setTemplateFile] = useState(null);
  const [templatePreview, setTemplatePreview] = useState(null);
  const [selectedFields, setSelectedFields] = useState([]);
  const [reportForm, setReportForm] = useState({
    templateId: '',
    customerId: '',
    fieldData: {}
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportPreview, setReportPreview] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (templateFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTemplatePreview(e.target.result);
      };
      reader.readAsDataURL(templateFile);
    }
  }, [templateFile]);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplatePreview(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': options.body instanceof FormData ? undefined : 'application/json',
        ...options.headers
      },
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Hata oluştu');
    }
    return res.json();
  }

  async function checkSession() {
    try {
      const data = await apiFetch('/auth/me', { method: 'GET' });
      setUser(data.user);
      await Promise.all([loadTemplates(), loadReports()]);
    } catch {
      setUser(null);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setStatus('Giriş yapılıyor...');
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm)
      });
      setUser(data.user);
      setStatus('Giriş başarılı');
      await Promise.all([loadTemplates(), loadReports()]);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function handleLogout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setTemplates([]);
    setReports([]);
  }

  async function loadTemplates() {
    try {
      const data = await apiFetch('/templates', { method: 'GET' });
      setTemplates(data);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function loadReports() {
    try {
      const data = await apiFetch('/reports', { method: 'GET' });
      setReports(data);
    } catch (err) {
      setStatus(err.message);
    }
  }

  async function loadTemplatePreview(templateId) {
    try {
      const template = await apiFetch(`/templates/${templateId}`, { method: 'GET' });
      setSelectedTemplate(template);
      const fileUrl = `${API_BASE}/files/templates/${template.file_path}`;
      setReportPreview(fileUrl);
      setReportForm(prev => ({
        ...prev,
        fieldData: (template.field_map_json || []).reduce((acc, field) => {
          acc[field.key] = '';
          return acc;
        }, {})
      }));
    } catch (err) {
      setStatus(err.message);
    }
  }

  function handlePdfClick(e, isTemplate = false) {
    if (!isTemplate || user?.username !== 'proftvv') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = rect.height - (e.clientY - rect.top);
    const key = prompt('Alan adı (key):');
    if (key) {
      const newField = {
        key,
        page: 0,
        x: x * (595 / rect.width),
        y: y * (842 / rect.height),
        size: 12
      };
      setSelectedFields([...selectedFields, newField]);
      setTemplateForm(prev => ({
        ...prev,
        fieldMapJson: JSON.stringify([...selectedFields, newField], null, 2)
      }));
    }
  }

  async function handleTemplateUpload(e) {
    e.preventDefault();
    if (user?.username !== 'proftvv') {
      setStatus('Sadece ana hesap şablon ekleyebilir');
      return;
    }
    if (!templateForm.name || templateForm.name.trim() === '') {
      setStatus('Şablon adı gerekli');
      return;
    }
    if (!templateFile) {
      setStatus('PDF şablon dosyası seçin');
      return;
    }
    setStatus('Şablon yükleniyor...');
    try {
      const fd = new FormData();
      fd.append('file', templateFile);
      fd.append('name', templateForm.name.trim());
      fd.append('description', templateForm.description.trim());
      fd.append('field_map_json', templateForm.fieldMapJson);
      const response = await apiFetch('/templates', { method: 'POST', body: fd });
      setStatus(`Şablon eklendi: ${templateForm.name}`);
      setTemplateForm({ name: '', description: '', fieldMapJson: '[]' });
      setTemplateFile(null);
      setTemplatePreview(null);
      setSelectedFields([]);
      await loadTemplates();
    } catch (err) {
      setStatus(`Hata: ${err.message}`);
    }
  }

  function updateFieldData(key, value) {
    setReportForm(prev => ({
      ...prev,
      fieldData: { ...prev.fieldData, [key]: value }
    }));
  }

  async function handleReportCreate(e) {
    e.preventDefault();
    if (!reportForm.templateId) {
      setStatus('Şablon seçin');
      return;
    }
    setStatus('Rapor oluşturuluyor...');
    try {
      const body = {
        template_id: Number(reportForm.templateId),
        customer_id: reportForm.customerId ? Number(reportForm.customerId) : null,
        field_data: reportForm.fieldData
      };
      const data = await apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setStatus(`Rapor oluşturuldu: ${data.doc_number}`);
      await loadReports();
    } catch (err) {
      setStatus(err.message);
    }
  }

  const isAdmin = user?.username === 'proftvv';

  return (
    <div className={`page ${darkMode ? 'dark' : ''}`}>
      <header className="topbar">
        <div>
          <h1>Report Mark II</h1>
          <p className="muted">PDF rapor doldurma ve versiyonlama</p>
        </div>
        <div className="top-actions">
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Açık tema' : 'Karanlık tema'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <span className="muted">API: {API_BASE}</span>
          <span className="muted">v0.1.0</span>
          {user ? (
            <>
              <span className="muted">{user.username}</span>
              <button className="secondary" onClick={handleLogout}>Çıkış</button>
            </>
          ) : null}
        </div>
      </header>

      {!user && (
        <section className="card">
          <h2>Giriş</h2>
          <form className="form-grid" onSubmit={handleLogin}>
            <label>
              Kullanıcı adı
              <input
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                required
              />
            </label>
            <label>
              Şifre
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </label>
            <button type="submit">Giriş yap</button>
          </form>
        </section>
      )}

      {user && (
        <>
          <section className="card">
            <div className="section-head">
              <h2>Şablonlar</h2>
              <button onClick={loadTemplates} className="secondary">Yenile</button>
            </div>
            <div className="list">
              {templates.length === 0 && <div className="muted">Şablon yok</div>}
              {templates.map((t) => (
                <div key={t.id} className="list-item">
                  <div>
                    <strong>{t.name}</strong>
                    <div className="muted">{t.description}</div>
                  </div>
                  <div className="muted">#{t.id}</div>
                </div>
              ))}
            </div>
            {isAdmin && (
              <details className="accordion">
                <summary>Şablon ekle (sadece proftvv)</summary>
                <form className="form-grid" onSubmit={handleTemplateUpload}>
                  <label>
                    Ad
                    <input
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Açıklama
                    <input
                      value={templateForm.description}
                      onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    />
                  </label>
                  <label>
                    PDF Şablon
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                      required
                    />
                  </label>
                  {templatePreview && (
                    <div className="pdf-preview-container">
                      <h3>PDF Önizleme - Tıklayarak alan ekleyin</h3>
                      <div
                        className="pdf-preview"
                        onClick={(e) => handlePdfClick(e, true)}
                        title="Tıklayarak alan ekleyin"
                        style={{
                          backgroundImage: `url(${templatePreview})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          cursor: isAdmin ? 'crosshair' : 'default'
                        }}
                      />
                      <div className="field-list">
                        <h4>Seçilen Alanlar:</h4>
                        {selectedFields.map((field, idx) => (
                          <div key={idx} className="field-item">
                            <strong>{field.key}</strong> - x: {field.x.toFixed(0)}, y: {field.y.toFixed(0)}
                            <button
                              type="button"
                              onClick={() => {
                                const newFields = selectedFields.filter((_, i) => i !== idx);
                                setSelectedFields(newFields);
                                setTemplateForm(prev => ({
                                  ...prev,
                                  fieldMapJson: JSON.stringify(newFields, null, 2)
                                }));
                              }}
                            >
                              Sil
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <label>
                    field_map_json (otomatik doldurulur)
                    <textarea
                      rows={6}
                      value={templateForm.fieldMapJson}
                      onChange={(e) => setTemplateForm({ ...templateForm, fieldMapJson: e.target.value })}
                    />
                  </label>
                  <button type="submit">Şablonu kaydet</button>
                </form>
              </details>
            )}
          </section>

          <section className="card">
            <div className="section-head">
              <h2>Rapor oluştur</h2>
              <button onClick={loadReports} className="secondary">Listeyi yenile</button>
            </div>
            <form className="form-grid" onSubmit={handleReportCreate}>
              <label>
                Şablon
                <select
                  value={reportForm.templateId}
                  onChange={(e) => {
                    const templateId = e.target.value;
                    setReportForm({ ...reportForm, templateId, fieldData: {} });
                    if (templateId) {
                      loadTemplatePreview(parseInt(templateId));
                    } else {
                      setSelectedTemplate(null);
                      setReportPreview(null);
                    }
                  }}
                  required
                >
                  <option value="">Seçin</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Müşteri ID (opsiyonel)
                <input
                  value={reportForm.customerId}
                  onChange={(e) => setReportForm({ ...reportForm, customerId: e.target.value })}
                />
              </label>
              {selectedTemplate && reportPreview && (
                <div className="pdf-preview-container">
                  <h3>PDF Önizleme - Alanları doldurun</h3>
                  <div
                    className="pdf-preview"
                    style={{
                      backgroundImage: `url(${reportPreview})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      minHeight: '600px'
                    }}
                  />
                  <div className="field-form">
                    <h4>Alanları Doldur:</h4>
                    {selectedTemplate.field_map_json.map((field) => (
                      <label key={field.key}>
                        {field.key}
                        <input
                          type="text"
                          value={reportForm.fieldData[field.key] || ''}
                          onChange={(e) => updateFieldData(field.key, e.target.value)}
                          placeholder={`${field.key} değerini girin`}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit">Rapor üret</button>
            </form>

            <div className="list">
              {reports.length === 0 && <div className="muted">Rapor yok</div>}
              {reports.map((r) => (
                <div key={r.id} className="list-item">
                  <div>
                    <strong>{r.doc_number}</strong>
                    <div className="muted">Template #{r.template_id} | Customer {r.customer_id || '-'}</div>
                  </div>
                  <a className="secondary" href={`${API_BASE}/files/generated/${r.doc_number}.pdf`} target="_blank" rel="noreferrer">PDF</a>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {status && <div className="status">{status}</div>}
    </div>
  );
}

export default App;
