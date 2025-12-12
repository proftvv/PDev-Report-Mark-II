import React, { useEffect, useState, useRef } from 'react';
import PDFCanvas from './components/PDFCanvas';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
    // Also log to our global log if possible, but here console is enough for now
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: '#ff4444', background: '#1e1e1e', height: '100vh' }}>
          <h2>Uygulama Hatası (Render Crash)</h2>
          <pre style={{ background: '#333', padding: '10px', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <details style={{ marginTop: '10px' }}>
            <summary>Stack Trace</summary>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </details>
          <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px' }}>
            Sayfayı Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [status, setStatus] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 }); // Indicator icin
  const [templates, setTemplates] = useState([]);
  const [reports, setReports] = useState([]);
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
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
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'archive', 'templates'
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filteredReports, setFilteredReports] = useState([]);
  const [lastCreatedReport, setLastCreatedReport] = useState(null);

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

  async function apiFetch(path, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers,
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // E-GEN-001: Genuine API Error
      throw new Error(err.error || `[S-001] Sunucu hatası (${res.status})`);
    }
    return res.json();
  }

  function getError(code, message) {
    return `[${code}] ${message}`;
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

  function renderFieldDots(fields, values = {}) {
    return (fields || []).filter(f => f && typeof f.x === 'number').map((field, idx) => {
      // field.x/y are in PDF coordinates (bottom-left origin)
      // We need to convert to % for CSS (top-left origin)
      // CSS Left = (field.x / 595) * 100
      // CSS Bottom = (field.y / 842) * 100 
      // If it has w/h, render as box. Else render as dot (legacy support).

      const style = {
        left: `${(field.x / 595) * 100}%`,
        bottom: `${(field.y / 842) * 100}%`
      };

      if (field.w && field.h) {
        style.width = `${(field.w / 595) * 100}%`;
        style.height = `${(field.h / 842) * 100}%`;
      }

      const value = values[field.key];
      const hasValue = value !== undefined && value !== '';

      // Approximate pt to px conversion for preview (1pt = 1.33px)
      // We also need to consider the scaling if the container is responsive, but for now let's assume 100% width.
      // Since the box uses %, its size changes. Text size is fixed in px. 
      // This might look different on small screens vs big screens. 
      // Ideally text size should be viewport relative (vw) or scaled. 
      // For simplicity, let's just render it as px.
      const fontSize = (field.fontSize || 11);
      const fontWeight = field.fontWeight || 'normal';
      const fontStyle = field.fontStyle || 'normal';
      const fontFamily = field.fontFamily || 'Helvetica';
      const color = field.color || '#000000';
      const textAlign = field.textAlign || 'left';

      let justifyContent = 'flex-start';
      if (textAlign === 'center') justifyContent = 'center';
      if (textAlign === 'right') justifyContent = 'flex-end';

      return (
        <div
          key={`${field.key}-${idx}`}
          className={field.w ? "field-box" : "field-dot"}
          style={{
            ...style,
            fontSize: `${fontSize}px`,
            fontWeight,
            fontStyle,
            fontFamily, // Browser fonts map well to PDF fonts names usually
            color,
            justifyContent,
            textAlign // for multi-line text if wrapped, though we use pre-wrap
          }}
          title={`${field.key}`}
        >
          {field.w ? (
            hasValue ? <span style={{ width: '100%' }}>{value}</span> : <span className="field-label">{field.key}</span>
          ) : (
            <span className="field-label">{field.key}</span>
          )}
        </div>
      );
    });
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
      setStatus(`[L-001] ${err.message}`);
    }
  }

  async function handleLogout() {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => { });
    setUser(null);
    setTemplates([]);
    setReports([]);
  }

  async function loadTemplates() {
    try {
      const data = await apiFetch('/templates', { method: 'GET' });
      setTemplates(data);
    } catch (err) {
      setStatus(`[T-001] ${err.message}`);
    }
  }

  async function loadReports() {
    try {
      const data = await apiFetch('/reports', { method: 'GET' });
      setReports(data);
      setFilteredReports(data); // Initialize filtered reports
    } catch (err) {
      setStatus(`[R-001] ${err.message}`);
    }
  }

  // Filter reports based on search query and date range
  useEffect(() => {
    let filtered = [...reports];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report =>
        report.doc_number?.toLowerCase().includes(query) ||
        String(report.customer_id || '').toLowerCase().includes(query) ||
        String(report.template_id || '').toLowerCase().includes(query)
      );
    }

    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at).toISOString().split('T')[0];
        return reportDate >= dateRange.start;
      });
    }

    if (dateRange.end) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.created_at).toISOString().split('T')[0];
        return reportDate <= dateRange.end;
      });
    }

    setFilteredReports(filtered);
  }, [reports, searchQuery, dateRange]);

  function clearFilters() {
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
  }

  async function loadTemplatePreview(templateId) {
    try {
      const template = await apiFetch(`/templates/${templateId}`, { method: 'GET' });

      let fieldMap = template.field_map_json;
      if (typeof fieldMap === 'string') {
        try { fieldMap = JSON.parse(fieldMap); } catch (e) {
          fieldMap = [];
        }
      }
      if (!Array.isArray(fieldMap)) {
        fieldMap = [];
      }

      // Update template object with parsed map to prevent render errors
      template.field_map_json = fieldMap;
      setSelectedTemplate(template);

      const fileUrl = `${API_BASE}/files/templates/${template.file_path}`;
      setReportPreview(fileUrl);

      setReportForm(prev => ({
        ...prev,
        fieldData: fieldMap.reduce((acc, field) => {
          acc[field.key] = '';
          return acc;
        }, {})
      }));
    } catch (err) {
      setStatus(err.message);
    }
  }

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);

  function handleMouseDown(e) {
    if (!user?.username === 'proftvv') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDragging(true);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
  }

  function handleMouseMove(e) {
    if (!user?.username === 'proftvv') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (isDragging) {
      setDragCurrent({ x, y });
    }
  }

  function handleMouseUp(e) {
    if (!isDragging || !dragStart) return;
    setIsDragging(false);

    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Calculate box dimensions relative to PDF 595x842 coordinate system
    // Using Math.min to ensure x/y are top-left
    const rawX = Math.min(dragStart.x, currentX);
    const rawY = Math.min(dragStart.y, currentY);
    const rawW = Math.abs(currentX - dragStart.x);
    const rawH = Math.abs(currentY - dragStart.y);

    // Convert to PDF coordinates (PDF origin is usually bottom-left, but for simple overlay we often use top-left if the viewer matches. 
    // However, pdf-lib usually uses bottom-left origin. 
    // Let's assume standard PDF coordinates: x=left, y=bottom.
    // The previous logic used `rect.height - (e.clientY - rect.top)` which implies bottom-up Y.
    // If we want to draw a box, we need (x, y, w, h). 
    // Let's store normalized values and handle rendering/pdf-generation accordingly.

    // PDF Y is from bottom. So Top-Left of screen box is:
    // Screen Y (from top) = rawY
    // PDF Y (from bottom) = rect.height - rawY
    // But since it's a box, we usually define it by bottom-left corner or top-left. 
    // Let's stick to the previous point logic: x, y, size.
    // BUT user complained about visual mismatch. 
    // Let's save the BOX definition: x (left), y (bottom), w, h.

    // PDF Coordinate (Bottom-Left of the box):
    // x = rawX
    // y = rect.height - (rawY + rawH) 

    const scaleX = 595 / rect.width;
    const scaleY = 842 / rect.height;

    const x = rawX * scaleX;
    // PDF Y (bottom-left)
    const y = (rect.height - (rawY + rawH)) * scaleY;
    const w = rawW * scaleX;
    const h = rawH * scaleY;

    // Don't allow tiny boxes
    if (w < 5 || h < 5) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const key = prompt('Alan adı (key):');
    if (key) {
      const newField = {
        key,
        page: 0,
        x, // Bottom-left X
        y, // Bottom-left Y
        w, // Width
        h, // Height
        type: 'box'
      };
      setSelectedFields([...selectedFields, newField]);
      setTemplateForm(prev => ({
        ...prev,
        fieldMapJson: JSON.stringify([...selectedFields, newField], null, 2)
      }));
    }
    setDragStart(null);
    setDragCurrent(null);
  }

  function removeField(idx) {
    const newFields = selectedFields.filter((_, i) => i !== idx);
    setSelectedFields(newFields);
    setTemplateForm(prev => ({
      ...prev,
      fieldMapJson: JSON.stringify(newFields, null, 2)
    }));
  }

  const [reportFieldMap, setReportFieldMap] = useState([]);

  useEffect(() => {
    // When selectedTemplate changes, initialize reportFieldMap
    if (selectedTemplate && selectedTemplate.field_map_json) {
      try {
        let fields = typeof selectedTemplate.field_map_json === 'string'
          ? JSON.parse(selectedTemplate.field_map_json)
          : selectedTemplate.field_map_json;
        if (!Array.isArray(fields)) fields = [];
        // Filter out invalid fields
        fields = fields.filter(f => f && typeof f === 'object' && typeof f.x === 'number' && typeof f.y === 'number');
        setReportFieldMap(fields);
      } catch (e) {
        setReportFieldMap([]);
      }
    } else {
      setReportFieldMap([]);
    }
  }, [selectedTemplate]);

  // Temizle
  const clearSelection = () => {
    setStartPos(null);
    setCurrentPos(null);
  };

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
    setLastCreatedReport(null); // Reset previous
    try {
      const data = await apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          customer_id: reportForm.customerId || null,
          field_data: reportForm.fieldData,
          field_map: JSON.stringify(reportFieldMap) // Send overrides
        })
      });
      setStatus(`Rapor oluşturuldu: ${data.doc_number}`);
      setLastCreatedReport(data); // Store created report for success message
      await loadReports();
    } catch (err) {
      setStatus(`[R-002] ${err.message}`);
    }
  }

  async function handleDeleteReport(id) {
    if (!confirm('Bu raporu silmek istediginizden emin misiniz?')) return;
    try {
      await apiFetch(`/reports/${id}`, { method: 'DELETE' });
      setStatus('Rapor silindi');
      await loadReports();
    } catch (err) {
      setStatus(err.message);
    }
  }

  const isAdmin = user?.username === 'proftvv';

  return (
    <ErrorBoundary>
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
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.2' }}>
              <span className="muted">v1.3.0</span>
              <span className="muted" style={{ fontSize: '10px', color: '#2563eb' }}>Developed by Proftvv</span>
            </div>
            {user ? (
              <>
                <span className="muted">{user.username}</span>
                <button className="secondary" onClick={handleLogout}>Çıkış</button>
              </>
            ) : null}
          </div>
        </header>
        {/* Tab Navigation */}
        {user && (
          <div style={{
            display: 'flex',
            gap: '10px',
            padding: '10px 20px',
            background: 'var(--card-bg)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <button
              className={activeTab === 'dashboard' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('dashboard')}
            >
              Ana Sayfa
            </button>
            <button
              className={activeTab === 'archive' ? 'primary' : 'secondary'}
              onClick={() => setActiveTab('archive')}
            >
              Arşiv
            </button>
            {isAdmin && (
              <button
                className={activeTab === 'templates' ? 'primary' : 'secondary'}
                onClick={() => setActiveTab('templates')}
              >
                Şablonlar
              </button>
            )}
          </div>
        )}
        {!user && (
          <section className="card">
            <h2>Giriş</h2>
            <form className="form-grid" onSubmit={handleLogin}>
              <label>
                Kullanıcı Adı veya ID
                <input
                  value={loginForm.identifier}
                  onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                  required
                  placeholder="Kullanıcı adı veya ID giriniz"
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
                        <h3>PDF önizleme - Tıklayarak alan ekleyin</h3>
                        <PDFCanvas file={templatePreview}>
                          <div className="pdf-dots">
                            {renderFieldDots(selectedFields)}
                          </div>
                          {isAdmin && (
                            <>
                              <div
                                className="pdf-click-overlay"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={() => {
                                  setMousePos({ x: -1, y: -1 });
                                  setIsDragging(false);
                                  setDragStart(null);
                                }}
                                title="Tıklayıp sürükleyerek alan seçin"
                              />
                              {/* Guide Lines (Crosshair) */}
                              {mousePos.x > 0 && mousePos.y > 0 && !isDragging && (
                                <>
                                  <div className="guide-line-x" style={{ top: mousePos.y }}></div>
                                  <div className="guide-line-y" style={{ left: mousePos.x }}></div>
                                </>
                              )}
                              {/* Selection Drag Box */}
                              {isDragging && dragStart && dragCurrent && (
                                <div
                                  className="selection-box"
                                  style={{
                                    left: Math.min(dragStart.x, dragCurrent.x),
                                    top: Math.min(dragStart.y, dragCurrent.y),
                                    width: Math.abs(dragCurrent.x - dragStart.x),
                                    height: Math.abs(dragCurrent.y - dragStart.y)
                                  }}
                                ></div>
                              )}
                            </>
                          )}
                        </PDFCanvas>
                        <div className="field-list">
                          <h4>Seçilen Alanlar:</h4>
                          {selectedFields.map((field, idx) => (
                            <div key={idx} className="field-item">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>{field.key}</strong>
                                <button type="button" className="danger-sm" onClick={() => removeField(idx)}>Sil</button>
                              </div>
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
              )
              }
            </section >

            {/* Dashboard Tab - Report Creation */}
            {activeTab === 'dashboard' && (
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
                      type="text"
                      value={reportForm.customerId}
                      onChange={(e) => setReportForm({ ...reportForm, customerId: e.target.value })}
                      placeholder="Müşteri adı veya ID"
                    />
                  </label>

                  {selectedTemplate && reportPreview && (
                    <div className="pdf-preview-container">
                      <h3>PDF önizleme - Alanları doldurun</h3>
                      <PDFCanvas
                        file={reportPreview}
                      >
                        <div className="pdf-dots">
                          {renderFieldDots(reportFieldMap, reportForm.fieldData)}
                        </div>
                      </PDFCanvas>
                      <div className="field-form">
                        <h4>Alanları Doldur:</h4>
                        {Array.isArray(reportFieldMap) && reportFieldMap.filter(f => f && typeof f.x === 'number').map((field, idx) => (
                          <div key={idx} className="form-group" style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <label>
                              {field.key}
                              <span style={{ fontSize: '10px', color: '#999', marginLeft: '6px' }}>
                                (x:{field.x.toFixed(0)}, y:{field.y.toFixed(0)})
                              </span>
                            </label>

                            {/* Rich Text Toolbar for Report Mode */}
                            <div className="field-toolbar">
                              <div className="toolbar-row">
                                <select
                                  value={field.fontFamily || 'Helvetica'}
                                  onChange={(e) => {
                                    const newFields = [...reportFieldMap];
                                    newFields[idx] = { ...newFields[idx], fontFamily: e.target.value };
                                    setReportFieldMap(newFields);
                                  }}
                                  title="Yazı Tipi"
                                >
                                  <option value="Helvetica">Helvetica</option>
                                  <option value="TimesRoman">Times New Roman</option>
                                  <option value="Courier">Courier</option>
                                </select>
                                <input
                                  type="number"
                                  value={field.fontSize || 11}
                                  onChange={(e) => {
                                    const newFields = [...reportFieldMap];
                                    newFields[idx] = { ...newFields[idx], fontSize: parseInt(e.target.value) || 11 };
                                    setReportFieldMap(newFields);
                                  }}
                                  title="Punto"
                                  style={{ width: '40px' }}
                                />
                                <input
                                  type="color"
                                  value={field.color || '#000000'}
                                  onChange={(e) => {
                                    const newFields = [...reportFieldMap];
                                    newFields[idx] = { ...newFields[idx], color: e.target.value };
                                    setReportFieldMap(newFields);
                                  }}
                                  title="Renk"
                                  style={{ width: '24px', height: '24px', padding: 0, border: 'none' }}
                                />
                              </div>
                              <div className="toolbar-row">
                                <div className="btn-group">
                                  <button type="button"
                                    className={`tool-btn ${field.fontWeight === 'bold' ? 'active' : ''}`}
                                    onClick={() => {
                                      const newFields = [...reportFieldMap];
                                      newFields[idx] = { ...newFields[idx], fontWeight: field.fontWeight === 'bold' ? 'normal' : 'bold' };
                                      setReportFieldMap(newFields);
                                    }}
                                    title="Kalın"
                                  >B</button>
                                  <button type="button"
                                    className={`tool-btn ${field.fontStyle === 'italic' ? 'active' : ''}`}
                                    onClick={() => {
                                      const newFields = [...reportFieldMap];
                                      newFields[idx] = { ...newFields[idx], fontStyle: field.fontStyle === 'italic' ? 'normal' : 'italic' };
                                      setReportFieldMap(newFields);
                                    }}
                                    title="İtalik"
                                    style={{ fontStyle: 'italic' }}
                                  >I</button>
                                </div>
                                <div className="btn-group">
                                  <button type="button"
                                    className={`tool-btn ${!field.textAlign || field.textAlign === 'left' ? 'active' : ''}`}
                                    onClick={() => {
                                      const newFields = [...reportFieldMap];
                                      newFields[idx] = { ...newFields[idx], textAlign: 'left' };
                                      setReportFieldMap(newFields);
                                    }}
                                    title="Sola Hizala"
                                  >L</button>
                                  <button type="button"
                                    className={`tool-btn ${field.textAlign === 'center' ? 'active' : ''}`}
                                    onClick={() => {
                                      const newFields = [...reportFieldMap];
                                      newFields[idx] = { ...newFields[idx], textAlign: 'center' };
                                      setReportFieldMap(newFields);
                                    }}
                                    title="Ortala"
                                  >C</button>
                                  <button type="button"
                                    className={`tool-btn ${field.textAlign === 'right' ? 'active' : ''}`}
                                    onClick={() => {
                                      const newFields = [...reportFieldMap];
                                      newFields[idx] = { ...newFields[idx], textAlign: 'right' };
                                      setReportFieldMap(newFields);
                                    }}
                                    title="Sağa Hizala"
                                  >R</button>
                                </div>
                              </div>
                            </div>

                            <input
                              type="text"
                              className="form-control"
                              value={reportForm.fieldData[field.key] || ''}
                              onChange={(e) => setReportForm({
                                ...reportForm,
                                fieldData: {
                                  ...reportForm.fieldData,
                                  [field.key]: e.target.value
                                }
                              })}
                              placeholder={`${field.key} değerini girin`}
                              style={{ marginTop: '8px' }}
                            />
                          </div>
                        ))}
                        <button className="primary" onClick={handleReportCreate}>Rapor Üret</button>

                        {/* Success Message and PDF Open Button */}
                        {lastCreatedReport && (
                          <div style={{
                            marginTop: '20px',
                            padding: '15px',
                            background: '#10b981',
                            color: 'white',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <strong>✓ Rapor başarıyla kaydedildi!</strong>
                              <div style={{ fontSize: '14px', marginTop: '5px' }}>
                                Rapor No: {lastCreatedReport.doc_number}
                              </div>
                            </div>
                            <a
                              href={`${API_BASE}/files/generated/${lastCreatedReport.doc_number}.pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="secondary"
                              style={{
                                background: 'white',
                                color: '#10b981',
                                padding: '10px 20px',
                                borderRadius: '6px',
                                textDecoration: 'none',
                                fontWeight: 'bold'
                              }}
                            >
                              PDF Aç
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </form>
              </section>
            )}

            {/* Archive Tab - Reports List */}
            {activeTab === 'archive' && (
              <section className="card">
                <div className="section-head">
                  <h2>Arşiv</h2>
                  <button onClick={loadReports} className="secondary">Yenile</button>
                </div>

                {/* Search and Filter UI */}
                <div className="reports-filters" style={{
                  display: 'flex',
                  gap: '10px',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    placeholder="Rapor numarası, müşteri ID veya şablon ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: '1', minWidth: '200px' }}
                  />
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    title="Başlangıç Tarihi"
                    style={{ minWidth: '150px' }}
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    title="Bitiş Tarihi"
                    style={{ minWidth: '150px' }}
                  />
                  <button onClick={clearFilters} className="secondary">Temizle</button>
                  <span className="muted" style={{ marginLeft: 'auto' }}>
                    {filteredReports.length} rapor
                  </span>
                </div>

                <div className="list">
                  {filteredReports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                      {reports.length === 0 ? 'Rapor yok' : 'Filtreye uygun rapor bulunamadı'}
                    </div>
                  ) : (
                    filteredReports.map((r) => (
                      <div key={r.id} className="list-item">
                        <div>
                          <strong>{r.doc_number}</strong>
                          <div className="muted">Template #{r.template_id} | Customer {r.customer_id || '-'}</div>
                        </div>
                        <div className="actions">
                          <a className="secondary" href={`${API_BASE}/files/generated/${r.doc_number}.pdf`} target="_blank" rel="noreferrer">PDF</a>
                          {isAdmin && (
                            <button
                              className="danger"
                              style={{ marginLeft: '8px', background: '#ef4444', border: '1px solid #b91c1c' }}
                              onClick={() => handleDeleteReport(r.id)}
                            >
                              Sil
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </>
        )}

      </div>
    </ErrorBoundary>
  );
}

export default App;
