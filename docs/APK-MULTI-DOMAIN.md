# APK / TWA — Dua Domain (vercel.app → blitarmengaji.com)

Panduan agar APK Blitar Mengaji bisa dipakai di **`blitarmengaji.vercel.app`** sekarang, lalu mulus saat pindah ke **`blitarmengaji.com`**.

> **Fakta kunci:** custom domain di Vercel = deployment yang **sama**. Jadi `/.well-known/assetlinks.json`, manifest, & ikon **otomatis tersaji di kedua domain** tanpa ubah kode. assetlinks dibaca dari env `TWA_PACKAGE_NAME` + `TWA_SHA256` (lihat `src/app/.well-known/assetlinks.json`).

## File manifest
| File | Untuk | `host` |
|---|---|---|
| `twa-manifest.json` | **Sekarang** | `blitarmengaji.vercel.app` |
| `twa-manifest.com.json` | **Nanti** (setelah beli domain) | `blitarmengaji.com` |

Keduanya **`packageId` sama** (`com.blitarmengaji.twa`) & **keystore sama** → migrasi = *update* aplikasi, bukan app baru.

---

## ⚠️ Aturan emas (apa pun caranya)
1. **`packageId`** tetap `com.blitarmengaji.twa` — JANGAN diubah.
2. **Keystore** (`android-keystore.jks`) **disimpan baik-baik & SELALU dipakai ulang**. Hilang = tidak bisa rilis update. (Sudah di-`.gitignore` — backup manual di tempat aman, jangan commit.)
3. Set di **Vercel env**: `TWA_PACKAGE_NAME=com.blitarmengaji.twa` dan `TWA_SHA256=<fingerprint keystore>` → redeploy. Berlaku otomatis di kedua domain.
4. Ambil SHA-256 keystore: `keytool -list -v -keystore android-keystore.jks -alias blitarmengaji`.

---

## Cara 1 — Rebuild saat migrasi (paling simpel, disarankan)

**Sekarang:**
```bash
npm i -g @bubblewrap/cli
bubblewrap build            # baca twa-manifest.json (host vercel.app)
```

**Nanti, saat `blitarmengaji.com` aktif di Vercel:**
```bash
cp twa-manifest.com.json twa-manifest.json   # swap ke domain .com (appVersionCode sudah 2)
bubblewrap update
bubblewrap build
```
→ APK baru menuju `.com`. Karena keystore & packageId sama, ini **update** (user cukup pasang versi baru).

---

## Cara 2 — Satu APK, dua domain (tanpa rebuild saat pindah)

Build sekali (host `vercel.app`), tapi buat app **memercayai kedua origin**. Setelah `bubblewrap build`, edit project Android hasil generate:

### a) `app/src/main/res/values/strings.xml`
Ubah `asset_statements` agar memuat **dua** situs, dan tambah array origin tambahan:
```xml
<string name="asset_statements">
  [{
    \"relation\": [\"delegate_permission/common.handle_all_urls\"],
    \"target\": {\"namespace\": \"web\", \"site\": \"https://blitarmengaji.vercel.app\"}
  },{
    \"relation\": [\"delegate_permission/common.handle_all_urls\"],
    \"target\": {\"namespace\": \"web\", \"site\": \"https://blitarmengaji.com\"}
  }]
</string>

<string-array name="additional_trusted_origins">
  <item>https://blitarmengaji.com</item>
</string-array>
```

### b) `app/src/main/AndroidManifest.xml`
Di dalam `<activity>` LauncherActivity, tambahkan meta-data:
```xml
<meta-data
  android:name="android.support.customtabs.trusted.ADDITIONAL_TRUSTED_ORIGINS"
  android:resource="@array/additional_trusted_origins" />
```

### c) assetlinks di kedua domain
Sudah otomatis (deployment Vercel sama). Pastikan `TWA_SHA256` di env = fingerprint keystore yang dipakai build.

### d) Build APK
```bash
cd <folder project TWA>
./gradlew assembleRelease    # atau: bubblewrap build (lihat catatan)
```

**Hasil:** app membuka `vercel.app`; bila kamu redirect `vercel.app → blitarmengaji.com`, tetap full-screen (tanpa address bar) karena `.com` ikut tepercaya. **Tidak perlu rebuild saat pindah domain.**

> ⚠️ **Catatan:** `bubblewrap update`/`build` me-*regenerate* project → edit langkah (a) & (b) bisa tertimpa. Setelah `update`, terapkan ulang edit tersebut sebelum build, atau pakai `bubblewrap build` lalu patch lagi. Untuk itu Cara 1 lebih anti-ribet.

---

## Setelah dapat `.apk`
1. **Hapus address bar TWA:** set `TWA_SHA256` (+ `TWA_PACKAGE_NAME`) di Vercel → redeploy → `/.well-known/assetlinks.json` terverifikasi.
2. **Aktifkan tombol unduh di situs:** upload `.apk` (Vercel Blob / GitHub Release) → set `NEXT_PUBLIC_APK_URL=https://…/blitarmengaji.apk` → banner & `/unduh-apk` aktif.

## Alternatif tanpa install (tercepat)
**PWABuilder.com** → masukkan URL situs → Android → Generate Package → unduh `.apk` + `.aab` + assetlinks. Untuk dua domain, ulangi dengan URL `.com` saat sudah aktif (Cara 1).
