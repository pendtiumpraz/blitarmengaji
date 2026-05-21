# Blitar Mengaji — Audit, Nilai Kepuasan & Improvement Plan

> Audit berdasar **scan kode nyata** (70 halaman `page.tsx` + 4 route handler). Status: build & typecheck hijau, semua rute jalan (publik 200, terproteksi 307), tidak ada stub/TODO tersisa di kode.
> Tanggal audit: 2026-05-21.

## 1. Jawaban jujur: apakah 100% complete / tanpa missing page?

**Belum 100% terhadap master plan** (`docs/BLITAR-MENGAJI-BRAINSTORM.md`).
- **Core MVP: ~95% selesai & berfungsi** (DB, auth, RBAC, CRUD penuh + edit + soft delete + pagination, upload Blob, peta, AI multi-provider, PDF, dashboard admin/ustadz/entitas).
- **Cakupan total master plan: ~84%.** Ada beberapa halaman & fitur terencana yang belum dibangun (detail di §3).

## 2. Nilai kepuasan per fitur (penilaian builder)

| Area | Skor | Catatan |
|---|---:|---|
| Fondasi (Neon, Drizzle, NextAuth, RBAC dinamis) | 95 | RBAC super-admin wildcard, soft-delete di 35+ tabel |
| Titik Dakwah + Peta (Leaflet/OSM) | 92 | CRUD+edit, picker lat/lng, gmaps |
| Kajian & Jadwal | 90 | CRUD+edit, cover upload |
| Keuangan + PDF | 88 | ringkasan real, transaksi, bukti, PDF unduh |
| Donasi + PDF | 88 | campaign, laporan, QRIS, WA, PDF |
| Tanya Ustadz | 90 | tanya (anonim), jawab (ustadz) |
| Tanya AI (DeepSeek multi-provider) | 88 | chat + retrieval + sitasi; perlu API key; belum persist/RAG vektor |
| Manajemen AI Provider/Model | 95 | CRUD provider+model+binding, key terenkripsi |
| Galeri & Video | 90 | upload, embed YT/FB, edit, tampil di publik |
| Upload Blob (per-entitas) | 90 | token terenkripsi, FileUpload reusable |
| Dashboard Admin | 90 | lengkap + pagination |
| Dashboard Ustadz | 85 | jawab/catatan/pustaka/kelas |
| Dashboard Kelola (entitas) | 78 | titik/jadwal/galeri/video/lapak/event/media — **belum kas & donasi per-titik** |
| Catatan/Blog & Perpustakaan | 85 | CRUD+edit, render konten, unduh PDF |
| Lapak | 85 | produk (maks 3), WA |
| Partner & Media Partner | 75 | tampil + dashboard video; **belum halaman detail & daftar mandiri** |
| Kelas Online | 70 | CRUD + enroll; **belum pemutar pelajaran/progress** |
| Event/Webinar | 72 | CRUD + daftar; **belum halaman detail** |
| PWA | 85 | manifest, SW, ikon; TWA/APK belum |
| Theming (8 tema) | 60 | token & 8 tema siap; **switcher UI belum di-wire** |
| Recycle Bin / Restore | 20 | soft-delete jalan; **UI restore belum ada** |
| Pendaftaran entitas mandiri | 25 | hanya register jamaah; titik/partner/ustadz belum |
| Konfirmasi pembayaran (admin) | 30 | tombol WA ada; verifikasi admin belum |
| Notifikasi / Pencarian / Reset sandi | 5 | belum dibangun |

**Rata-rata tertimbang (fitur inti diberi bobot lebih): ~84/100.**

## 3. Halaman / fitur yang MASIH KURANG (missing)

### Halaman publik
- [ ] `/(public)/event/[slug]` — detail event/webinar (kini hanya daftar)
- [ ] `/(public)/partner/[slug]` — detail partner/media partner
- [ ] Pemutar pelajaran kelas + tandai selesai/progress (`/kelas/[slug]` baru accordion)
- [ ] Reset kata sandi ("Lupa sandi?" masih mengarah ke `/masuk`)
- [ ] Pencarian global

### Pendaftaran & onboarding entitas
- [ ] Daftar mandiri sebagai **Pengelola Titik / Media Partner / Partner Usaha / Ustadz** (kini register hanya membuat Jamaah; entitas hanya bisa dibuat super-admin)

### Dashboard pengelola (`/kelola`)
- [ ] `/kelola/keuangan` — kas per-titik (kini keuangan hanya di /admin)
- [ ] `/kelola/donasi` — kelola donasi titik sendiri

### Admin / sistem
- [ ] **Recycle Bin / Restore** — pulihkan data ter-soft-delete (infra ada, UI belum)
- [ ] Verifikasi **konfirmasi pembayaran** (tabel `payment_confirmations`) — admin tandai lunas
- [ ] **Audit log** viewer (tabel `audit_logs`)
- [ ] Manajemen **Media/Business Partner** & **Ustadz** sebagai modul admin (kini hanya verifikasi pending di /admin/users)

### AI & lanjutan
- [ ] Persist riwayat chat (`ai_conversations`/`ai_messages`)
- [ ] RAG **pgvector** (kini retrieval ILIKE) + embedding pipeline
- [ ] AI ringkas transcript → catatan (1 klik di /ustadz)

### Lain-lain
- [ ] **Theme switcher** UI (8 tema siap, belum bisa dipilih user)
- [ ] Notifikasi (in-app)
- [ ] OAuth Google: aktif begitu `GOOGLE_CLIENT_ID/SECRET` diisi
- [ ] AI chat live: aktif begitu API key provider diisi via `/admin/ai`
- [ ] Deploy Vercel + TWA→APK

## 4. Improvement Plan (berprioritas)

### Fase 1 — Tutup gap fungsional inti (prioritas tinggi)
1. **Recycle Bin / Restore** (admin) — daftar item terhapus per-entitas + tombol Pulihkan + Hapus permanen.
2. **Daftar mandiri entitas** — form "Jadi Pengelola/Partner/Ustadz" → buat row status `pending` → verifikasi admin (alur verifikasi sudah ada).
3. **`/kelola/keuangan` & `/kelola/donasi`** — pengelola titik kelola kas & donasi sendiri (scope manage_own).
4. **Detail Event `/event/[slug]`** + detail Partner `/partner/[slug]`.

### Fase 2 — Kelengkapan pengalaman
5. **Theme switcher** (8 tema) di header + simpan `users.themePref`.
6. **Pemutar kelas** + progress + tandai selesai.
7. **Reset kata sandi** (token email / link).
8. **Konfirmasi pembayaran** admin (QRIS/WA → tandai lunas + catat ke keuangan).

### Fase 3 — AI & skala
9. **Persist chat** + halaman riwayat.
10. **RAG pgvector** + pipeline embedding (pakai task `embedding` yang sudah ada).
11. **AI ringkas transcript → catatan** (1 klik).
12. **Audit log viewer** + **Notifikasi** in-app.

### Fase 4 — Rilis
13. Deploy **Vercel** (prod), isi env (AI key, Google OAuth).
14. **TWA → APK** (Bubblewrap) dari PWA.
15. QA lintas-perangkat + a11y + SEO.

## 5. Progress Report

| Fase | Lingkup | Status | Estimasi |
|---|---|---|---|
| 0 | Fondasi + DB + Auth + RBAC | ✅ Selesai | — |
| 0 | CRUD semua modul + edit + pagination + soft delete | ✅ Selesai | — |
| 0 | Upload Blob, Peta, PWA, PDF, AI multi-provider, dashboard | ✅ Selesai | — |
| 1 | Recycle bin, daftar entitas, kelola keuangan/donasi, detail event/partner | ✅ **Selesai (2026-05-21)** | 10 agent |
| 2 | Theme switcher, pemutar kelas, reset sandi, konfirmasi bayar | ✅ **Selesai (2026-05-21)** | 8 agent |
| 3 | Persist chat, RAG pgvector, AI ringkas, audit log, notifikasi | ✅ **Selesai (2026-05-21)** | 8 agent |
| 4 | QA menyeluruh + setup APK (TWA) | ✅ **Selesai (2026-05-21)** — lihat docs/QA-REPORT.md & APK-BUILD-GUIDE.md | — |
| 4b | Deploy Vercel + build APK fisik | ⬜ Belum (butuh env prod + Android SDK) | manual |

**Ringkas:** Fase 0 (core) **100% selesai & teruji**. **Fase 1, 2 & 3 selesai** → cakupan master plan naik dari ~84% ke **~99%**. Sisa = Fase 4 (deploy Vercel + TWA→APK + QA rilis) + aktivasi env (API key AI, Google OAuth, layanan email).

### Fase 3 — yang sudah ditambahkan (2026-05-21)
- **Persist chat AI**: percakapan & pesan tersimpan (`ai_conversations`/`ai_messages`); `/tanya-ai` punya sidebar riwayat (buka/lanjut/hapus/chat baru); `/api/ai/chat` balas `conversationId`.
- **RAG pgvector**: `runAIEmbedding` + reindex konten (`/admin/ai` tombol Index) → `content_embeddings`; `searchKnowledge` pakai cosine similarity `embedding <=> query` dgn **fallback ILIKE** bila embedding belum dikonfigurasi.
- **AI ringkas transkrip → catatan**: di `/ustadz/catatan`, paste transkrip → AI (task `summarize`) → isi otomatis judul+body.
- **Audit log**: helper `logAudit` + viewer `/admin/audit` (pagination); terpasang di restore/hard-delete & verifikasi pembayaran.
- **Notifikasi in-app**: `notify()` helper + lonceng di header + `/notifikasi` (tandai dibaca); terpasang saat entitas diverifikasi & pertanyaan dijawab.

### Fase 2 — yang sudah ditambahkan (2026-05-21)
- **Theme switcher** 8 tema: cookie SSR (anti-flash) + simpan `users.themePref`; di header + pemilih tema di `/akun`. Terbukti: cookie `theme=senja` → `data-theme="senja"`.
- **Pemutar kelas** `/kelas/[slug]/belajar` (video/teks/pdf) + tandai selesai (`course_lesson_progress`) + progress bar; halaman **`/belajar-saya`**.
- **Reset kata sandi**: `/lupa-sandi` (buat token di `verification_tokens`; tautan tampil di layar krn belum ada email service) → `/atur-ulang/[token]` (set sandi baru, bcrypt).
- **Konfirmasi pembayaran**: donatur submit bukti di `/donasi/[slug]` → `payment_confirmations` (pending); admin `/admin/pembayaran` verifikasi/tolak → otomatis tambah `collected_amount`.

### Fase 1 — yang sudah ditambahkan (2026-05-21)
- **Recycle Bin** `/admin/sampah` — restore + hapus permanen utk 11 entitas (titik/kajian/donasi/keuangan/posts/library/courses/events/products/media/videos).
- **Daftar mandiri** `/gabung` (+titik/ustadz/media-partner/partner-usaha) → buat row `pending`; **verifyEntity kini meng-assign role** (pengelola-titik/ustadz/media-partner/partner-usaha) otomatis saat admin verifikasi.
- **/akun**: section "Pengajuan Lembaga" + status badge.
- **/kelola/keuangan** (kas per-titik) & **/kelola/donasi** (campaign per-titik) + link nav.
- **Detail** `/event/[slug]` & `/partner/[slug]` + tautan dari daftar.
- CTA "Gabung/Daftarkan Lembaga" di header/footer/beranda.
- Catatan: permission `trash.manage` belum di-seed → hanya super-admin lihat Recycle Bin (cukup utk MVP).
