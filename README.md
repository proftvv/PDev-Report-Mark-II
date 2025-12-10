# 📊 Report Mark-II
## Report Dış Ticaret ve Lojistik - Deneysel Proje Merkezi

**ReportDisTicaret** ana repositorisi. Bu repo, Report Dış Ticaret ve Lojistik şirketinin çeşitli deneysel ve üretim projelerinin merkezi konumundadır.

---

## 📁 Proje Yapısı

```
ReportDisTicaret/
├── Mark-II/              # 📌 ANA PROJE - PDF Rapor Sistemi
│   ├── src/              # Backend kaynağı (Node.js + Express)
│   ├── frontend/         # Frontend (React + Vite)
│   ├── sql/              # Database şeması
│   ├── run-all.bat       # 🚀 Hızlı başlatma
│   └── package.json
├── README.md             # Bu dosya
└── .git/                 # Git repository
```

---

## 🎯 Mark-II Nedir?

**Mark-II**, PDF rapor doldurma ve versiyonlama sistemidir. LAN üzerinde erişilebilen web arayüzüyle:

✅ **PDF Şablonları Yönetimi** - Özel PDF şablonları ekleyin  
✅ **Otomatik Doldurma** - Alan seçimi ve veri girişi  
✅ **Versiyon Kontrolü** - Raporların geçmiş sürümlerini takip edin  
✅ **Belge Numaralandırması** - Otomatik, tarih bazında numara sistemi  
✅ **Dark Mode** - Gece çalışması için uygun tema  

### 💻 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Backend** | Node.js 18+ / Express |
| **Frontend** | React 18+ / Vite |
| **Database** | MySQL 5.7+ / MariaDB |
| **PDF** | pdf-lib (Oku/Yaz) |
| **Auth** | BCrypt + Express-Session |

---

## 🚀 Hızlı Başlangıç

### 1️⃣ Bağımlılıkları Yükle

```bash
cd Mark-II
npm install
cd frontend && npm install && cd ..
```

### 2️⃣ Ortam Değişkenlerini Ayarla

`Mark-II/env` dosyasını düzenle:

```env
APP_PORT=3000
APP_HOST=0.0.0.0
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=2503
DB_NAME=report_mark2
STORAGE_ROOT=Z:\Report-Mark-II\raporlar
SESSION_SECRET=change-me
DOC_PREFIX=P
```

### 3️⃣ Başlat! 🎊

#### Seçenek 1: Hızlı Başlangıç (Tavsiye Edilen)
```bash
cd Mark-II
.\run-all.bat
```

#### Seçenek 2: Manuel Başlangıç
```bash
cd Mark-II
npm run start:all
```

---

## 📊 Özellikler

### 🔐 Kullanıcı Sistemi
- Admin (proftvv): Şablon ekleme ve yönetimi
- Standart Kullanıcılar: Rapor oluşturma

### 📋 API Endpoints

| Method | Endpoint | İçin |
|--------|----------|------|
| `POST` | `/auth/login` | Giriş |
| `POST` | `/auth/logout` | Çıkış |
| `GET` | `/templates` | Şablonları listele |
| `POST` | `/templates` | Yeni şablon ekle (Admin) |
| `POST` | `/reports` | Rapor oluştur |
| `GET` | `/reports` | Raporları listele |

### 🎨 UI/UX
- Responsive tasarım (Mobile + Desktop)
- Dark/Light tema geçişi
- Real-time form validation
- PDF önizlemesi

---

## 📈 Versiyon Sistemi

Her dosyanın başında versiyon numarası bulunur (`// v0.0.1`).

**Versiyon İlerleme:**
- `v0.0.1` - İlk sürüm
- `v0.0.2` - Bug fix'ler
- `v0.1.0` - Yeni özellik
- `v1.0.0` - Stable sürüm

Güncellemeler otomatik GitHub'a push'lanır.

---

## 🔄 GitHub Ayarları

- **Repository**: https://github.com/proftvv/ReportDisTicaret
- **Branch**: `main` (default)
- **Otomatik Push**: `run-all.bat` kapatılırken trigger'lanır
- **Contributions**: Aktif takip ediliyor ✅

---

## 📚 Projeyi Geliştirme

### Şablon Ekleme
1. Admin hesabı (proftvv) ile giriş yap
2. "Şablon ekle" butonuna tıkla
3. PDF dosyasını seç
4. Alanları tıklayarak belirle
5. Kaydet

### Rapor Oluşturma
1. Standart hesapla giriş yap
2. Şablon seç
3. Alanları doldur
4. "Rapor Üret" tıkla
5. PDF'i indir

---

## 🛠️ Database Kurulumu

```bash
cd Mark-II/sql
# Aşağıdaki SQL dosyalarını MySQL'e çalıştır:
# - schema.sql (Tablo yapısı)
# - create_app_user.sql (Uygulama kullanıcısı)
```

---

## 📝 Notlar

- **Port Çakışması**: Port 3000 meşgulse, `.env`'de `APP_PORT` değiştir
- **CORS**: LAN içinde tüm IP'lere açık
- **Session**: Browser kapatılırken silinir
- **PDF İşleme**: Sunucuda yapılır (client-side değil)

---

## 🤝 İletişim & Destek

- **GitHub**: https://github.com/proftvv/ReportDisTicaret
- **E-posta**: ozcanyilmazcelebi2016@gmail.com
- **Şirket**: Report Dış Ticaret ve Lojistik

---

## 📄 Lisans

Tüm hakları saklıdır © 2025 Report Dış Ticaret ve Lojistik

---

**Son Güncelleme**: 10 Aralık 2025  
**Versiyonu**: v0.1.0
