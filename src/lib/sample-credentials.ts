import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { decryptToken } from "@/lib/storage";

export const SAMPLE_CREDENTIALS_KEY = "sample_credentials";

export type SampleCredentials = {
  ustadz: { nama: string; spesialisasi: string; email: string; password: string }[];
  titik: { titik: string; kecamatan: string; email: string; password: string }[];
};

/**
 * Muat kredensial sample: file lokal `data/sample-credentials.json` (saat dev) →
 * fallback DB `settings.sample_credentials` (terenkripsi AES-256-GCM, untuk produksi).
 * Mengembalikan null bila belum di-seed (`npm run db:seed:sample`).
 */
export async function loadSampleCredentials(): Promise<SampleCredentials | null> {
  // 1) File lokal (dev) — gitignored, tidak ikut deploy.
  try {
    const file = path.join(process.cwd(), "data", "sample-credentials.json");
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as SampleCredentials;
  } catch {
    /* lanjut coba DB */
  }
  // 2) DB terenkripsi (produksi).
  try {
    const rows = await db
      .select({ v: schema.settings.valueJson })
      .from(schema.settings)
      .where(eq(schema.settings.key, SAMPLE_CREDENTIALS_KEY))
      .limit(1);
    const v = rows[0]?.v as { ciphertext?: string; iv?: string; tag?: string } | null;
    if (v?.ciphertext && v.iv && v.tag) {
      return JSON.parse(decryptToken(v.ciphertext, v.iv, v.tag)) as SampleCredentials;
    }
  } catch {
    /* abaikan */
  }
  return null;
}
