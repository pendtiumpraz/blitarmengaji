/**
 * ============================================================
 * Blitar Mengaji — Konfigurasi Drizzle Kit
 * ============================================================
 * Dipakai oleh perintah:
 *   - npx drizzle-kit generate   (generate migration SQL)
 *   - npx drizzle-kit push       (push schema langsung ke DB)
 *   - npx drizzle-kit studio     (GUI inspeksi DB)
 * ============================================================
 */

import { config } from 'dotenv';
config({ path: '.env.local' }); // muat kredensial dari .env.local
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts', // sumber definisi tabel
  out: './drizzle', // folder output migration
  dialect: 'postgresql', // Neon = Postgres
  dbCredentials: {
    // pakai koneksi langsung (unpooled) untuk migrasi bila tersedia
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
