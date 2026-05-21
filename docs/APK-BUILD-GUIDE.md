# Panduan Build APK (TWA) — Blitar Mengaji

PWA ini siap dibungkus jadi **APK Android** memakai **TWA (Trusted Web Activity)** via **Bubblewrap**.
APK = "cangkang" tipis yang membuka situs resmi di dalam aplikasi — konten selalu terbaru, tak perlu unduh ulang tiap update.

## Prasyarat (sekali saja)
1. **Situs sudah online (HTTPS)** — TWA wajib HTTPS. Deploy dulu ke Vercel (lihat Fase 4).
2. **JDK 17** terpasang.
3. **Android SDK** (atau biarkan Bubblewrap mengunduhnya).
4. **Node + npm** (sudah ada).

## Langkah build

```bash
# 1) Pasang Bubblewrap
npm i -g @bubblewrap/cli

# 2) Init dari manifest PWA yang sudah online
bubblewrap init --manifest https://DOMAIN-ANDA/manifest.webmanifest
#   (atau pakai twa-manifest.json di repo ini setelah ganti host/domain & iconUrl)

# 3) Build → menghasilkan app-release-signed.apk + app-release-bundle.aab
bubblewrap build
```

Saat `init`, Bubblewrap membuat **keystore** penandatangan. Catat path & alias-nya
(di `twa-manifest.json`: `signingKey.path` & `alias`). JANGAN hilang — dibutuhkan untuk update.

## Hubungkan APK ↔ Situs (Digital Asset Links) — WAJIB agar address bar TWA hilang
1. Ambil **SHA-256 fingerprint** keystore:
   ```bash
   keytool -list -v -keystore android.keystore -alias blitarmengaji
   ```
   Salin baris `SHA256: AA:BB:...`.
2. Set environment di hosting (Vercel → Project → Settings → Environment Variables):
   - `TWA_PACKAGE_NAME = com.blitarmengaji.twa`
   - `TWA_SHA256 = AA:BB:CC:...` (boleh beberapa, pisah koma)
3. Situs sudah otomatis menyajikan `/.well-known/assetlinks.json` (route sudah dibuat) memakai env di atas.
   Verifikasi: buka `https://DOMAIN-ANDA/.well-known/assetlinks.json` → fingerprint muncul.

## Distribusi APK + tombol unduh di situs
- Upload `app-release-signed.apk` ke **Vercel Blob** / GitHub Release / storage publik.
- Set env: `NEXT_PUBLIC_APK_URL = https://.../blitar-mengaji.apk`
- Otomatis aktif:
  - **Banner unduh** (`ApkBanner`) muncul di web, **1× per 24 jam**, **disembunyikan saat dibuka dari aplikasi**.
  - Halaman **`/unduh-apk`** menampilkan tombol unduh + cara pasang.
  - Bila `NEXT_PUBLIC_APK_URL` kosong, banner mengarah ke `/unduh-apk` yang menampilkan instruksi PWA.

## Publish ke Play Store (opsional)
- Unggah `app-release-bundle.aab` ke Google Play Console.
- Pakai **Play App Signing**; tambahkan SHA-256 dari Play ke `TWA_SHA256` juga.

## Env terkait (lihat .env.example)
| Var | Fungsi |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL produksi (untuk sitemap/robots/OG & TWA) |
| `NEXT_PUBLIC_APK_URL` | Tautan file .apk (mengaktifkan tombol/banner unduh) |
| `TWA_PACKAGE_NAME` | Package id APK (default `com.blitarmengaji.twa`) |
| `TWA_SHA256` | Fingerprint SHA-256 keystore (untuk assetlinks) |
