# AGENTS.md — Aturan Pengembangan Blitar Mengaji

> Dibaca oleh semua kontributor & AI agent sebelum mengerjakan repo ini.
> Ini **aturan wajib (RULES)**, bukan saran. Pelanggaran = revisi.

---

## 0. Aturan Emas (URUTAN PENGEMBANGAN) ⭐
**SELALU kerjakan berurutan: DATABASE → BACKEND → FRONTEND. Jangan dibalik.**

1. **DATABASE dulu** — desain/ubah skema di `db/schema.ts` mengikuti **`docs/DATABASE-PLAN.md`** (acuan tunggal). Generate migrasi, jalankan, lalu `db/seed.ts`. Tidak ada fitur tanpa modelnya ada di DB lebih dulu.
2. **BACKEND** — service / route handler / server action di atas skema: validasi (Zod), **cek RBAC & ownership**, soft delete/restore, audit log. Logika bisnis selesai & teruji sebelum UI.
3. **FRONTEND** — terakhir, dan **wajib 100% match dengan mockup** di `docs/ui/` (lihat §3).

Jangan menulis UI untuk data/endpoint yang belum ada. Jangan membuat endpoint untuk tabel yang belum ada.

---

## 1. Stack & Tooling (FIX — jangan diubah tanpa izin)
- **Framework:** Next.js (App Router) **full-stack** + TypeScript.
- **Package manager:** **npm SAJA.** ❌ Jangan pnpm / yarn / bun. Selalu `npm install`, `npm run ...`. Commit `package-lock.json`.
- **Auth:** **NextAuth / Auth.js** (Credentials + `NEXTAUTH_SECRET`). ❌ Bukan better-auth.
- **Database:** **Neon Postgres** · ORM **Drizzle** (`drizzle-orm/pg-core`, `@neondatabase/serverless`).
- **Storage:** **Vercel Blob** (+ storage per-entitas, lihat `DATABASE-PLAN.md`).
- **AI:** **DeepSeek** (`deepseek-chat` / `deepseek-v4-flash` / `deepseek-v4-pro`) + pgvector (RAG, fase lanjut).
- **Styling:** Tailwind CSS + design tokens craft (lihat §3).
- **Validasi:** Zod (dipakai bersama FE & BE).
- **Peta:** Leaflet + OpenStreetMap (gratis). **PDF:** @react-pdf/renderer / pdf-lib.

## 2. Kredensial & Environment
- Semua rahasia di **`.env.local`** (TIDAK di-commit; sudah/diabaikan via `.gitignore`).
- ❌ JANGAN pernah menempel kredensial di chat, kode, atau commit.
- Variabel yang dipakai (lihat `.env.example`):
  `DATABASE_URL` (Neon), `BLOB_READ_WRITE_TOKEN` (Vercel Blob), `STORAGE_ENC_KEY` (enkripsi token storage per-entitas), `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DEEPSEEK_API_KEY`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`.
- **Neon & Blob disediakan user** dan ditaruh di `.env.local`. Jangan hardcode.

## 3. Frontend HARUS 100% match mockup ⭐
- **Sumber kebenaran visual = `docs/ui/*.html`** (prototype) + **`docs/ui/craft.html`** (arah visual final "craft").
- Pakai design system yang sudah ada — JANGAN bikin gaya baru:
  - Tokens & tema: `docs/ui/theme-tokens.css` (8 tema, default **teduh** = emerald hangat + emas + parchment), switcher `theme-switcher.js`.
  - Craft layer: `docs/ui/craft.css` + `docs/ui/ornaments.css` (ornamen Islami SVG girih/trellis, **logo crest mihrab**, font **Fraunces** (display) + **Reem Kufi** (wordmark) + **Amiri** (Arab), palet parchment).
- Tiap layar yang dibangun harus cocok layout, komponen, spacing, warna, ikon, dan ornamennya dengan mockup terkait. Perubahan visual signifikan butuh persetujuan.
- **Wajib**: mobile-first & responsive, webview-friendly, theme-aware (CSS variables + `data-theme`), aksesibel (AA, target tap ≥44px).
- ❌ Hindari kesan "AI generik": tidak ada emoji dekoratif di chrome; pakai logo crest, font display, dan ornamen.

## 4. Aturan Data (ringkas — detail di `docs/DATABASE-PLAN.md`)
- **Soft delete di mana-mana**: set `deleted_at`/`deleted_by`, JANGAN DELETE fisik. Query default `WHERE deleted_at IS NULL`. Sediakan **restore** + recycle bin. Purge hanya role berwenang.
- **RBAC dinamis & multi-role**: cek permission (`modul.aksi`) + ownership (`*.manage_own`) di backend. Menu admin digerakkan tabel `menu_items`.
- **Storage Blob per-entitas**: file lewat `storage_configs` (token terenkripsi, tak pernah ke client); fallback ke storage global default.
- **Pembayaran**: QRIS + konfirmasi manual via WhatsApp (`payment_methods`, `payment_confirmations`). ❌ Bukan payment gateway (itu fase lanjut).
- Soft-deleted slug boleh dipakai ulang (partial unique `WHERE deleted_at IS NULL`).

## 5. Konvensi Konten & Penamaan
- Bahasa UI: **Indonesia**.
- ❌ JANGAN tulis "Bumi Bung Karno". Pakai **"Blitar Raya"** (ini bumi Allah).
- Penanya Tanya Ustadz boleh anonim **"Hamba Allah"**; jawaban ustadz **wajib** pakai nama.
- Platform **gratis** untuk semua (tanpa paywall).

## 6. Git & Operasional
- Jangan commit/push kecuali diminta. Jika di branch default, buat branch dulu.
- Jangan jalankan perintah destruktif tanpa konfirmasi. Jangan `--no-verify`.
- Jangan commit `.env.local`, token, atau file rahasia.

## 7. Dokumen Acuan (baca sebelum kerja)
- `docs/BLITAR-MENGAJI-BRAINSTORM.md` — master plan (visi, modul, RBAC, roadmap, decision log).
- `docs/DATABASE-PLAN.md` — **acuan DB tunggal** (tabel, enum, relasi, ERD, seed, migrasi).
- `docs/DATABASE-ARCHITECTURE.md` — konvensi soft delete/restore, storage per-entitas, pembayaran.
- `docs/UI-UX-DESIGN-SYSTEM.md` — design system + daftar mockup.
- `docs/ui/` — prototype HTML (sumber kebenaran visual) + `craft.html` (arah final).
- `docs/EXECUTION-PHASE-0.md` — langkah scaffold Fase 0.

## 8. Definition of Done (tiap fitur)
1. Tabel/relasi ada di `db/schema.ts` sesuai `DATABASE-PLAN.md` + migrasi & seed bila perlu.
2. Backend: endpoint/action + Zod + RBAC/ownership + soft delete + audit (untuk aksi sensitif).
3. Frontend: UI **match mockup 100%**, theme-aware, responsive, pakai design tokens craft.
4. Tidak ada rahasia ter-commit; `npm run build`/lint lolos.
