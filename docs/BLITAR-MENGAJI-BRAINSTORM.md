# 🕌 BLITAR MENGAJI — Brainstorm & Master Plan

> Dokumen perencanaan & brainstorming sebelum eksekusi.
> Status: **DRAFT / DISKUSI** · Terakhir diupdate: 2026-05-20
> Owner: development@privasimu.com

Platform informasi kajian, transparansi keuangan, dan ekosistem dakwah digital
untuk **Blitar**. Gratis, mobile-first, bisa di-webview, dengan RBAC dinamis penuh.

---

## 📑 Daftar Isi
1. [Visi, Misi & Prinsip](#1-visi-misi--prinsip)
2. [Aktor & Akun](#2-aktor--akun)
3. [Daftar Modul / Fitur](#3-daftar-modul--fitur)
4. [RBAC — Role & Permission Dinamis](#4-rbac--role--permission-dinamis)
5. [Tech Stack](#5-tech-stack)
6. [Database / Skema Data](#6-database--skema-data)
7. [Arsitektur Backend](#7-arsitektur-backend)
8. [Arsitektur Frontend](#8-arsitektur-frontend)
9. [UI/UX & Wireframe](#9-uiux--wireframe)
10. [Branding](#10-branding)
11. [Integrasi AI (DeepSeek)](#11-integrasi-ai-deepseek)
12. [Roadmap / Fase Pengembangan](#12-roadmap--fase-pengembangan)
13. [Pertanyaan Terbuka / Keputusan yang Perlu Dibahas](#13-pertanyaan-terbuka--keputusan-yang-perlu-dibahas)

---

## 1. Visi, Misi & Prinsip

**Visi:** Menjadi pusat informasi kajian & dakwah digital terpadu se-Blitar — satu pintu
untuk menemukan majelis ilmu, belajar, bertanya, dan melihat transparansi keuangan.

**Misi:**
- Memudahkan jamaah menemukan **kajian terdekat** (peta + jadwal real-time).
- **Transparansi keuangan** dakwah yang bisa diunduh siapa saja (PDF).
- Mengarsipkan ilmu: **transcript kajian, catatan, perpustakaan PDF, video rekaman**.
- Menghubungkan jamaah ↔ ustadz lewat **Tanya Ustadz** & **AI Assistant**.
- Memberdayakan **partner usaha & media partner** lokal.

**Prinsip desain:**
- 🆓 **Gratis** untuk semua pengguna (tidak ada paywall).
- 📱 **Mobile-first & webview-ready** (dibungkus jadi app via WebView nanti).
- ♿ **Aksesibel & cepat** (LCP rendah, hemat kuota — penting untuk jamaah).
- 🧩 **Modular** — fitur bisa dinyalakan/dimatikan per fase.
- 🔐 **RBAC dinamis** — role bisa dibuat & menu admin diatur tanpa ngoding ulang.

---

## 2. Aktor & Akun

Setiap entitas berikut **bisa punya akun** dan mengelola kontennya sendiri:

| Aktor | Bisa apa saja | Punya halaman publik? |
|---|---|---|
| **Jamaah / User** | Tanya Ustadz (boleh anonim "Hamba Allah"), tanya AI, download PDF, daftar kelas/event, baca catatan | Profil ringan |
| **Ustadz** | Transcript kajian → catatan/blog, jawab Tanya Ustadz (wajib pakai nama), upload PDF perpustakaan, buat kelas online | ✅ Profil ustadz |
| **Pengelola Titik Dakwah** | Kelola jadwal kajian, galeri foto, embed video live YouTube/FB di titiknya | ✅ Halaman titik |
| **Media Partner** | Kelola profil, embed video/livestream, jadwal liputan | ✅ Halaman media |
| **Partner Usaha** | Profil usaha, **lapak (maks 3 produk)**, event/webinar | ✅ Halaman partner |
| **Bendahara** | Input & kelola transaksi keuangan, generate laporan PDF | — (admin) |
| **Penulis** *(fase lanjut)* | Tulis artikel/blog | byline |
| **Admin / Super Admin** | Kelola semua + RBAC, role, menu, settings | — (admin) |

> Catatan: aktor di atas = **profil entitas** yang ditautkan ke `users`. Satu user
> bisa punya satu/lebih role (lihat bagian RBAC).

---

## 3. Daftar Modul / Fitur

### Modul Inti (publik)
1. **Peta Kajian** — semua titik dakwah di peta interaktif (Leaflet/OSM, gratis), filter per kecamatan/topik/hari.
2. **Direktori Titik Dakwah** — detail tiap titik: alamat, jadwal, galeri, video, kontak.
3. **Jadwal Kajian** — kalender + list, filter (hari, ustadz, topik, lokasi, online/offline), reminder.
4. **Detail Kajian** — info kitab/tema, ustadz, lokasi, rekaman video, catatan terkait.
5. **Galeri** — foto per titik kajian / per event.
6. **Video & Livestream** — embed YouTube/Facebook per titik dakwah & per media.
7. **Laporan Keuangan** — transparansi pemasukan/pengeluaran (global + per titik), **download PDF**, grafik ringkas.
8. **Donasi / Penggalangan Dana** — **tiap titik dakwah upload poster donasi sendiri** + target/progress + **status** (aktif/selesai) + **laporan penggunaan dana** (transparan). **QRIS/rekening ditampilkan**; donatur bayar lalu **konfirmasi via WhatsApp** (link `wa.me` prefilled), admin konfirmasi manual → tercatat ke kas titik.
9. **Catatan Kajian (Blog)** — transcript kajian di-styling jadi catatan rapi (UI "buku catatan").
10. **Tanya Ustadz** — tanya jawab; penanya boleh anonim, ustadz wajib pakai nama.
11. **Perpustakaan** — kumpulan PDF (kitab ringkas, materi) yang bisa diunduh; di-upload ustadz.
12. **Kelas Online** — kursus terstruktur (modul → pelajaran video/teks/pdf), enrollment, progress.
13. **Event & Webinar** — manajemen acara partner (offline/online), registrasi peserta.
14. **Lapak** — poster jualan partner usaha (maks 3 produk aktif/partner). Pembeli **pesan & konfirmasi via WhatsApp**; pembayaran **QRIS manual** ke partner (tanpa gateway).
15. **Partner & Media** — direktori media partner & partner usaha.
16. **AI Assistant** — chat tanya kajian/fiqih (DeepSeek), grounded ke konten platform (RAG).

### Modul Admin / Dashboard
16. **Dashboard role-based** — ringkasan sesuai hak akses.
17. **Manajemen RBAC** — role, permission, & **menu admin dinamis**.
18. **Manajemen User & Entitas** — verifikasi akun titik/media/partner/ustadz.
19. **Settings & Branding** — logo, warna, kontak, sosial media, toggle fitur.
21. **Tema / Template UI Dinamis** — banyak tema (skin) yang bisa dipilih **per-user** & ada **default global** (admin). Via CSS variables + `data-theme`. Termasuk dark mode (Senja). (Preview: `docs/ui/themes.html`.)
20. **Audit Log & Notifikasi**.

### Fase Lanjut (nice-to-have)
- Artikel & penulis, komentar/diskusi (moderasi), donasi online via payment gateway (lanjutan dari
  modul Donasi manual), push notification, PWA install, multi-bahasa (ID/Jawa), pencarian global,
  langganan jadwal (kalender .ics), badge/poin jamaah.

---

## 4. RBAC — Role & Permission Dinamis

Ini jantung sistem. Kebutuhanmu: **role bisa ditambah & diatur menu apa saja yang
terlihat di admin**. Maka kita pakai model **permission-based**, bukan role hardcoded.

### Model
```
User ──< UserRole >── Role ──< RolePermission >── Permission
                       │
MenuItem ── (butuh) ── Permission   (menu tampil kalau user punya permission-nya)
```

- **Permission** granular, format `modul.aksi` → `kajian.create`, `finance.report`, dst.
- **Role** = kumpulan permission, bisa dibuat/diedit dari UI.
- **MenuItem** = item menu admin (bisa nested), tampil hanya jika user punya permission terkait.
- **`is_system`** menandai role/permission inti yang tak boleh dihapus (mis. Super Admin).

### Daftar Permission (grup) — draft
| Grup | Permission |
|---|---|
| dashboard | `dashboard.view` |
| kajian | `kajian.view` `kajian.create` `kajian.update` `kajian.delete` `kajian.publish` |
| jadwal | `jadwal.view` `jadwal.manage` |
| titik dakwah | `titik.view` `titik.create` `titik.update` `titik.delete` `titik.manage_own` |
| media | `media.view` `media.manage` `media.manage_own` |
| partner | `partner.view` `partner.manage` `partner.manage_own` |
| ustadz | `ustadz.view` `ustadz.manage` |
| keuangan | `finance.view` `finance.create` `finance.update` `finance.delete` `finance.report` |
| donasi | `donation.view` `donation.create` `donation.manage_own` `donation.manage` `donation.report` |
| galeri | `gallery.view` `gallery.manage` |
| video | `video.view` `video.manage` |
| catatan/blog | `blog.view` `blog.create` `blog.update` `blog.delete` `blog.publish` |
| tanya ustadz | `qa.view` `qa.answer` `qa.manage` `qa.publish` |
| perpustakaan | `library.view` `library.upload` `library.manage` |
| kelas | `course.view` `course.create` `course.manage` `course.enroll` |
| event | `event.view` `event.create` `event.manage` `event.register` |
| lapak | `lapak.view` `lapak.manage` `lapak.manage_own` |
| user | `user.view` `user.manage` |
| rbac | `role.manage` `permission.manage` `menu.manage` |
| AI | `ai.use` `ai.manage` |
| settings | `settings.manage` `theme.manage` `audit.view` |

> Pola `*.manage_own` = hanya boleh kelola data milik entitas sendiri (titik/media/partner/ustadz).
> Logika ownership dicek di layer service (bukan cuma permission).

### Role bawaan (preset, tetap bisa diedit)
- **Super Admin** — semua permission (`is_system`).
- **Admin** — hampir semua kecuali RBAC sensitif.
- **Bendahara** — `finance.*`, `dashboard.view`.
- **Ustadz** — `blog.*`, `qa.answer`, `library.upload`, `course.create`, `kajian.view`.
- **Pengelola Titik** — `titik.manage_own`, `jadwal.manage`, `gallery.manage`, `video.manage`, `donation.manage_own`, `finance.create` (kas titik sendiri).
- **Media Partner** — `media.manage_own`, `video.manage`.
- **Partner Usaha** — `partner.manage_own`, `lapak.manage_own`, `event.create`.
- **Penulis** — `blog.create/update`.
- **Jamaah** (default) — `qa.view`, `ai.use`, `course.enroll`, `event.register`, `library.view`.

---

## 5. Tech Stack

| Layer | Pilihan | Catatan |
|---|---|---|
| Framework | **Next.js (App Router)** | Full-stack, RSC, route handlers. **npm** (bukan pnpm). |
| Bahasa | **TypeScript** | Wajib untuk skala segini. |
| Auth | **NextAuth / Auth.js** (Credentials + secret) | Bukan better-auth. JWT/session strategy. |
| Database | **Neon Postgres** (serverless) | Disediakan user. + extension **pgvector** untuk AI. |
| ORM | **Drizzle ORM** ✅ | Ringan & pas untuk Neon serverless (HTTP driver). *(diputuskan)* |
| Storage | **Vercel Blob** | Foto, PDF, cover, poster. Disediakan user. |
| Styling | **Tailwind CSS** + **shadcn/ui** | Komponen konsisten, mobile-first. |
| Peta | **react-leaflet + OpenStreetMap** | Gratis, tanpa API key berbayar. |
| Editor teks | **Tiptap** | Untuk catatan/blog kaya format. |
| PDF | **@react-pdf/renderer** / pdf-lib | Generate laporan keuangan & arsip. |
| Video | iframe embed + react-player | YouTube & Facebook (FB perlu SDK/oEmbed). |
| AI | **DeepSeek API** (`deepseek-chat` / v4-flash / v4-pro) | Chat + RAG via pgvector. |
| Validasi | **Zod** | Schema validation FE+BE. |
| State server | **TanStack Query** (opsional) | Caching data client. |
| Deploy | **Vercel** | Sinkron dengan Neon + Blob. |
| Hosting media besar | Vercel Blob | Video TIDAK di-host (pakai embed YT/FB). |

> Keputusan yang sudah fix dari user: **npm**, **Next.js full**, **NextAuth (secret)**,
> **Neon Postgres**, **Vercel Blob**. Sisanya rekomendasi & bisa didiskusikan.

---

## 6. Database / Skema Data

> Notasi ringkas. PK = `id` (uuid/serial). FK pakai `_id`. Semua tabel punya
> `created_at`, `updated_at` kecuali disebut lain.
> **Detail lengkap (soft delete + restore/recycle bin, storage Blob per-user/entitas,
> pembayaran QRIS+WA) ada di [`DATABASE-ARCHITECTURE.md`](DATABASE-ARCHITECTURE.md)** —
> sudah diterapkan ke `db/schema.ts` (soft delete di 35 tabel + `storage_configs` +
> `payment_methods`/`payment_confirmations`).

### 6.1 Auth & RBAC
```
users(id, name, email[unique], password_hash, phone, image, status[active/pending/banned],
      theme_pref[null=ikuti default], email_verified_at, created_at, updated_at)
accounts(...)            -- NextAuth (opsional, jika OAuth nanti)
sessions(...)            -- NextAuth
verification_tokens(...) -- NextAuth

roles(id, name, slug[unique], description, is_system[bool])
permissions(id, key[unique], group, label, description)
role_permissions(role_id, permission_id)            -- PK gabungan
user_roles(user_id, role_id)                         -- PK gabungan (multi-role)
menu_items(id, parent_id, label, icon, path, permission_key, order, is_active)
```

### 6.2 Entitas / Profil
```
titik_dakwah(id, name, slug, description, address, kelurahan, kecamatan,
             latitude, longitude, cover_image, logo_url, contact_phone, contact_email,
             report_template[slug, mis. 'kop-resmi'], report_accent[hex warna],
             ketua_name, bendahara_name,  -- untuk tanda tangan laporan PDF
             owner_user_id, status[active/pending], verified_at)
ustadz_profiles(id, user_id, name, slug, bio, photo, specialization, status)
media_partners(id, name, slug, logo, description, website, social_json,
               owner_user_id, status)
business_partners(id, name, slug, logo, description, category, contact_wa,
                  owner_user_id, status)
```

### 6.3 Kajian, Jadwal & Media
```
kajian(id, title, slug, description, ustadz_id, titik_dakwah_id, category_id,
       kitab, type[offline/online/hybrid], cover_image, status[draft/published])
kajian_schedules(id, kajian_id, titik_dakwah_id, title, start_at, end_at,
                 recurrence_rule[RRULE|null], is_online, stream_url, status)
categories(id, name, slug, type[kajian/blog/library/qa])   -- kategori generik

-- Media generik (Vercel Blob) -- polymorphic owner
media_assets(id, owner_type[titik/kajian/event/...], owner_id, kind[image/pdf/doc],
             url, blob_key, caption, order, size, mime, uploaded_by)

videos(id, owner_type[titik/media/partner/kajian], owner_id, platform[youtube/facebook],
       source_url, embed_id, title, is_live, recorded_at)
```

### 6.4 Keuangan
```
finance_categories(id, name, type[income/expense])
finance_transactions(id, titik_dakwah_id[null=global], category_id, type[income/expense],
                     amount, description, trx_date, proof_url, created_by, status[posted/draft])
finance_reports(id, title, scope[global/titik], titik_dakwah_id[null], period_start,
                period_end, template[slug], pdf_url, total_income, total_expense, published_at)
   -- tiap masjid pilih template laporan sendiri (6+ pilihan) + logo + warna aksen → render PDF

-- Donasi / penggalangan dana per titik dakwah
donation_campaigns(id, titik_dakwah_id, title, slug, poster_image, description,
                   target_amount, collected_amount, status[active/completed/closed],
                   start_at, end_at, qris_image, contact_link, created_by, verified_at)
donation_updates(id, campaign_id, title, body, amount_used, attachment_url, created_at)
   -- laporan/penggunaan dana per campaign (transparansi ke publik)
donation_records(id, campaign_id, donor_name, is_anonymous, amount, note,
                 recorded_by, recorded_at)
   -- pencatatan donasi masuk (manual); opsional sinkron ke finance_transactions kas titik

-- Pembayaran QRIS + konfirmasi WhatsApp (donasi & lapak) — bukan gateway
payment_methods(id, owner_type[titik/partner/global], owner_id, qris_image,
                bank_name, account_no, account_name, wa_number)
payment_confirmations(id, type[donation/order], ref_id, payer_name, is_anonymous,
                      amount, proof_url, wa_link, status[pending/confirmed/rejected],
                      confirmed_by, confirmed_at, created_at)
   -- user bayar via QRIS → klik "Konfirmasi via WhatsApp" (wa.me prefilled) → admin konfirmasi manual
```

### 6.5 Konten Komunitas
```
posts(id, title, slug, type[catatan/artikel], kajian_id[null], author_user_id,
      content_rich, excerpt, cover_image, status[draft/published], published_at, views)
post_categories(post_id, category_id)
post_tags(post_id, tag_id) · tags(id, name, slug)

questions(id, user_id[null], asker_name, is_anonymous[bool], title, body, category_id,
          status[pending/answered/published], assigned_ustadz_id[null], created_at)
answers(id, question_id, ustadz_id, body, created_at)   -- nama ustadz selalu tampil

library_items(id, title, description, author, ustadz_id[uploader], category_id,
              pdf_url, blob_key, cover_image, file_size, downloads, status)
```

### 6.6 Belajar & Acara
```
courses(id, title, slug, description, ustadz_id, cover_image, level, status)
course_modules(id, course_id, title, order)
course_lessons(id, module_id, title, kind[video/text/pdf], content, video_url, order, duration)
enrollments(id, course_id, user_id, progress, enrolled_at)
lesson_progress(id, enrollment_id, lesson_id, completed_at)

events(id, title, slug, description, organizer_type[partner/internal], organizer_id,
       kind[webinar/offline/hybrid], cover_image, start_at, end_at, location, online_url,
       capacity, needs_registration, status)
event_registrations(id, event_id, user_id, name, email, status, registered_at)
```

### 6.7 Lapak
```
products(id, business_partner_id, title, poster_image, description, price, contact_link,
         status, created_at)
-- Aturan: maks 3 produk aktif per partner → divalidasi di service + (opsional) partial index.
```

### 6.8 AI & Sistem
```
ai_conversations(id, user_id[null], title, created_at)
ai_messages(id, conversation_id, role[user/assistant/system], content, model, tokens)
content_embeddings(id, source_type, source_id, chunk_text, embedding vector(1024))  -- pgvector

settings(key[unique], value_json)   -- termasuk `default_theme`, toggle fitur, branding
ui_themes(id, name, slug[unique], tokens_json, is_active, is_system)  -- tema bawaan + custom admin
audit_logs(id, user_id, action, entity, entity_id, meta_json, created_at)
notifications(id, user_id, type, payload_json, read_at, created_at)
```

### Diagram Relasi (high-level)
```
users ──< user_roles >── roles ──< role_permissions >── permissions
  │                         └── menu_items (via permission_key)
  ├── ustadz_profiles ──< kajian ──< kajian_schedules
  │        ├──< answers           └── titik_dakwah ──< media_assets / videos
  │        ├──< library_items     
  │        └──< courses ──< course_modules ──< course_lessons ──< lesson_progress
  ├── questions ──< answers
  ├── enrollments / event_registrations
  └── titik_dakwah / media_partners / business_partners (owner_user_id)
                                            └── products (lapak) / events
finance_transactions ──> finance_categories ; finance_reports
content_embeddings (RAG) <── posts / library_items / kajian / answers
```

---

## 7. Arsitektur Backend

- **Pola:** Next.js Route Handlers (`app/api/*`) + **Server Actions** untuk mutasi form.
- **Layering:** `route/action` → `service` (logika bisnis + cek permission/ownership) → `repository` (Drizzle) → DB.
- **Auth guard:** middleware + helper `requirePermission('finance.report')` dan `requireOwnership(entity)`.
- **Validasi:** Zod schema dipakai bersama FE & BE.
- **Upload:** client → request signed URL → upload ke **Vercel Blob** → simpan metadata ke `media_assets`.
- **PDF:** generate on-demand (laporan keuangan) → simpan snapshot ke Blob → URL publik.
- **AI:** endpoint streaming (`/api/ai/chat`) → retrieve embeddings (pgvector) → panggil DeepSeek → stream balik.
- **Rate limiting** untuk endpoint AI & form publik (cegah abuse).
- **Audit log** otomatis untuk aksi sensitif (keuangan, RBAC, hapus data).
- **Seeding:** script seed untuk permission, role bawaan, menu, super admin awal.

---

## 8. Arsitektur Frontend

### Struktur Route (App Router)
```
app/
├─ (public)/
│   ├─ page.tsx                 # Beranda
│   ├─ peta/                    # Peta kajian
│   ├─ jadwal/                  # Kalender + list
│   ├─ titik/[slug]/            # Detail titik dakwah
│   ├─ kajian/[slug]/
│   ├─ catatan/[slug]/          # Blog/catatan
│   ├─ tanya-ustadz/            # list + form + [slug]
│   ├─ perpustakaan/
│   ├─ kelas/[slug]/
│   ├─ event/[slug]/
│   ├─ lapak/
│   ├─ partner/                 # direktori media & partner usaha
│   ├─ keuangan/                # transparansi + download PDF
│   └─ tentang/
├─ (auth)/ masuk · daftar · lupa-password
├─ akun/                        # dashboard ringan jamaah
├─ admin/                       # dashboard role-based (menu dinamis dari RBAC)
│   └─ [...modul]/
└─ api/
```

- **Layout:** `PublicLayout` (navbar + footer + bottom-nav mobile), `AdminLayout` (sidebar dinamis dari `menu_items`), `AccountLayout`.
- **Komponen kunci:** `KajianCard`, `MapView`, `ScheduleCalendar`, `VideoEmbed`, `FinanceChart`,
  `NoteReader` (UI catatan), `QnAThread`, `PdfCard`, `CoursePlayer`, `ProductPoster`, `AiChatWidget`.
- **Mobile-first:** bottom navigation (Beranda · Peta · Jadwal · Tanya · Akun), sheet/drawer untuk filter.
- **Webview-ready:** hindari popup yang bermasalah di WebView, target tap ≥44px, dukung deep-link.
- **Performance:** RSC + streaming, `next/image` + Blob, lazy-load peta & video.
- **Theming:** multi-tema via **CSS variables + `data-theme`** pada `<html>`; preferensi per-user (`users.theme_pref`) + default global (`settings.default_theme`); SSR baca cookie/pref agar tanpa "kedip". Tambah tema = 1 blok token. Tema custom admin bisa disimpan di `ui_themes`. (Lihat `docs/ui/themes.html`.)

---

## 9. UI/UX & Wireframe

### Prinsip UX
- Tenang, bersih, "khusyuk" tapi modern. Banyak white space, ikon lembut, sudut membulat.
- Hierarki jelas: cari kajian → lihat detail → ikuti/tanya.
- Empty state ramah ("Belum ada kajian di area ini, coba perluas filter").

### Wireframe — Beranda (mobile)
```
┌───────────────────────────┐
│  ☰   BLITAR MENGAJI    🔔  │
├───────────────────────────┤
│  [ Cari kajian / ustadz ]  │
│                            │
│  🗺️ Kajian Terdekat        │
│  ┌──────────────────────┐  │
│  │  (mini map preview)  │  │
│  └──────────────────────┘  │
│                            │
│  📅 Jadwal Hari Ini        │
│  • 18.00 Tafsir — Masjid A │
│  • 20.00 Fiqih — Mushola B │
│                            │
│  ▶️ Live & Rekaman Terbaru │
│  [▦] [▦] [▦]  →            │
│                            │
│  📝 Catatan Kajian Pilihan │
│  💰 Transparansi Keuangan  │
│  🤝 Partner & Lapak        │
├───────────────────────────┤
│ 🏠   🗺️   📅   💬   👤      │  ← bottom nav
└───────────────────────────┘
```

### Wireframe — Detail Titik Dakwah
```
┌───────────────────────────┐
│ ‹  Masjid Al-Falah         │
│ [ cover image ]            │
│ 📍 Kepanjenkidul, Blitar   │
│ [Jadwal] [Galeri] [Video]  │  ← tabs
│ ───────────────────────────│
│ Jadwal rutin:              │
│  • Senin 18.00 Tafsir      │
│  • Jumat 20.00 Hadits      │
│  [+ Tambah ke kalender]    │
│ Galeri: [▦][▦][▦][▦]       │
│ Video:  [▶ live] [▶ rec]   │
└───────────────────────────┘
```

### Wireframe — Tanya Ustadz
```
┌───────────────────────────┐
│ Tanya Ustadz               │
│ [ Ajukan Pertanyaan + ]    │
│ Filter: [Belum dijawab ▾]  │
│ ───────────────────────────│
│ ❓ Hukum qadha shalat?      │
│    oleh Hamba Allah        │
│    ✅ Dijawab Ust. Fulan    │
│ ───────────────────────────│
│ ❓ Zakat profesi…          │
│    oleh Budi · ⏳ menunggu  │
└───────────────────────────┘
Form: judul, isi, kategori, [✓ Kirim sebagai Hamba Allah (anonim)]
```

### Wireframe — Admin (menu dinamis dari RBAC)
```
┌──────────┬────────────────────────────┐
│ SIDEBAR  │  Dashboard                  │
│ (dinamis)│  ┌─────┐ ┌─────┐ ┌─────┐    │
│ ▸ Kajian │  │Kajian│ │Jamaah│ │Saldo│  │
│ ▸ Jadwal │  └─────┘ └─────┘ └─────┘    │
│ ▸ Keu.   │  Grafik keuangan / aktivitas │
│ ▸ Tanya  │                              │
│ ▸ RBAC   │  Tabel data + aksi           │
│ ▸ Setting│                              │
└──────────┴────────────────────────────┘
(item sidebar hanya muncul bila user punya permission-nya)
```

> **Annotation & screenshot:** tiap layar utama akan dibuat versi annotated (panah +
> keterangan interaksi) dan screenshot saat dev untuk QA & dokumentasi. Disimpan di
> `docs/ui/` (mis. `docs/ui/home-annotated.png`).

---

## 10. Branding

- **Nama:** Blitar Mengaji
- **Tagline (kandidat):**
  - "Menyalakan Majelis Ilmu di Blitar Raya"
  - "Satu Kota, Sejuta Cahaya Ilmu"
  - "Dekatkan Diri pada Ilmu & Majelis"
- **Tone:** hangat, teduh, terpercaya, inklusif (cocok untuk "Hamba Allah").
- **Palet warna (kandidat):**
  - Primary: **Hijau Zaitun/Emerald** `#0E6E55` (teduh, identik Islami modern)
  - Accent: **Emas lembut** `#C9A227` (untuk highlight/CTA)
  - Netral: krem `#F7F5EF`, slate `#1F2A37` (teks)
  - Status: success/danger/warn standar
- **Tipografi:**
  - UI/Heading: **Plus Jakarta Sans** atau Inter (modern, lokal-friendly)
  - Ayat/Arab: **Amiri** / Scheherazade New
- **Logo (konsep):** monogram "BM" berpadu siluet kubah + buku terbuka; atau bulan sabit halus.
- **Ikon:** Lucide (konsisten, open-source).
- **Nuansa "catatan":** untuk blog/transcript → latar kertas, garis tipis, font baca nyaman, lebar baca optimal (~70ch).

---

## 11. Integrasi AI (DeepSeek)

**Tujuan:** user bisa tanya seputar kajian & fiqih ("jelaskan fiqih thaharah", "rangkum kajian X").

- **Model:** `deepseek-chat` (umum), `deepseek-v4-flash` (cepat/murah), `deepseek-v4-pro` (jawaban dalam) — pilih per kebutuhan/route.
- **Pendekatan: RAG (Retrieval-Augmented Generation)** agar jawaban **bersumber dari konten platform** (catatan kajian, perpustakaan, jawaban ustadz):
  1. Index konten → embedding → simpan di `content_embeddings` (pgvector).
  2. Query user → cari potongan relevan → kirim ke DeepSeek sebagai konteks.
  3. Tampilkan jawaban + **sitasi sumber** (link ke catatan/kitab terkait).
- **Guardrail:** system prompt menegaskan tone santun, hati-hati pada masalah khilafiyah,
  arahkan ke **Tanya Ustadz** untuk hukum yang sensitif/personal. Tampilkan disclaimer
  "jawaban AI, verifikasi ke ustadz".
- **UX:** widget chat mengambang + halaman `/tanya-ai`. Streaming jawaban. History per user (opsional).
- **Biaya/abuse:** rate-limit per user/IP, batasi panjang konteks.
- **Fase:** MVP boleh tanpa RAG (system prompt + few-shot), lalu upgrade ke RAG.

---

## 12. Roadmap / Fase Pengembangan

| Fase | Fokus | Modul |
|---|---|---|
| **0 — Fondasi** | Setup & kerangka | Next.js+TS, Tailwind+shadcn, Drizzle+Neon, NextAuth, **RBAC dinamis**, layout, branding, seed |
| **1 — Inti Kajian** | Nilai utama platform | Titik dakwah, Peta, Jadwal/Kalender, Kajian, Galeri, Video embed, **Laporan Keuangan + PDF**, **Donasi per titik (poster+status+laporan)** |
| **2 — Komunitas** | Interaksi & ilmu | Tanya Ustadz, Catatan/Blog (Tiptap), Perpustakaan PDF |
| **3 — Ekosistem** | Partner & media | Direktori Partner/Media, **Lapak (maks 3)**, Event/Webinar |
| **4 — Belajar** | Pendidikan | Kelas Online (modul, lesson, progress) |
| **5 — AI** | Asisten cerdas | DeepSeek chat → RAG + sitasi |
| **6 — Lanjutan** | Polish & growth | Artikel/Penulis, PWA/WebView build, notifikasi, donasi/infaq, pencarian global |

> Setiap fase: desain → wireframe/annotate → implement → screenshot QA → review.

---

## 13. Decision Log & Pertanyaan Terbuka

### ✅ Keputusan yang sudah diambil (2026-05-20)
| # | Topik | Keputusan |
|---|---|---|
| D1 | **ORM** | **Drizzle ORM** (ringan, pas Neon serverless). |
| D2 | **Lingkup keuangan** | **Global + Per Titik** — ada kas pusat Blitar Mengaji DAN kas per titik dakwah. (Skema sudah mendukung via `finance_transactions.titik_dakwah_id` null = global; `finance_reports.scope`.) |
| D3 | **Role per user** | **Multi-role** — satu user bisa punya banyak role (tabel `user_roles`), permission digabung. |
| D4 | **Strategi AI** | **Chat dulu** (system prompt + guardrail) di MVP, **upgrade RAG (pgvector + sitasi) di Fase 5**. |
| D5 | **Package manager / framework / auth / db / storage** | **npm**, **Next.js full**, **NextAuth (secret)**, **Neon Postgres**, **Vercel Blob** (dari user). |
| D6 | **Verifikasi akun entitas** | **Daftar mandiri + verifikasi admin** — titik/media/partner/ustadz daftar sendiri (status `pending`), admin verifikasi sebelum aktif. |
| D7 | **Lapak** | Maks **3 produk aktif** per partner (boleh hapus/ganti, bukan limit seumur hidup). |
| D8 | **Donasi** | **Per titik dakwah**: tiap titik upload poster donasi sendiri + target/status + **laporan penggunaan dana**. Pencatatan donasi masuk **manual** dulu (bukan payment gateway); QRIS/rekening ditampilkan. Donasi online via gateway = fase lanjut. |
| D9 | **Komentar/diskusi** | **Nonaktif dulu** (hindari beban moderasi); interaksi lewat Tanya Ustadz. Aktifkan + moderasi di fase lanjut. |
| D10 | **Peta** | **OpenStreetMap + Leaflet** (gratis, tanpa API key berbayar). |
| D11 | **Bahasa** | **Indonesia dulu**; struktur disiapkan agar mudah i18n (ID/Jawa) nanti. |
| D12 | **Deploy / Mobile** | **Vercel + PWA dulu**, bungkus WebView/TWA di Fase 6. |
| D13 | **Tema/Template UI** | **Multi-tema dinamis** (skin) via CSS variables + `data-theme`. Default = Teduh (Hijau+Emas, identitas utama). Tema lain (Modern/Earthy/Elegan/Minimalis/Senja-dark) = personalisasi per-user. Tema custom admin = `ui_themes`. |
| D14 | **Pembayaran (donasi & lapak)** | **QRIS + konfirmasi manual via WhatsApp** — BUKAN payment gateway di MVP. Tiap titik/partner menampilkan gambar QRIS + rekening; user bayar lalu klik tombol **"Konfirmasi via WhatsApp"** (link `wa.me` prefilled berisi detail donasi/pesanan + opsi unggah bukti). Admin/pengelola konfirmasi manual → status `confirmed`. Gateway otomatis (Midtrans/Xendit) = fase lanjut. |
| D15 | **Arah visual (craft)** | Hindari kesan "AI generik": pakai **ornamen Islami SVG** (girih/arabesque/trellis), **logo mihrab vektor** buatan sendiri, tipografi display berkarakter (Fraunces + Reem Kufi + Amiri), palet **parchment hangat**, siluet masjid, blok ayat ber-mihrab sebagai sentuhan orisinal. Referensi: `docs/ui/craft.html` + `docs/ui/ornaments.css`. |

### ❓ Masih perlu dibahas
1. **Domain:** sudah punya domain untuk produksi? (untuk setup deploy & env).
2. **WebView build:** target Android dulu (TWA) atau langsung Android+iOS (Capacitor)? Diputuskan di Fase 6.
3. **Reminder jadwal & notifikasi:** cukup email/in-app, atau perlu push notification (butuh setup tersendiri)?
4. **Moderasi konten entitas:** apakah catatan/poster/lapak yang diupload entitas perlu approve admin sebelum tayang, atau langsung tayang setelah akun terverifikasi?

---

*Dokumen ini hidup — kita revisi bareng tiap ada keputusan baru sebelum mulai ngoding.*
