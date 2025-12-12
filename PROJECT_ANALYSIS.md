# 📊 MARK-II Proje Analizi (Ön Bellek)

## 📋 Proje Özeti
**MARK-II**: PDF rapor doldurma ve versiyonlama sistemi
- **Amaç**: LAN üzerinde erişilebilen web arayüzüyle PDF şablonlarını doldurma ve raporları yönetme
- **Stack**: Node.js + Express (Backend) | React + Vite (Frontend) | MySQL/MariaDB (Veritabanı)
- **Repo**: [PDev-Report-Mark-II](https://github.com/proftvv/PDev-Report-Mark-II)
- **Sürüm**: v1.1.18

---

## 🏗️ Mimari Yapı

### Backend (`src/`)
```
src/
├── app.js              # Express sunucusu
├── config.js           # Ortam değişkenleri ve yapılandırma
├── db.js               # MySQL2 connection pool (Aktif)
├── storage.js          # Dosya yönetimi ve klasör oluşturma
├── middleware/
│   ├── authRequired.js # Oturum kontrol middleware
│   └── adminOnly.js    # IP bazlı admin kontrol (localhost)
├── routes/
│   ├── auth.js         # Kullanıcı giriş/çıkış (MySQL: users tablosu)
│   ├── templates.js    # PDF şablonları (MySQL: templates tablosu)
│   └── reports.js      # Rapor oluşturma ve versiyonlama
├── services/
│   └── pdfService.js   # pdf-lib kullanarak PDF doldurma
│   └── logger.js       # [NEW] File logger service
└── utils/
    └── docNumber.js    # Otomatik belge numaralandırması (P-YYYYMMDD-XXXX)
```

### Frontend (`frontend/src/`)
```
frontend/
├── src/
│   ├── App.jsx         # Ana bileşen
│   ├── App.css         # Tasarım (dark mode desteği)
│   ├── main.jsx        # Entry point
│   └── assets/         # Görseller
├── vite.config.js      # Vite yapılandırması
└── package.json        # React, Vite bağımlılıkları
```

---

## 🔑 Temel Özellikler

### 1. **Kullanıcı Sistemi**
- **Kimlik doğrulama**: BCrypt hash + Express-session
- **Veri kaynağı**: MySQL Database (`users` tablosu)
- **Roller**:
  - **proftvv** (Admin): Şablon ekleme/yönetimi
  - **Diğer kullanıcılar**: Rapor oluşturma

### 2. **Şablon Yönetimi**
- **Depolama**: MySQL (`templates` tablosu) + `STORAGE_ROOT/templates/` (PDF dosyaları)
- **Özellikleri**:
  - Alan haritası (field_map_json): Alan adı, sayfa, X/Y konumu, font boyutu
  - Açıklama ve oluşturma tarihi
  - Multer ile dosya yükleme
  - **Alan Seçimi**: Sürükle-bırak (Drag-select) ile alan belirleme
- **Endpoint**: `POST /templates`, `GET /templates`, `GET /templates/:id`

### 3. **Rapor Oluşturma**
- **Depolama**: MySQL (`reports` tablosu) + `STORAGE_ROOT/generated/` (PDF dosyaları)
- **Otomatik numaralandırma**:
  - Format: `P-YYYYMMDD-XXXX` (prefix-tarih-sıra)
  - Sayaç: MySQL (`doc_counters` tablosu)
- **İş akışı**:
  1. Şablon seçimi
  2. Dinamik alan formunun doldurulması (Müşteri ID kaldırıldı, sadece şablon alanları)
  3. PDF Service vasıtasıyla şablonu doldurma
  4. Raporu kaydetme
- **Endpoint**: `POST /reports`, `GET /reports`, `GET /reports/:id`

### 4. **PDF İşleme**
- **Kütüphane**: `pdf-lib` (1.17.1)
- **Süreç**:
  1. PDF yükle
  2. Field map'ine göre metin yazma (Helvetica font)
  3. Belge numarasını sağ üst köşeye yazma
  4. İşlenmiş PDF'i kaydetme

### 5. **Konfigürasyon** (env dosyasından)
```
APP_PORT=3000
APP_HOST=0.0.0.0
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=xxxx
DB_NAME=report_mark2
STORAGE_ROOT=Z:\Report-Mark-II\raporlar
SESSION_SECRET=change-me
DOC_PREFIX=P
ADMIN_IPS=127.0.0.1,::1
```

---

## 📁 Veri Depolama

### Database (MySQL)
| Tablo | Amaç |
|-------|------|
| `users` | Kullanıcı hesapları |
| `templates` | PDF şablonları metadata |
| `reports` | Oluşturulmuş raporlar |
| `doc_counters` | Belge numarası sayaçları |

### Dosya Sistemi Yapısı
```
STORAGE_ROOT/
├── templates/        # PDF şablonları
├── generated/        # Oluşturulmuş raporlar
└── uploads/          # Geçici yüklenen dosyalar
logs/                 # [NEW] Uygulama logları
```

---

## 🔐 Güvenlik Mekanizmaları

1. **Helmet**: HTTP header güvenliği
2. **BCrypt**: Şifre hash'leme
3. **CORS**: Origin kontrol
4. **Session**: Express-session ile oturum yönetimi
5. **Admin Check**: IP bazlı admin erişim kontrol (adminOnly middleware)
6. **Auth Required**: Tüm API endpoints'leri oturum kontrol

---

## 🚀 Başlatma

```bash
# Hızlı başlangıç
npm run start:all

# Manuel başlangıç
npm start                    # Backend
cd frontend && npm run dev   # Frontend (Vite, --host ile LAN erişimi)
```

---

## ⚠️ Bilinen Sorunlar & Notlar

1. **Database**: MySQL migration tamamlandı (v0.1.10)
2. **Logging**: Dosya tabanlı logging eklendi (`logs/app.log`)
3. **Frontend**: Sürükle-bırak ile alan seçimi eklendi.

## � Sürüm Tarihçesi

- **v0.1.10 (11 Aralık 2025)**: MySQL Migration Tamamlandı.
  - Backend tamamen veritabanına geçirildi.
  - Sürükle-bırak alan seçimi eklendi.
  - Loglama sistemi eklendi.
  - Müşteri ID alanı kaldırıldı.
  - Hatalar giderildi.

- **v0.0.9 (11 Aralık 2025)**: Test altyapısı ve DB scriptleri.
- **v0.0.X**: Erken geliştirme aşamaları.

---


