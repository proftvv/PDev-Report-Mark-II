# 📊 Report Mark II

**Report Dış Ticaret ve Lojistik - Dijital Raporlama Platformu**

Report Mark II, şirket içi PDF raporlama süreçlerini dijitalleştiren, LAN üzerinden erişilebilir modern bir web uygulamasıdır. Eski masaüstü yazılımlarının yerini alarak, herhangi bir cihazdan (PC, Tablet) kolayca rapor oluşturulmasını sağlar.

---

## 🎯 Proje Amacı ve Özellikler

Bu sistemin temel amacı, standart PDF şablonları üzerine dinamik veri girişi yaparak hatasız ve standartlara uygun belgeler üretmektir.

### Temel Özellikler
*   **📄 Dinamik PDF Şablonları:** Yöneticiler sisteme ham PDF yükleyip, üzerine veri alanlarını sürükle-bırak yöntemiyle tanımlayabilir.
*   **✍️ Kolay Veri Girişi:** Kullanıcılar, tanımlanmış alanları bir form üzerinden doldurarak PDF'i saniyeler içinde oluşturur.
*   **🗂️ Versiyon Takibi:** Oluşturulan her rapor benzersiz bir belge numarası (Örn: `P-20251212-005`) alır.
*   **🔒 Yetkilendirme:**
    *   **Admin (`proftvv`):** Şablon ekleme, düzenleme, silme ve tüm raporları yönetme.
    *   **Kullanıcı:** Sadece rapor oluşturma ve kendi raporlarını görme.
*   **🎨 Modern Arayüz:** Kullanıcı dostu, Karanlık/Aydınlık mod destekli React arayüzü.

---

## 🏗️ Teknoloji Yığını (Tech Stack)

| Alan | Teknoloji | Açıklama |
|------|-----------|----------|
| **Frontend** | **React + Vite** | Hızlı ve modern kullanıcı arayüzü. |
| **Backend** | **Node.js (Express)** | REST API ve iş mantığı. |
| **Database** | **MySQL / MariaDB** | Kullanıcı, şablon ve rapor verileri. |
| **PDF Engine** | **pdf-lib** | PDF okuma, işleme ve oluşturma. |
| **Security** | **Bcrypt + Helmet** | Şifreleme ve güvenlik katmanları. |

---

## 🚀 Kurulum ve Çalıştırma

### Otomatik Kurulum (Windows 11)
Proje klasöründe bulunan `easy-setup-win11.bat` dosyasına çift tıklayın. Bu script:
1.  Gerekli kütüphaneleri (`npm install`) yükler.
2.  Veritabanı bağlantılarını kontrol eder.
3.  Uygulamayı başlatır.

### Manuel Kurulum

1.  **Bağımlılıkları Yükle:**
    ```bash
    npm install
    cd frontend && npm install
    ```
2.  **Uygulamayı Başlat:**
    Ana dizinde terminali açın:
    ```bash
    npm run start:all
    ```
    *   Backend: `http://localhost:3000`
    *   Frontend: `http://localhost:3000` (Vite Proxy üzerinden) veya `http://localhost:5173`

---

## 📈 Sürüm Sistemi (Versioning)

Proje sürüm numaralandırması **`x.y.z`** formatındadır:
*   **x (1)**: Stable (Kararlı) Sürüm.
*   **y (1)**: Major Updates (Büyük Özellik Eklemeleri).
*   **z (15)**: Bug Fixes (Hata Düzeltmeleri ve Küçük İyileştirmeler).

**Mevcut Sürüm:** `v1.1.15`

---

## 📂 Klasör Yapısı

```
Mark-II/
├── src/              # Backend (API) Kodları
│   ├── routes/       # API Rotaları (Auth, Reports, Templates)
│   ├── services/     # Yardımcı Servisler (PDF, Logger)
│   └── app.js        # Ana Sunucu Dosyası
├── frontend/         # React Frontend Kodları
│   ├── src/
│   │   ├── App.jsx   # Ana Uygulama Mantığı
│   │   └── App.css   # Stiller
├── logs/             # Sistem Logları
├── raporlar/         # Oluşturulan PDF'ler ve Şablonlar (Storage)
└── sql/              # Veritabanı Kurulum Scriptleri
```

---

## 🤝 İletişim

**Geliştirici:** Proftvv (Agentic AI & Özcan Yılmazçelebi)
**Repo:** [GitHub - ReportDisTicaret](https://github.com/proftvv/ReportDisTicaret)

---
*Developed by Report Dış Ticaret ve Lojistik*

