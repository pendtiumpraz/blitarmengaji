import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { aiConfigured, runAIChat, resolveTaskModel, type ChatMessage } from "@/lib/ai";
import { searchKnowledge, type KnowledgeHit } from "@/lib/queries/ai-retrieval";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { aiConversations, aiMessages } from "../../../../../db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientMessage = { role: "user" | "assistant"; content: string };
type Citation = { title: string; href: string; source: KnowledgeHit["source"] };
type ChatResponse = {
  answer: string;
  citations: Citation[];
  conversationId: string | null;
};

/** Judul percakapan dari pesan user pertama (20–40 char). */
function makeTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= 40) return clean || "Percakapan";
  // Potong di batas kata terdekat dalam rentang 20–40 char bila memungkinkan.
  const slice = clean.slice(0, 40);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace >= 20 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trimEnd()}…`;
}

/** Validasi & normalisasi pesan dari body request. */
function parseMessages(input: unknown): ClientMessage[] {
  if (!Array.isArray(input)) return [];
  const out: ClientMessage[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") continue;
    const role = (raw as { role?: unknown }).role;
    const content = (raw as { content?: unknown }).content;
    if ((role === "user" || role === "assistant") && typeof content === "string") {
      const trimmed = content.trim();
      if (trimmed) out.push({ role, content: trimmed });
    }
  }
  return out;
}

/** Susun blok konteks (untuk grounding) dari hasil retrieval. */
function buildContext(hits: KnowledgeHit[]): string {
  if (hits.length === 0) {
    return "(Tidak ada potongan konten yang relevan ditemukan di platform.)";
  }
  return hits
    .map(
      (h, i) =>
        `[${i + 1}] ${h.title}\n${h.snippet}\n(Sumber: ${h.href})`,
    )
    .join("\n\n");
}

const SYSTEM_PROMPT = `Anda adalah "Asisten Kajian" pada platform Blitar Mengaji — pendamping belajar Islam untuk masyarakat Blitar Raya.

Adab & batasan:
- Berbahasa Indonesia yang santun, lembut, dan menyejukkan. Gunakan istilah Islami yang lazim (mis. "wallahu a'lam").
- Hati-hati pada masalah khilafiyah (perbedaan pendapat fikih): sampaikan secara berimbang, jangan menghakimi salah satu pendapat, dan jangan berfatwa.
- Untuk persoalan hukum yang bersifat PERSONAL, sensitif, mendesak, atau menyangkut keadaan khusus seseorang, JANGAN memutuskan sendiri — arahkan dengan santun agar bertanya langsung melalui menu "Tanya Ustadz".
- Jawablah BERDASARKAN konteks konten platform yang diberikan di bawah. Jika konteks tidak memadai, katakan terus terang bahwa materi belum tersedia dan sarankan "Tanya Ustadz", jangan mengarang.
- Bila memakai informasi dari konteks, sebutkan judul sumbernya secara alami di dalam jawaban.
- Ringkas, jelas, dan tidak menggurui. Hindari klaim dalil yang tidak ada di konteks.`;

function jsonOk(payload: ChatResponse) {
  return NextResponse.json(payload, { status: 200 });
}

export async function POST(req: Request) {
  let messages: ClientMessage[] = [];
  let conversationId: string | null = null;
  try {
    const body = (await req.json()) as {
      messages?: unknown;
      conversationId?: unknown;
    };
    messages = parseMessages(body?.messages);
    if (typeof body?.conversationId === "string" && body.conversationId.trim()) {
      conversationId = body.conversationId.trim();
    }
  } catch {
    return jsonOk({
      answer: "Permintaan tidak valid. Silakan kirim pertanyaan Anda kembali.",
      citations: [],
      conversationId: null,
    });
  }

  if (messages.length === 0) {
    return jsonOk({
      answer: "Silakan tulis pertanyaan terlebih dahulu.",
      citations: [],
      conversationId: null,
    });
  }

  // Identitas user (untuk persist riwayat). Tamu = tidak login → tidak dipersist.
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // Belum dikonfigurasi admin → balas ramah, status 200 (tanpa persist).
  if (!(await aiConfigured("chat"))) {
    return jsonOk({
      answer:
        "AI belum dikonfigurasi admin (atur provider+model+API key & binding 'chat' di Admin → AI).",
      citations: [],
      conversationId: null,
    });
  }

  // Pesan user terakhir → retrieval.
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const queryText = lastUser?.content ?? messages[messages.length - 1].content;

  let hits: KnowledgeHit[] = [];
  try {
    hits = await searchKnowledge(queryText, 5);
  } catch {
    hits = []; // retrieval gagal → tetap jawab tanpa konteks.
  }

  const citations: Citation[] = hits.map((h) => ({
    title: h.title,
    href: h.href,
    source: h.source,
  }));

  // Susun pesan untuk model: system + konteks + riwayat percakapan.
  const chatMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Konteks konten platform (gunakan sebagai rujukan utama):\n\n${buildContext(hits)}`,
    },
    ...messages.map<ChatMessage>((m) => ({ role: m.role, content: m.content })),
  ];

  // PERSIST (hanya bila user LOGIN). Tamu → conversationId tetap null.
  // 1) Pastikan ada percakapan milik user; bila belum → buat baru (judul dari
  //    pesan user pertama). conversationId dari client divalidasi kepemilikannya.
  // 2) Simpan pesan user SEBELUM memanggil model.
  if (userId) {
    if (conversationId) {
      const owned = await db
        .select({ id: aiConversations.id })
        .from(aiConversations)
        .where(
          and(
            eq(aiConversations.id, conversationId),
            eq(aiConversations.userId, userId),
            isNull(aiConversations.deletedAt),
          ),
        )
        .limit(1);
      if (!owned[0]) conversationId = null; // bukan milik user/terhapus → buat baru.
    }

    if (!conversationId) {
      const inserted = await db
        .insert(aiConversations)
        .values({ userId, title: makeTitle(queryText) })
        .returning({ id: aiConversations.id });
      conversationId = inserted[0]?.id ?? null;
    }

    if (conversationId) {
      await db.insert(aiMessages).values({
        conversationId,
        role: "user",
        content: queryText,
      });
    }
  }

  try {
    const answer = await runAIChat("chat", chatMessages, { temperature: 0.3 });
    const finalAnswer =
      answer.trim() ||
      "Maaf, jawaban tidak dapat dihasilkan saat ini. Silakan coba lagi atau gunakan Tanya Ustadz.";

    // Simpan jawaban assistant bila percakapan dipersist (user login).
    if (userId && conversationId) {
      let model: string | null = null;
      try {
        model = (await resolveTaskModel("chat"))?.modelId ?? null;
      } catch {
        model = null;
      }
      await db.insert(aiMessages).values({
        conversationId,
        role: "assistant",
        content: finalAnswer,
        model,
      });
    }

    return jsonOk({ answer: finalAnswer, citations, conversationId });
  } catch {
    return jsonOk({
      answer:
        "Maaf, asisten sedang tidak dapat menjawab saat ini. Silakan coba beberapa saat lagi, atau ajukan pertanyaan melalui Tanya Ustadz.",
      citations: [],
      conversationId,
    });
  }
}
