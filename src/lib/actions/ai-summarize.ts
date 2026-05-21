"use server";

import { auth } from "@/lib/auth";
import { aiConfigured, runAIChat } from "@/lib/ai";

/**
 * Server action AI — RINGKAS TRANSKRIP → CATATAN (1 klik).
 * Pola useActionState: summarizeTranscript(prev, formData) -> SummarizeState.
 *
 * Alur (AGENTS.md §0/§2):
 * 1. WAJIB login (sesi ada).
 * 2. Cek task 'summarize' sudah dikonfigurasi (model + API key) di Admin → AI.
 * 3. runAIChat('summarize', [...]) → parse hasil: baris pertama = JUDUL, sisanya = isi.
 *
 * Output dipakai untuk mengisi field form catatan (title & body) di client.
 */

export type SummarizeState = {
  ok?: boolean;
  title?: string;
  body?: string;
  error?: string;
};

const SYSTEM_PROMPT =
  "Ringkas transkrip kajian jadi CATATAN rapi berbahasa Indonesia: beri judul singkat, ringkasan poin penting, kutipan dalil bila ada. Format: baris pertama JUDUL, sisanya isi.";

/** Bersihkan baris judul dari tanda kutip / penanda markdown / label "Judul:". */
function cleanTitle(line: string): string {
  return line
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^\*+\s*/, "")
    .replace(/^(judul|title)\s*[:：]\s*/i, "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim();
}

export async function summarizeTranscript(
  _prev: SummarizeState | undefined,
  formData: FormData,
): Promise<SummarizeState> {
  // 1) WAJIB login.
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sesi tidak ditemukan. Silakan masuk kembali." };
  }

  const transcript =
    typeof formData.get("transcript") === "string" ? String(formData.get("transcript")).trim() : "";
  if (transcript.length === 0) {
    return { error: "Tempel transkrip kajian terlebih dahulu." };
  }

  // 2) Pastikan task 'summarize' siap (model + API key).
  if (!(await aiConfigured("summarize"))) {
    return {
      error:
        "AI ringkas belum dikonfigurasi (atur model task 'summarize' + API key di Admin → AI)",
    };
  }

  // 3) Jalankan ringkasan, lalu pisahkan baris pertama (judul) dari isi.
  try {
    const result = await runAIChat("summarize", [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcript },
    ]);

    const normalized = result.replace(/\r\n/g, "\n").trim();
    if (normalized.length === 0) {
      return { error: "AI tidak mengembalikan hasil. Coba lagi." };
    }

    const lines = normalized.split("\n");
    const title = cleanTitle(lines[0] ?? "");
    const body = lines.slice(1).join("\n").trim();

    return {
      ok: true,
      title: title || "Catatan Kajian",
      body: body || normalized,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal meringkas transkrip.";
    return { error: msg };
  }
}
