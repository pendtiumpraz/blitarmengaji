# Blitar Mengaji

> Platform informasi kajian, transparansi keuangan & ekosistem dakwah digital se-**Blitar Raya**. Gratis, mobile-first, dan siap dipasang sebagai aplikasi (PWA/APK).

Melayani umat Blitar Raya sejak **2019** — kini hadir dalam versi digital.

---

## ✨ Fitur

- **Kajian & Jadwal** — info kajian per titik dakwah, jadwal rutin, rekaman & live (YouTube/Facebook).
- **Peta Dakwah** — peta titik dakwah (Leaflet + OpenStreetMap), kunci lokasi via pin + tautan Google Maps.
- **Transparansi Keuangan** — pemasukan/pengeluaran per masjid & global, unduh **laporan PDF**.
- **Donasi** — kampanye per titik dakwah, poster + target + progres, QRIS + konfirmasi WhatsApp, laporan penggunaan dana.
- **Catatan/Blog** — transkrip kajian bergaya catatan.
- **Perpustakaan** — pustaka PDF yang diunggah ustadz.
- **Kelas Online** — kursus + modul + pelajaran (video/teks/PDF) + progres belajar.
- **Event/Webinar** — info acara + pendaftaran.
- **Lapak** — UMKM jamaah (maks 3 produk aktif/partner).
- **Partner & Media Partner** — profil mitra usaha & media.
- **Tanya Ustadz** — tanya jawab (penanya boleh "Hamba Allah").
- **Tanya AI** — asisten AI **multi-provider** (DeepSeek/OpenAI/Anthropic/Gemini/dll) dengan retrieval (RAG) + sitasi sumber.
- **RBAC dinamis** — peran & izin dapat dikonfigurasi; pendaftaran mandiri entitas (titik/ustadz/partner) + verifikasi admin.
- **Dashboard** terpisah: Admin, Ustadz, dan Pengelola Entitas.
- **Recycle Bin**, **Audit Log**, **Notifikasi** in-app.
- **Tema** — 8 tema tampilan yang bisa dipilih pengguna.
- **PWA → APK** — installable, dukungan offline, siap dibungkus TWA jadi APK Android.

## 🧱 Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS v4 + design system *craft* (ornamen SVG Islami) |
| Database | Neon (Postgres serverless) + **Drizzle ORM** + pgvector |
| Auth | NextAuth v5 (Credentials + JWT, opsional Google OAuth) |
| Storage | Vercel Blob (token terenkripsi AES-256-GCM per entitas) |
| AI | Lapisan generik OpenAI-compatible (provider/model dikelola via DB) |
| Peta | Leaflet + OpenStreetMap |
| PWA | Web App Manifest + Service Worker + TWA (Bubblewrap) |

## 🚀 Mulai

### 1. Prasyarat
- Node.js 20+ dan **npm**
- Database **Neon** (Postgres) — aktifkan extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- Token **Vercel Blob**

### 2. Instalasi
```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
```

### 3. Environment (`.env.local`)
| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string Neon (pooled) |
| `DATABASE_URL_UNPOOLED` | Connection string Neon (direct, untuk migrasi) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (lokal) |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob |
| `STORAGE_ENC_KEY` | Hex 32 byte (64 char) — enkripsi token storage & API key AI |
| `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` | Akun super admin awal (saat seed) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | (opsional) login Google |
| `NEXT_PUBLIC_SITE_URL` | URL produksi (sitemap/robots/OG/TWA) |
| `NEXT_PUBLIC_APK_URL` | (opsional) tautan file `.apk` → mengaktifkan banner unduh |
| `TWA_PACKAGE_NAME` / `TWA_SHA256` | Untuk `/.well-known/assetlinks.json` (APK) |

> Kredensial **tidak pernah** di-commit — `.env.local` masuk `.gitignore`.

### 4. Database
```bash
npx tsx db/setup-extensions.ts   # aktifkan pgvector & pgcrypto
npm run db:generate              # buat migrasi dari schema
npx drizzle-kit migrate          # terapkan ke Neon
npm run db:seed                  # RBAC, menu, super admin, 8 tema
npm run db:seed:ai               # provider & model AI terbaru
npm run db:seed:uat              # (opsional) data contoh UAT  →  db:unseed:uat untuk hapus
```

### 5. Jalankan
```bash
npm run dev      # http://localhost:3000
```
Login admin memakai `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD`.

## 📜 Skrip npm

| Skrip | Fungsi |
|---|---|
| `dev` / `build` / `start` | Next.js dev / build / produksi |
| `typecheck` | `tsc --noEmit` |
| `lint` | ESLint |
| `db:generate` / `db:push` / `db:studio` | Drizzle Kit |
| `db:seed` / `db:seed:ai` / `db:seed:uat` / `db:unseed:uat` | Seeding |

## 🗂️ Struktur Proyek

```
db/                 # Drizzle schema, migrasi, seed
src/
  app/
    (public)/       # halaman publik (beranda, peta, kajian, donasi, ...)
    (auth)/         # masuk, daftar, lupa/atur ulang sandi
    admin/          # dashboard admin + modul + manajemen AI
    kelola/         # dashboard pengelola entitas
    ustadz/         # dashboard ustadz
    api/            # NextAuth, AI chat, laporan PDF, assetlinks
  components/       # ui primitives, site shell, admin shell, map, dll
  lib/              # db, auth, rbac, blob, storage, ai, queries, actions
public/             # service worker, ikon, offline, manifest APK
docs/               # brainstorm, rencana DB, design system, audit, QA, panduan APK
```

## 📱 Build APK (TWA)

PWA ini bisa dibungkus jadi APK Android via **Bubblewrap**. Langkah lengkap di **[docs/APK-BUILD-GUIDE.md](docs/APK-BUILD-GUIDE.md)** (butuh situs online HTTPS + Android SDK).

## 📚 Dokumentasi

- [AGENTS.md](AGENTS.md) — aturan & konvensi pengembangan
- [docs/BLITAR-MENGAJI-BRAINSTORM.md](docs/BLITAR-MENGAJI-BRAINSTORM.md) — master plan
- [docs/DATABASE-PLAN.md](docs/DATABASE-PLAN.md) — rancangan database
- [docs/AUDIT-IMPROVEMENT-PLAN.md](docs/AUDIT-IMPROVEMENT-PLAN.md) — audit & rencana peningkatan
- [docs/QA-REPORT.md](docs/QA-REPORT.md) — laporan QA/UAT

## 🤝 Kontribusi

Aturan utama: **DATABASE → BACKEND → FRONTEND**, frontend mengikuti mockup di `docs/ui/`, **npm** saja, dan jangan commit kredensial.

---

_Blitar Mengaji — semoga menjadi amal jariyah untuk umat Blitar Raya._ 🤲
