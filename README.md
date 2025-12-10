# Report Mark II

LAN uzerinden PDF tabanli rapor doldurma, otomatik oneri ve versiyonlama icin Node.js + Express iskeleti.

## Gereksinimler
- Node.js 18+ (yuklu degilse https://nodejs.org adresinden LTS kurun)
- MariaDB/MySQL (HeidiSQL ile yonetim)

## Kurulum
1) Depoyu `C:\Users\ozcan\OneDrive\Desktop\Report-Mark2` (veya tercih ettiginiz klasor) altinda acin.
2) `env.example` dosyasini kopyalayip `.env` olusturun ve DB bilgilerini doldurun. `STORAGE_ROOT` varsayilan `Z:\Report-Mark-II\raporlar`.
3) Klasor yapisini olusturmak icin uygulama ilk acilista otomatik `templates`, `generated`, `uploads` klasorlerini acar.
4) Bağımliliklar:
   ```powershell
   npm install
   ```
5) DB tablolarini kurun:
   - HeidiSQL ile `sql/schema.sql` dosyasini calistirin.
   - Kullanici ekleyin:
     ```sql
     INSERT INTO users (username, password_hash)
     VALUES ('admin', '$2a$10$KVXV4xQDQmLCvQF3VqBAr.Gxi6CS3vJTjIA7Apcv7/CvJF/ZWT0QC'); -- bcrypt hash
     ```
     Hash olusturmak icin online bcrypt araci veya Node.js icinden `bcryptjs` kullanabilirsiniz.
       "node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('SIFRENIZ',10));"
         INSERT INTO users (username, password_hash) VALUES ('proftvv', '<$2a$10$KVXV4xQDQmLCvQF3VqBAr.Gxi6CS3vJTjIA7Apcv7/CvJF/ZWT0QC>');

## Calistirma
```powershell
npm start
# veya gelistirme icin
npm run dev
```
Sunucu `http://0.0.0.0:3000` uzerinden agdaki cihazlara acilir.

## API Ozet
- `POST /auth/login` { username, password }
- `POST /auth/logout`
- `GET /auth/me`
- `GET /templates` (giris gerekli)
- `POST /templates` (giris + admin IP; form-data: file=PDF, name, description, field_map_json)
- `POST /reports` (giris; body: template_id, customer_id?, field_data)
- `GET /reports`
- `GET /reports/:id`
- Statik dosya: `/files/...` klasorunden PDF goruntuleme.

## Alan Haritasi (field_map_json)
Sabit alan koordinatlari icin ornek:
```json
[
  { "key": "musteri_adi", "page": 0, "x": 80, "y": 720, "size": 12 },
  { "key": "adres", "page": 0, "x": 80, "y": 700, "size": 10 }
]
```
`page` 0 tabanli sayfa numarasi. `field_data` JSON icerisindeki anahtarlarla eslesir.

## Notlar
- Belge numarasi format: `P-YYYYMMDD-####` (`DOC_PREFIX` ile ozellestirilebilir).
- Sablon ekleme sadece `ADMIN_IPS` listesinde olan IP'lerden (varsayilan localhost) yapilabilir.
- `memory_bank` tablosu otomatik doldurma onerileri icin ayrilmistir; uygulama tarafinda doldurma mantigi eklenebilir.
- UI su anda yalnizca API seviyesindedir; React/veya EJS arayuzu eklemek icin altyapi hazir.

