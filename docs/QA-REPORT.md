# QA / UAT Report — Blitar Mengaji

Tanggal: 2026-05-21 · Lingkup: seluruh aplikasi (70+ halaman, 8 route API) · Status build: **PASS** (typecheck & build hijau).

## 1. Hasil otomatis
- **Routing**: 21 halaman publik → 200, semua halaman terproteksi (admin/kelola/ustadz/akun) → 307 redirect ke /masuk, rute tak dikenal → **404**. **0 kegagalan**.
- **TypeScript**: `tsc --noEmit` bersih (kolom NOT NULL wajib dijamin di semua insert).
- **Build**: `next build` sukses; halaman data = dynamic (ƒ), statis = (○).
- **Form ↔ Action**: nama field form dicocokkan dengan `formData.get(...)` per domain (audit sebelumnya) — save create & edit berfungsi.

## 2. Peningkatan QA pada pass ini
- **UX state**: `not-found.tsx` (404 craft), `error.tsx` + `global-error.tsx` (boundary), `loading.tsx` (skeleton).
- **SEO**: `sitemap.xml` (statis + slug dinamis dari DB), `robots.txt` (blokir area privat), `generateMetadata` di semua halaman detail (`[slug]`) + judul per halaman daftar + OpenGraph + `metadataBase` + template title.
- **PWA**: `offline.html` + service worker fallback offline (cache `bm-v2`), `manifest` shortcuts (Jadwal/Peta/Tanya AI/Donasi), `/.well-known/assetlinks.json` (untuk TWA).
- **Aksesibilitas**: landmark `nav` ber-label, `aria-label` tombol ikon, `aria-current` nav aktif, `role="img"` pada logo.

## 3. APK (TWA)
- **Banner unduh** (`ApkBanner`): muncul **1× / 24 jam**, **hanya di web** (disembunyikan saat dibuka dari aplikasi: PWA standalone / TWA / iOS standalone), berbasis `localStorage`.
- Halaman **`/unduh-apk`**: tombol unduh + cara pasang (aktif bila `NEXT_PUBLIC_APK_URL` diisi; bila kosong → instruksi PWA).
- **Config & panduan**: `twa-manifest.json` + `docs/APK-BUILD-GUIDE.md` (Bubblewrap) + route assetlinks (pakai `TWA_PACKAGE_NAME`/`TWA_SHA256`).

## 4. Checklist UAT manual (untuk pemeriksaan)
Login: `development@privasimu.com` / `Bm!e6ef14d92456`

- [ ] Buat & edit: Titik, Kajian, Donasi, Keuangan, Catatan, Pustaka, Kelas, Event, Lapak (create + `/[id]` edit + hapus → recycle bin)
- [ ] Recycle Bin `/admin/sampah` → Pulihkan
- [ ] Daftar mandiri `/gabung` → verifikasi di `/admin/users` → role otomatis → akses `/kelola`
- [ ] `/kelola`: jadwal, galeri, video (+edit), keuangan, donasi, lapak, event, media-partner
- [ ] Theme switcher (header) ganti 8 tema
- [ ] Kelas: enroll → `/kelas/[slug]/belajar` → tandai selesai → `/belajar-saya`
- [ ] Lupa sandi `/lupa-sandi` → reset
- [ ] Donasi → konfirmasi pembayaran → `/admin/pembayaran` verifikasi
- [ ] Notifikasi (lonceng) + `/notifikasi`
- [ ] Audit log `/admin/audit`
- [ ] Banner "Unduh APK" muncul (web), hilang setelah ditutup (24 jam)

## 5. Batasan / menunggu aktivasi (bukan bug)
- **AI chat/ringkas/RAG**: butuh API key provider di `/admin/ai` + bind task (chat/summarize/embedding).
- **Google OAuth**: butuh `GOOGLE_CLIENT_ID/SECRET`.
- **Email reset sandi**: belum ada layanan email → tautan reset tampil di layar (colok Resend/SMTP untuk produksi).
- **APK fisik**: butuh deploy HTTPS + Android SDK/Bubblewrap (lihat panduan). Banner/halaman unduh aktif setelah `NEXT_PUBLIC_APK_URL` diisi.
- **Deploy Vercel**: Fase 4 (pending).
