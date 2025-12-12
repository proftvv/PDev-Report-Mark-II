# Exposing Report Mark II to the Internet using Ngrok

Bu kılavuz, yerel makinenizde çalışan (localhost) projeyi, `ngrok` kullanarak güvenli bir şekilde internete nasıl açacağınızı ve arkadaşlarınızla veya müşterilerinizle nasıl paylaşacağınızı anlatır.

## Ön Gereksinimler

1.  **Ngrok Hesabı**: [ngrok.com](https://ngrok.com) adresinden ücretsiz bir hesap oluşturun.
2.  **Ngrok Kurulumu**: Ngrok uygulamasını indirin ve kurun.
3.  **Projenin Çalışıyor Olması**: `npm run start:all` komutuyla projenizin (Backend: 3000, Frontend: 5173) çalıştığından emin olun.

---

## Adım Adım Kurulum

### 1. Basit Yöntem (Sadece Frontend Paylaşımı)

Eğer sadece arayüzü göstermek istiyorsanız ve backend çağrıları (API) yerel ağdaysa (ki şu anki mimaride Backend ve Frontend ayrı portlarda), bu yöntem *kısmen* çalışabilir ancak API hataları alabilirsiniz. **Önerilen yöntem 2. yöntemdir.**

```bash
ngrok http 5173
```

### 2. Tam Paylaşım (Frontend + Backend) - ÖNERİLEN

Report Mark II projesi, Frontend (5173) ve Backend (3000) olarak iki ayrı servisten oluşur. Vite Proxy ayarı sayesinde Frontend üzerinden Backend'e erişebiliriz. Ancak Ngrok ile dışarı açarken, Frontend'in Backend'e nasıl ulaşacağını bilmesi gerekir.

En sağlıklı yöntem, **Backend'i (API)** dışarı açmak ve Frontend'i bu tünel üzerinden sunmaktır. Ancak Vite dev sunucusu yerine `production` build almak daha kararlıdır.

#### Geliştirme Ortamı İçin Hızlı Çözüm:

Sadece frontend portunu tünelleyip, `host` başlığını manipüle ederek çalıştırabiliriz.

1.  **Ngrok Komutu**:
    Vite sunucusunu internete açın:
    ```bash
    ngrok http 5173 --host-header="localhost:5173"
    ```

2.  **Ngrok URL'ini Kullanma**:
    Ngrok size `https://xxxx-xx-xx.ngrok-free.app` gibi bir link verecektir. Bu linki paylaşabilirsiniz.

**Not**: Vite güvenlik nedeniyle bazen dış erişimi engelleyebilir. `package.json` içindeki dev komutunda `--host` parametresi olduğundan emin olun (Projemizde zaten ekli).

---

### Alternatif: Production Build ile Sunum (En Temiz Yöntem)

Eğer "Failed to fetch" hataları alıyorsanız veya proje tam yüklenmiyorsa, projeyi derleyip tek bir porttan sunmak en iyisidir.

1.  **Frontend'i Derle**:
    ```bash
    cd frontend
    npm run build
    ```

2.  **Backend İçinden Sun**:
    Backend'in build edilen dosyaları sunması için `src/app.js` dosyasında statik dosya sunumu ayarlanmalıdır (Projenizde bu ayar varsa).

3.  **Tünel Aç**:
    ```bash
    ngrok http 3000
    ```

---

## Güvenlik Uyarısı (ÖNEMLİ)

Ngrok ile açılan link, **herkese açıktır**. Linki bilen herkes projenize erişebilir.
*   **Yönetici Paneli**: Projenizde `proftvv` kullanıcısı ile giriş yapılabilir. Şifrenizin güçlü olduğundan emin olun.
*   **Veri Gizliliği**: Gerçek müşteri verileriyle çalışırken production ortamında Ngrok (free) kullanılması önerilmez.

## Sık Karşılaşılan Sorunlar

*   **Invalid Host Header**: Ngrok komutuna `--host-header=rewrite` eklemeyi deneyin.
*   **CORS / Network Error**: Backend ve Frontend farklı domainlerde (biri ngrok, biri localhost) sanıldığı için olabilir. Vite Proxy bu sorunu çözer ancak Ngrok üzerinden erişirken Frontend'in API isteklerini nereye attığı (göreli yol) önemlidir. `App.jsx` içinde `API_BASE` boş string `''` olarak ayarlandığı için, Frontend isteği `mevcut-sayfa-domaini/api` şeklinde yapacaktır. Bu harika bir ayardır ve Ngrok ile uyumludur!

**Özetle**:
1. Projeyi çalıştır (`npm run start:all`).
2. `ngrok http 5173` komutunu çalıştır.
3. Verilen HTTPS linkini kullan.
