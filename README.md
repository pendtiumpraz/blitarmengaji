# Blitar Mengaji

> Platform informasi kajian, transparansi keuangan & ekosistem dakwah digital se-**Blitar Raya**. Gratis, mobile-first, dan siap dipasang sebagai aplikasi (PWA/APK).

Melayani umat Blitar Raya sejak **2019** — kini hadir dalam versi digital.

---

## ✨ Fitur

- **Kajian & Jadwal** — info kajian per titik dakwah, jadwal rutin, rekaman & live (YouTube/Facebook).
- **Peta Dakwah** — peta titik (Leaflet + OpenStreetMap), auto **fit-bounds**; pilih lokasi via **dropdown titik + tambah titik baru lewat mini-peta**; titik bisa **diaktif/nonaktifkan** tanpa hapus.
- **Transparansi Keuangan** — pemasukan/pengeluaran per masjid & global, unduh **laporan PDF**.
- **Donasi** — kampanye per titik dakwah, poster + target + progres, QRIS + konfirmasi WhatsApp, laporan penggunaan dana.
- **Catatan/Blog** — transkrip kajian bergaya catatan.
- **Perpustakaan** — pustaka PDF yang diunggah ustadz.
- **Kelas Online** — kursus + modul + pelajaran (video/teks/PDF) + progres belajar.
- **Event/Webinar** — info acara + pendaftaran, lokasi tertaut titik dakwah + **peta di halaman detail**.
- **Lapak** — UMKM jamaah (maks 3 produk aktif/partner).
- **Partner & Media Partner** — profil mitra usaha & media.
- **Tanya Ustadz** — tanya jawab publik **berpaginasi**; **wajib login** untuk bertanya (boleh tampil "Hamba Allah"); admin dapat menjawab, **menghapus**, & **menampilkan/menyembunyikan** dari halaman depan.
- **Tanya AI** — asisten AI **multi-provider** (DeepSeek/OpenAI/Anthropic/Gemini/dll) dengan retrieval (RAG) + sitasi sumber.
- **WA Ingest** — webhook penerima pesan grup WhatsApp (read-only) → AI mengekstrak info kajian & faedah → **antrian review admin** sebelum tayang (app listener desktop terpisah).
- **RBAC dinamis** — peran & izin dapat dikonfigurasi; pendaftaran mandiri entitas (titik/ustadz/partner) + verifikasi admin.
- **Dashboard** terpisah: Admin, Ustadz, dan Pengelola Entitas.
- **UX konsisten** — dialog konfirmasi **SweetAlert2**, notifikasi **toast** (sukses/error/peringatan), dan semua tabel admin punya **pencarian, filter, sorting, & pagination**.
- **Panduan PDF berdesain** — panduan pengguna, admin, partner usaha + daftar akun ustadz & titik (kredensial, khusus admin) — di dashboard admin.
- **Recycle Bin** (soft-delete + restore ~38 entitas), **Audit Log**, **Notifikasi** in-app.
- **Tema** — 8 tema tampilan yang bisa dipilih pengguna; responsif penuh (sidebar/hamburger di mobile).
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
| UI feedback | SweetAlert2 (dialog + toast), tabel data dengan search/filter/sort/pagination |
| Dokumen | `@react-pdf/renderer` (laporan & panduan PDF berdesain) |
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
| `WA_WEBHOOK_SECRET` | Secret webhook WA Listener → `POST /api/wa/webhook` (samakan di app listener) |
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
npm run db:seed:sample           # (opsional) data nyata Blitar: titik + ustadz + akun + kajian
```

> `db:seed:sample` menulis kredensial akun ke `data/sample-credentials.json` (gitignored) — dipakai PDF "Daftar Akun".

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
| `db:seed` / `db:seed:ai` / `db:seed:uat` / `db:unseed:uat` / `db:seed:sample` | Seeding |

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

## 📄 Panduan PDF (dalam aplikasi)

Dari **Dashboard Admin** (`/admin` → kartu "Panduan & Dokumen") atau langsung:

| Dokumen | Endpoint | Akses |
|---|---|---|
| Panduan Pengguna | `/api/guide/user` | publik |
| Panduan Admin | `/api/guide/admin` | admin |
| Panduan Partner Usaha | `/api/guide/partner` | publik |
| Daftar Akun Ustadz (kredensial) | `/api/guide/akun-ustadz` | admin |
| Daftar Akun Titik (kredensial) | `/api/guide/akun-titik` | admin |

## 📡 WA Listener (terpisah)

App desktop **read-only** (Electron + Baileys) di repo terpisah membaca grup WhatsApp lalu meneruskan ke `POST /api/wa/webhook` (header `x-wa-secret`). AI sisi web mengklasifikasi & mengekstrak → **antrian review** di `/admin/wa`. Tak pernah membalas WA.

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
