# 🚀 Eksekusi Fase 0 — Fondasi Blitar Mengaji

> Panduan langkah-demi-langkah menyiapkan kerangka proyek (Next.js + TypeScript +
> Tailwind + Drizzle + Neon + NextAuth + Vercel Blob) sampai bisa `npm run dev`,
> RBAC ter-seed, dan tema dinamis siap.
> Referensi desain: `docs/BLITAR-MENGAJI-BRAINSTORM.md`.

Status: panduan untuk dijalankan **secara manual** (file kode fondasi sudah ditulis:
`db/schema.ts`, `db/seed.ts`, `drizzle.config.ts`, `.env.example`).

---

## 0. Prasyarat

- **Node.js** ≥ 20 LTS dan **npm** ≥ 10 (cek: `node -v`, `npm -v`).
- Akun **Neon** (Postgres serverless) → buat 1 project + 1 database.
  - Di SQL editor Neon jalankan sekali: `CREATE EXTENSION IF NOT EXISTS vector;`
    (untuk kolom `content_embeddings.embedding` / RAG di Fase 5).
- Akun **Vercel** + store **Blob** (Storage → Create → Blob) → ambil `BLOB_READ_WRITE_TOKEN`.
- (Opsional, Fase 5) API key **DeepSeek**.
- Editor: VS Code disarankan.

---

## 1. Inisialisasi Proyek Next.js

> Jalankan di folder kerja (root repo). Pakai **npm** (keputusan D5).

```bash
npx create-next-app@latest . \
  --typescript \
  --app \
  --tailwind \
  --eslint \
  --import-alias "@/*" \
  --use-npm
```

Catatan jawaban prompt:
- TypeScript: **Yes**
- App Router: **Yes**
- Tailwind CSS: **Yes**
- `src/` directory: **opsional** (boleh Yes agar rapi; sesuaikan path alias).
- Turbopack: boleh Yes.
- Import alias: `@/*`.

> Jika folder sudah berisi `docs/` & `db/`, `create-next-app` ke `.` tetap aman —
> ia hanya menambah file proyek. Pertahankan `db/`, `docs/`, `drizzle.config.ts`,
> `.env.example` yang sudah ada.

---

## 2. Install Dependency Tambahan

```bash
# Database / ORM / Auth
npm install drizzle-orm @neondatabase/serverless next-auth bcryptjs zod dotenv
npm install -D drizzle-kit tsx @types/bcryptjs

# UI / ikon / komponen
npm install lucide-react class-variance-authority clsx tailwind-merge
# shadcn/ui (init terpisah, lihat langkah 6)

# Editor teks (catatan/blog — Fase 2)
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit

# Peta (Fase 1)
npm install react-leaflet leaflet
npm install -D @types/leaflet

# PDF (laporan keuangan — Fase 1)
npm install @react-pdf/renderer
# alternatif ringan: npm install pdf-lib

# Storage
npm install @vercel/blob

# (Opsional) caching data client
npm install @tanstack/react-query
```

> Wajar bila beberapa paket baru terpasang sekarang — file `db/schema.ts` & `db/seed.ts`
> sudah mengimpor `drizzle-orm`, `@neondatabase/serverless`, `bcryptjs`, dll.

---

## 3. Konfigurasi Kredensial (.env.local)

1. Salin `.env.example` → `.env.local`.
2. Isi nilainya:
   - `DATABASE_URL` = connection string Neon (gunakan yang **pooled** untuk runtime,
     boleh non-pooled untuk migrasi). Format: `postgresql://user:pass@host/db?sslmode=require`.
   - `NEXTAUTH_SECRET` = hasil `openssl rand -base64 32`.
   - `NEXTAUTH_URL` = `http://localhost:3000`.
   - `BLOB_READ_WRITE_TOKEN` = dari Vercel Blob.
   - `DEEPSEEK_API_KEY` = (boleh kosong dulu).
   - `SUPERADMIN_EMAIL` = email admin pertama (mis. `development@privasimu.com`).
   - `SUPERADMIN_PASSWORD` = password sementara (GANTI setelah login pertama).

> `.env.local` otomatis di-gitignore oleh Next.js. Jangan commit.

---

## 4. Tambah Script npm

Tambahkan ke `package.json` → `"scripts"`:

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx db/seed.ts"
  }
}
```

---

## 5. Generate & Push Schema, lalu Seed

Urutan eksekusi:

```bash
# (a) generate file migration SQL dari db/schema.ts -> folder drizzle/
npm run db:generate

# (b) push schema ke Neon (membuat semua tabel + enum)
npm run db:push
#   Alternatif berbasis migration: terapkan SQL hasil generate (push lebih cepat untuk dev).

# (c) seed data fondasi: permissions, roles, menu, super admin, 8 tema, default_theme
npm run db:seed

# (d) jalankan dev server
npm run dev
```

Verifikasi:
- `npm run db:studio` → cek tabel `permissions` (≈70 baris), `roles` (9), `ui_themes` (8),
  `users` (1 super admin), `settings` (`default_theme = "teduh"`).
- Buka `http://localhost:3000`.

> Jika `db:push` error soal `vector(1024)`: pastikan `CREATE EXTENSION vector;` sudah
> dijalankan di Neon (langkah 0).

---

## 6. shadcn/ui & Tema

```bash
npx shadcn@latest init
# pilih: base color netral, CSS variables: Yes
npx shadcn@latest add button card input dialog dropdown-menu sheet table tabs badge
```

---

## 7. Rencana Struktur Folder `app/`

```
app/
├─ (public)/            # halaman publik (navbar + footer + bottom-nav mobile)
│   ├─ page.tsx         # Beranda
│   ├─ peta/            # Peta kajian (Leaflet)
│   ├─ jadwal/          # Kalender + list
│   ├─ titik/[slug]/    # Detail titik dakwah
│   ├─ kajian/[slug]/
│   ├─ catatan/[slug]/  # Blog/catatan
│   ├─ tanya-ustadz/
│   ├─ perpustakaan/
│   ├─ kelas/[slug]/
│   ├─ event/[slug]/
│   ├─ lapak/
│   ├─ partner/
│   ├─ keuangan/        # transparansi + download PDF
│   └─ tentang/
├─ (auth)/              # masuk · daftar · lupa-password
├─ akun/                # dashboard ringan jamaah
├─ admin/               # dashboard role-based (sidebar dinamis dari menu_items)
│   └─ [...modul]/
└─ api/                 # route handlers
    ├─ auth/[...nextauth]/
    ├─ ai/chat/         # streaming DeepSeek (Fase 5)
    └─ blob/            # signed URL upload

# Pendukung (di luar app/):
db/        # schema.ts, seed.ts, (client.ts -> drizzle instance untuk runtime)
lib/       # auth.ts (NextAuth config), rbac.ts (requirePermission/ownership), zod schemas
components/ # KajianCard, MapView, ScheduleCalendar, VideoEmbed, dll
```

> Catatan: buat `db/client.ts` yang mengekspor instance `drizzle(neon(DATABASE_URL), { schema })`
> agar dipakai bersama oleh service/route (terpisah dari `seed.ts`).

---

## 8. Integrasi Tema Dinamis

Sumber token: `docs/ui/theme-tokens.css` (8 tema: teduh, modern, earthy, elegan,
minimalis, samudra, klasik, senja). Mekanisme: CSS variables + `data-theme` pada `<html>`.

Langkah:
1. **Pindahkan token** dari `docs/ui/theme-tokens.css` ke `app/globals.css`
   (atau import sebagai file CSS terpisah). Pertahankan blok `:root`/`[data-theme="..."]`.
2. **Tailwind v4**: definisikan warna brand memetakan ke CSS variable. Contoh di
   `globals.css` (Tailwind v4 `@theme inline`):
   ```css
   @import "tailwindcss";
   @theme inline {
     --color-brand-600: var(--c-brand-600);
     --color-gold: var(--c-gold);
     --color-cream: var(--c-cream);
     --color-surface: var(--c-surface);
     --color-ink: var(--c-ink);
   }
   ```
   (Untuk Tailwind v3: petakan di `tailwind.config` → `theme.extend.colors` ke `var(--c-*)`.)
3. **SSR tanpa kedip**: di root layout, baca preferensi tema dari cookie / `users.theme_pref`
   (fallback `settings.default_theme = 'teduh'`) lalu set `<html data-theme={theme}>`.
4. **Per-user**: simpan pilihan ke `users.theme_pref`; default global di `settings.default_theme`.
   Tema custom admin disimpan di tabel `ui_themes` (sudah ter-seed 8 tema bawaan).
5. (Opsional) gunakan `docs/ui/theme-switcher.js` sebagai referensi logika ganti tema.

---

## 9. NextAuth (Credentials)

- Buat `lib/auth.ts` dengan provider **Credentials** (email + password):
  cari user via Drizzle, verifikasi `bcryptjs.compare(password, passwordHash)`.
- Strategy: **JWT**. Sisipkan `roles` & `permissions` gabungan ke token/session
  (query `user_roles` → `role_permissions` → `permissions`).
- Route handler: `app/api/auth/[...nextauth]/route.ts`.
- Helper `requirePermission(key)` & `requireOwnership(entity)` di `lib/rbac.ts`
  (cek permission dari session; ownership dicek di service untuk pola `*.manage_own`).

---

## ✅ Checklist Akhir Fase 0

- [ ] `npx create-next-app` selesai (TS + App Router + Tailwind + npm).
- [ ] Semua dependency tambahan terpasang tanpa error.
- [ ] `.env.local` terisi (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, BLOB token, super admin).
- [ ] Extension `pgvector` aktif di Neon.
- [ ] `npm run db:generate` & `npm run db:push` sukses → semua tabel + enum terbentuk.
- [ ] `npm run db:seed` sukses → permissions (~70), roles (9), menu_items (9),
      ui_themes (8), 1 super admin, `settings.default_theme = teduh`.
- [ ] `npm run dev` jalan; `http://localhost:3000` terbuka.
- [ ] shadcn/ui ter-init; komponen dasar tersedia.
- [ ] Tema dinamis aktif (token dipindah ke `globals.css`, `data-theme` di `<html>`).
- [ ] NextAuth Credentials bisa login sebagai Super Admin (lalu **ganti password**).
- [ ] Layout dasar: `PublicLayout`, `AdminLayout` (sidebar dinamis), `AccountLayout`.
- [ ] Struktur folder `app/` & `db/client.ts` disiapkan untuk Fase 1.

> Setelah checklist hijau → lanjut **Fase 1 — Inti Kajian** (Titik dakwah, Peta, Jadwal,
> Kajian, Galeri, Video, Laporan Keuangan + PDF, Donasi per titik).
