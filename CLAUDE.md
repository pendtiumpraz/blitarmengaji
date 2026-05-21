# CLAUDE.md

Aturan & konvensi proyek ada di **[AGENTS.md](AGENTS.md)** — baca itu dulu.

Ringkas (jangan dilanggar):
- Urutan kerja: **DATABASE → BACKEND → FRONTEND**.
- Frontend **100% match** mockup di `docs/ui/` (design system craft: `craft.css`, `ornaments.css`, `theme-tokens.css`).
- **npm** saja. Auth = **NextAuth (secret)**. DB = **Neon + Drizzle**. Storage = **Vercel Blob**.
- Kredensial di `.env.local` (jangan commit / jangan tempel di chat).
- Acuan DB tunggal: `docs/DATABASE-PLAN.md`.
