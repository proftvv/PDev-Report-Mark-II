# 📊 MARK-II Proje Analizi (Ön Bellek)

## 📋 Proje Özeti
**MARK-II**: PDF rapor doldurma ve versiyonlama sistemi
- **Amaç**: LAN üzerinde erişilebilen web arayüzüyle PDF şablonlarını doldurma ve raporları yönetme
- **Stack**: Node.js + Express (Backend) | React + Vite (Frontend) | MySQL/MariaDB (Veritabanı)
- **Sürüm**: v0.0.4

---

## 🏗️ Mimari Yapı

### Backend (`src/`)
```
src/
├── app.js              # Express sunucusu (v0.0.4)
├── config.js           # Ortam değişkenleri ve yapılandırma
├── db.js               # MySQL2 connection pool
├── storage.js          # Dosya yönetimi ve klasör oluşturma
├── middleware/
│   ├── authRequired.js # Oturum kontrol middleware
│   └── adminOnly.js    # IP bazlı admin kontrol (localhost)
├── routes/
│   ├── auth.js         # Kullanıcı giriş/çıkış (users.json'dan oku)
│   ├── templates.js    # PDF şablonları (templates.json'da saklanır)
│   └── reports.js      # Rapor oluşturma ve versiyonlama
├── services/
│   └── pdfService.js   # pdf-lib kullanarak PDF doldurma
└── utils/
    └── docNumber.js    # Otomatik belge numaralandırması (P-YYYYMMDD-XXXX)
```

### Frontend (`frontend/src/`)
```
frontend/
├── src/
│   ├── App.jsx         # Ana bileşen (472 satır)
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
- **Veri kaynağı**: `users.json` (JSON dosyası)
- **Roller**:
  - **proftvv** (Admin): Şablon ekleme/yönetimi
  - **Diğer kullanıcılar**: Rapor oluşturma

### 2. **Şablon Yönetimi**
- **Depolama**: `templates.json` (metadata) + `STORAGE_ROOT/templates/` (PDF dosyaları)
- **Özellikleri**:
  - Alan haritası (field_map_json): Alan adı, sayfa, X/Y konumu, font boyutu
  - Açıklama ve oluşturma tarihi
  - Multer ile dosya yükleme
- **Endpoint**: `POST /templates`, `GET /templates`, `GET /templates/:id`

### 3. **Rapor Oluşturma**
- **Depolama**: `reports.json` (metadata) + `STORAGE_ROOT/generated/` (PDF dosyaları)
- **Otomatik numaralandırma**:
  - Format: `P-YYYYMMDD-XXXX` (prefix-tarih-sıra)
  - Sayaç: `doc-counters.json` (tarih bazlı sayıcı)
- **İş akışı**:
  1. Şablon seçimi
  2. Alan verilerini doldurma
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
DB_PASSWORD=2503
DB_NAME=report_mark2
STORAGE_ROOT=Z:\Report-Mark-II\raporlar
SESSION_SECRET=change-me
DOC_PREFIX=P
ADMIN_IPS=127.0.0.1,::1
```

---

## 📁 Veri Depolama

### JSON Dosyaları
| Dosya | Amaç | Örnek İçerik |
|-------|------|-------------|
| `users.json` | Kullanıcı hesapları | `[{id, username, password_hash}]` |
| `templates.json` | PDF şablonları metadata | `[{id, name, file_path, field_map_json, created_at}]` |
| `reports.json` | Oluşturulmuş raporlar | `[{id, template_id, doc_number, file_path, created_at}]` |
| `doc-counters.json` | Belge numarası sayaçları | `{"2025-12-10": 42}` |

### Dosya Sistemi Yapısı
```
STORAGE_ROOT/
├── templates/        # PDF şablonları
├── generated/        # Oluşturulmuş raporlar
└── uploads/          # Geçici yüklenen dosyalar
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

1. **Database**: Şu anda MySQL pool konfigürasyonu var ama `db.js`'de sadece test edilmiş, API'lerde kullanılmamış
2. **JSON Depolama**: Veritabanı yerine JSON dosyası kullanılıyor (basit ama zayıf)
3. **Hata Yönetimi**: Minimal error handling
4. **Logging**: Console.log bazlı logging
5. **Dosya Güvenliği**: Malicious PDF upload'ı için validasyon yok

---

## 📦 Teknoloji Bağımlılıkları

### Backend
- `express` (4.19.2) - Web framework
- `mysql2` (3.11.0) - Database driver
- `pdf-lib` (1.17.1) - PDF manipulation
- `bcryptjs` (2.4.3) - Password hashing
- `express-session` (1.18.0) - Session management
- `multer` (1.4.5-lts.1) - File upload
- `helmet` (7.1.0) - Security headers
- `dotenv` (16.4.5) - Environment variables
- `cors` (2.8.5) - CORS middleware

### Frontend
- `react` (18+) - UI library
- `vite` - Build tool
- CSS (dark mode desteği var)

---

## 📈 Versiyon Sistemi (Güncellenmiş)

### Merkezi Versiyon Takibi
- **Lokasyon**: `VERSION` dosyası (proje kök dizini)
- **İçerik**: 
  - Proje sürümü (PROJECT VERSION: 0.0.5)
  - Tüm dosyaların sürüm takibi (STATUS ile)
  - Sürüm tarihi

### Sürüm Formatı
```
PROJECT VERSION: 0.0.5
- Patch (0.0.x): Bug fixes, small improvements
- Minor (0.1.x): New features
- Major (1.0.0+): Breaking changes
```

### Dosya Sürümü Kuralı
- **Sadece değişen dosyalara** // v0.0.X ekle
- VERSION dosyasında merkezî takip yap
- Dosya yorumunda version kalması isteğe bağlı

### Changelog Dosyaları
- **Lokasyon**: `Changelog/` klasörü
- **Format**: `vX.Y.Z.txt` (plaintext dosyalar)

### Mevcut Sürüm Tarihi
- **v0.0.2**: README güncelleme, run-all.bat, versiyonlama sistemi
- **v0.0.3**: Dosya yolu güncelleme (Z:\MARK-II), Changelog sistemi
- **v0.0.4**: Proje yapısını düzleştirme (Flatten)
- **v0.0.5**: run-all.bat hatasını düzeltme (Mark-II referansı kaldırıldı)

---

## 📝 Çalışma Akışı (Güncellenmiş)

Her prompt için:
1. ✅ Değişiklikleri yap (kod, dosya, vb.)
2. ✅ VERSION dosyasını güncelle (değişen dosyaları not et)
3. ✅ Sadece değişen dosyalara `// v0.0.X` ekle
4. ✅ Changelog/vX.Y.Z.txt dosyası oluştur
5. ✅ Git commit & push yap

---

## 🎯 Promptlara Hazır
Merkezi VERSION sistemi aktif! Şimdi her promptta:
- Proje sürümü VERSION dosyasında
- Sadece değişen dosyaları version arttır
- Changelog dosyası oluştur
- Git push

