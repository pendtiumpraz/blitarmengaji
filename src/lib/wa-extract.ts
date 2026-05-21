import { and, ilike, isNull, or } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { runAIChat, aiConfigured } from "@/lib/ai";

/**
 * Klasifikasi + ekstraksi pesan WA grup memakai AI (task 'wa_extract').
 * Model di-bind via /admin/ai (mis. DeepSeek). Output: JSON terstruktur.
 */
export type WaExtractResult = {
  type: "kajian" | "faedah" | "qna" | "other";
  kajian?: {
    judul?: string; ustadz?: string; tanggal?: string; waktu?: string;
    lokasi?: string; titikHint?: string; kitab?: string;
  };
  faedah?: { judul?: string; ringkasan?: string };
};

const SYSTEM = `Kamu asisten yang mengekstrak informasi dari pesan grup WhatsApp komunitas kajian di Blitar Raya.
Klasifikasikan pesan lalu kembalikan HANYA JSON valid (tanpa penjelasan, tanpa code fence) berbentuk:
{"type":"kajian|faedah|qna|other","kajian":{"judul":"","ustadz":"","tanggal":"","waktu":"","lokasi":"","titikHint":"","kitab":""},"faedah":{"judul":"","ringkasan":""}}
Aturan:
- "kajian": pesan berisi INFO/UNDANGAN kajian (ada penceramah/tema/waktu/tempat). Isi field kajian; titikHint = nama masjid/mushola/tempat.
- "faedah": pesan berisi ringkasan ilmu/nasihat bermakna yang berdiri sendiri. Isi faedah.judul (singkat) & faedah.ringkasan (rapikan).
- "qna": tanya-jawab/obrolan/diskusi antar anggota.
- "other": salam, stiker, hal tak relevan.
Jangan mengarang. Kosongkan field yang tidak disebut. Bahasa Indonesia.`;

export async function waExtract(text: string): Promise<WaExtractResult> {
  const raw = await runAIChat(
    "wa_extract",
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: text && text.trim() ? text : "(tanpa teks, hanya gambar)" },
    ],
    { temperature: 0 },
  );
  return parseResult(raw);
}

function parseResult(raw: string): WaExtractResult {
  let s = (raw || "").trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try {
    const o = JSON.parse(s);
    const type = ["kajian", "faedah", "qna", "other"].includes(o?.type) ? o.type : "other";
    return { type, kajian: o?.kajian, faedah: o?.faedah };
  } catch {
    return { type: "other" };
  }
}

/** Cocokkan hint lokasi ke titik dakwah (ILIKE nama/kecamatan/kelurahan). */
export async function matchTitik(hint?: string): Promise<string | null> {
  const h = (hint || "").trim();
  if (h.length < 3) return null;
  const term = `%${h.slice(0, 60)}%`;
  const rows = await db
    .select({ id: schema.titikDakwah.id })
    .from(schema.titikDakwah)
    .where(
      and(
        isNull(schema.titikDakwah.deletedAt),
        or(
          ilike(schema.titikDakwah.name, term),
          ilike(schema.titikDakwah.kecamatan, term),
          ilike(schema.titikDakwah.kelurahan, term),
        ),
      ),
    )
    .limit(1);
  return rows[0]?.id ?? null;
}

export { aiConfigured };
