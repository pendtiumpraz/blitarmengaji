/**
 * Aktifkan extension Postgres yang dibutuhkan SEBELUM push/migrate.
 * Jalankan: npx tsx db/setup-extensions.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum di-set di .env.local");

const sql = neon(url);

async function main() {
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  const rows = await sql`SELECT extname FROM pg_extension WHERE extname IN ('vector','pgcrypto') ORDER BY extname`;
  console.log("Extensions aktif:", rows.map((r) => (r as { extname: string }).extname).join(", "));
}

main().catch((e) => {
  console.error("Gagal setup extensions:", e);
  process.exit(1);
});
