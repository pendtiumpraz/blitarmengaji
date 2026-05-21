# 🗄️ Blitar Mengaji — Arsitektur Database (Revisi)

> Pendamping Bagian 6 di `BLITAR-MENGAJI-BRAINSTORM.md`. Fokus: **konvensi**,
> **soft delete + restore (recycle bin)**, **penyimpanan Blob per-user/entitas**,
> dan **pembayaran QRIS + konfirmasi WhatsApp**.
> Stack: **Neon Postgres + Drizzle ORM**. Status: draft acuan eksekusi.

---

## 1. Konvensi Umum
- **Primary key:** `id uuid` (default `gen_random_uuid()`), kecuali NextAuth.
- **Waktu:** `created_at timestamptz default now()`, `updated_at timestamptz` (di-update di app/trigger).
- **FK:** kolom `*_id` dengan `references()` + `on delete` sesuai (umumnya `set null`/`restrict`, BUKAN cascade keras — kita pakai soft delete).
- **Enum:** `pgEnum` untuk status/tipe (mis. `status`, `trx_type`).
- **Uang:** `numeric(14,2)` (atau bigint rupiah). **Vektor AI:** `vector(1024)` (pgvector).
- **JSON:** `jsonb` untuk konfigurasi/metadata.
- **Audit:** `audit_logs` mencatat aksi sensitif (create/update/delete/restore, keuangan, RBAC).

---

## 2. Soft Delete + Restore (Recycle Bin)  ⭐
Semua **tabel entitas/konten** mendukung soft delete agar bisa dipulihkan.

### Kolom standar (ditambahkan ke setiap tabel entitas)
```
deleted_at  timestamptz NULL      -- NULL = aktif; terisi = di-"sampah"-kan
deleted_by  uuid NULL → users.id  -- siapa yang menghapus
```
- **Default query** SELALU `WHERE deleted_at IS NULL` (dibungkus helper repo, mis. `notDeleted()`).
- **Hapus** = set `deleted_at = now(), deleted_by = :user` (bukan DELETE fisik).
- **Restore** = set `deleted_at = NULL, deleted_by = NULL`.
- **Hapus permanen (purge)** = DELETE fisik, hanya oleh role berwenang / job terjadwal.

### Unique + soft delete
Slug/kode unik pakai **partial unique index** agar slug bekas bisa dipakai lagi:
```
UNIQUE (slug) WHERE deleted_at IS NULL
```
(Drizzle: `uniqueIndex(...).on(t.slug).where(sql`${t.deletedAt} is null`)`)

### Cascade (di service layer, bukan FK cascade)
Soft delete induk → soft delete anak terkait (mis. hapus `titik_dakwah` ⇒ soft delete `kajian`, `kajian_schedules`, `donation_campaigns` miliknya). Restore induk menawarkan restore anak. Didokumentasikan & dieksekusi di service, agar terkontrol.

### Recycle Bin (UI)
- Halaman admin **"Sampah"** (per modul / gabungan) menampilkan item `deleted_at IS NOT NULL`: kapan dihapus, oleh siapa, tombol **Pulihkan** & **Hapus Permanen**.
- Retensi: job purge otomatis untuk item terhapus > **30 hari** (konfigurasi di `settings.trash_retention_days`).

### Permission baru (grup `trash`)
`trash.view` · `trash.restore` · `trash.purge`  (purge = role tinggi saja)

### Tabel yang DIKECUALIKAN dari soft delete (hard delete / immutable)
Junction & log/append-only: `role_permissions`, `user_roles`, `post_categories`, `post_tags`,
`lesson_progress`, `audit_logs`, `ai_messages`, `content_embeddings`, `sessions`, `accounts`,
`verification_tokens`. (Notifikasi & registrasi boleh hard delete.)

---

## 3. Penyimpanan Blob Per-User / Per-Entitas  ⭐
Tiap user/entitas (titik, media, partner, ustadz) bisa **memasang Blob storage sendiri**
(mis. token Vercel Blob masing-masing), sehingga file mereka tersimpan di store milik mereka.

### Tabel `storage_configs`
```
storage_configs(
  id uuid pk,
  owner_type enum[global/user/titik/media/partner/ustadz],
  owner_id uuid NULL,                 -- NULL utk global (platform)
  provider enum[vercel_blob/s3/r2/other] default 'vercel_blob',
  label text,                         -- "Blob Masjid Al-Falah"
  token_ciphertext text,              -- token TERENKRIPSI (AES-256-GCM)
  token_iv text, token_tag text,      -- nonce & tag enkripsi
  base_url text NULL,                 -- opsional (custom domain/bucket)
  is_default boolean default false,   -- default utk owner tsb
  status enum[active/disabled] default 'active',
  bytes_used bigint default 0,        -- akumulasi pemakaian (opsional)
  created_at, updated_at, deleted_at, deleted_by
)
```

### Integrasi ke media
`media_assets.storage_config_id uuid NULL → storage_configs.id`
- NULL ⇒ pakai **storage default platform** (global).
- Saat entitas upload: server memilih `storage_config` milik entitas (jika ada & aktif), kalau tidak → default global.

### Aturan keamanan
- **Token TIDAK PERNAH** dikirim ke client. Enkripsi at-rest pakai kunci app `STORAGE_ENC_KEY` (env).
- Upload via **server**: client minta signed upload → server pakai token store terkait → kembalikan URL → simpan `media_assets` (+ `storage_config_id`).
- Hapus file mengikuti soft delete `media_assets`; file fisik di-purge saat purge permanen.
- (Opsional) `bytes_used` untuk kuota & laporan pemakaian per entitas.

### Permission (grup `storage`)
`storage.view` · `storage.manage_own` (pasang/atur store sendiri) · `storage.manage` (admin semua)

### Settings
`settings.default_storage_config_id` menunjuk store global default.

---

## 4. Pembayaran: QRIS + Konfirmasi WhatsApp (D14)
Tanpa payment gateway. Manual + konfirmasi.
```
payment_methods(
  id, owner_type[global/titik/partner], owner_id NULL,
  type enum[qris/bank/ewallet], qris_image, bank_name, account_no, account_name,
  wa_number, is_active, created_at, updated_at, deleted_at, deleted_by )

payment_confirmations(
  id, kind enum[donation/order], ref_id uuid,   -- ref ke donation_campaign / product/order
  payer_name, is_anonymous, amount numeric(14,2), note,
  proof_url,                                     -- bukti transfer (Blob)
  wa_link,                                       -- wa.me prefilled
  status enum[pending/confirmed/rejected] default 'pending',
  confirmed_by uuid NULL, confirmed_at,
  created_at, updated_at, deleted_at, deleted_by )
```
Alur: user bayar via QRIS → isi nama/anonim + (opsi) unggah bukti → klik **Konfirmasi via WhatsApp** (`wa.me` prefilled berisi detail) → pengelola tandai `confirmed` → tercatat ke `donation_records`/kas atau pesanan lapak. Permission: `payment.view` · `payment.confirm` · `payment.manage_own`.

---

## 5. Ringkasan tabel ber-soft-delete
Semua entitas inti dapat `deleted_at`+`deleted_by`:
`users, titik_dakwah, ustadz_profiles, media_partners, business_partners, categories, kajian,
kajian_schedules, media_assets, videos, finance_categories, finance_transactions, finance_reports,
donation_campaigns, donation_updates, donation_records, posts, tags, questions, answers,
library_items, courses, course_modules, course_lessons, enrollments, events, event_registrations,
products, ai_conversations, settings(? tidak), ui_themes, roles, permissions(? tidak), menu_items,
storage_configs, payment_methods, payment_confirmations, notifications(opsional)`.
> Catatan: `roles` & `menu_items` ber-soft-delete (kecuali `is_system`). `permissions` biasanya tetap (master). `settings` & `ui_themes` master—boleh tanpa soft delete (atau pakai `is_active`).

---

## 6. Implementasi (Drizzle)
- Helper kolom bersama: `const softDelete = { deletedAt: timestamp('deleted_at',{withTimezone:true}), deletedBy: uuid('deleted_by').references(()=>users.id) }` lalu spread ke tiap `pgTable`.
- Helper query: `withActive(qb)` menambahkan `isNull(table.deletedAt)`.
- Service: fungsi `softDelete(entity,id,user)`, `restore(entity,id)`, `purge(entity,id)` + cascade map.
- Migrasi: `drizzle-kit generate` → `push`. Aktifkan extension: `CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION IF NOT EXISTS pgcrypto;` (untuk uuid/enkripsi).

---

*Acuan ini diterapkan ke `db/schema.ts` & `db/seed.ts`.*
