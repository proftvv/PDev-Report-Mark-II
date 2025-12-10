# GitHub Setup Kılavuzu

## 1. Repository Oluştur

1. GitHub'a git: https://github.com/new
2. Repository adı: `Report-Mark2`
3. "Public" seçin (açık repo)
4. "Initialize with README" işaretlemeyin
5. "Create repository" tıkla

## 2. Local Repository Yapılandır

PowerShell'de aşağıdaki komutları çalıştır:

```powershell
cd "C:\Users\ozcan\OneDrive\Desktop\Report-Mark2"

# Eğer git ilk kez kuruluyorsa
git config --global user.name "Adın Soyadı"
git config --global user.email "email@example.com"

# Repository'i başlat
git init
git add -A
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[KULLANICI]/Report-Mark2.git
git push -u origin main
```

**⚠️ GitHub URL'sinde `[KULLANICI]` kısmını kendi GitHub kullanıcı adınla değiştir!**

## 3. Otomatik Push Yapılandırması

### Seçenek 1: PowerShell Script (Önerilen)

Her güncelleme sonrasında çalıştır:

```powershell
cd "C:\Users\ozcan\OneDrive\Desktop\Report-Mark2"
.\push-to-github.ps1 "Updated PDF path handling - v0.0.9"
```

### Seçenek 2: NPM Script

```bash
npm run git:push
```

### Seçenek 3: Manual Git

```bash
git add -A
git commit -m "Açıklama"
git push origin main
```

## 4. Tarayıcıdan Kontrol

Güncellemeler doğru pushlendikten sonra:
https://github.com/[KULLANICI]/Report-Mark2

adresinden dosyaları görebilirsin.

## 5. PAT Token (İsteğe bağlı - Daha Güvenli)

HTTPS yerine token kullanmak isterseniz:

1. GitHub → Settings → Developer settings → Personal access tokens
2. "Tokens (classic)" → "Generate new token"
3. Scopes: `repo` seçin
4. Token'ı kopyala

```powershell
git remote set-url origin https://[TOKEN]@github.com/[KULLANICI]/Report-Mark2.git
```

## 📝 Konfigürasyon Tamamlandı!

Artık her güncelleme yaptığında aşağıdaki komutu çalıştır:

```powershell
.\push-to-github.ps1 "Açıklayıcı commit mesajı"
```

Veya kısayol olarak package.json'daki script'i kullan.
