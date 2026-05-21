import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { decryptToken } from "@/lib/storage";

/**
 * Lapisan AI generik (provider-agnostic). Tiap "task" di-bind ke 1 model aktif
 * (lihat ai_task_bindings). Provider OpenAI-compatible (DeepSeek/OpenAI/Groq/xAI/
 * Mistral/Gemini-compat/OpenRouter/dll). API key terenkripsi di ai_providers.
 */
export type AiTask = "chat" | "agent" | "doc" | "embedding" | "transcribe" | "summarize" | "vision";
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ResolvedModel = {
  baseUrl: string;
  modelId: string;
  providerName: string;
  modelLabel: string;
  ct: string | null;
  iv: string | null;
  tag: string | null;
};

/** Cari model+provider aktif yang di-bind ke sebuah task. */
export async function resolveTaskModel(task: AiTask): Promise<ResolvedModel | null> {
  const rows = await db
    .select({
      baseUrl: schema.aiProviders.baseUrl,
      modelId: schema.aiModels.modelId,
      providerName: schema.aiProviders.name,
      modelLabel: schema.aiModels.label,
      ct: schema.aiProviders.apiKeyCiphertext,
      iv: schema.aiProviders.apiKeyIv,
      tag: schema.aiProviders.apiKeyTag,
    })
    .from(schema.aiTaskBindings)
    .innerJoin(schema.aiModels, eq(schema.aiModels.id, schema.aiTaskBindings.modelId))
    .innerJoin(schema.aiProviders, eq(schema.aiProviders.id, schema.aiModels.providerId))
    .where(
      and(
        eq(schema.aiTaskBindings.task, task),
        eq(schema.aiTaskBindings.isActive, true),
        isNull(schema.aiTaskBindings.deletedAt),
        isNull(schema.aiModels.deletedAt),
        isNull(schema.aiProviders.deletedAt),
        eq(schema.aiProviders.isActive, true),
        eq(schema.aiModels.isActive, true),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Apakah task siap dipakai (ada model + API key)? */
export async function aiConfigured(task: AiTask): Promise<boolean> {
  const m = await resolveTaskModel(task);
  return Boolean(m && m.ct && m.iv && m.tag);
}

/** Jalankan chat completion untuk sebuah task. Lempar error informatif bila belum siap. */
export async function runAIChat(
  task: AiTask,
  messages: ChatMessage[],
  opts?: { temperature?: number },
): Promise<string> {
  const m = await resolveTaskModel(task);
  if (!m) throw new Error(`Belum ada model untuk task '${task}'. Atur di Admin → AI.`);
  if (!m.ct || !m.iv || !m.tag) {
    throw new Error(`Provider '${m.providerName}' belum punya API key. Atur di Admin → AI.`);
  }
  const key = decryptToken(m.ct, m.iv, m.tag);

  const res = await fetch(`${m.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: m.modelId,
      messages,
      temperature: opts?.temperature ?? 0.4,
      stream: false,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI error ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Apakah task 'embedding' siap dipakai (ada model + API key)? */
export async function embeddingConfigured(): Promise<boolean> {
  return aiConfigured("embedding");
}

/**
 * Hasilkan embedding (vektor) untuk sekumpulan teks via task 'embedding'.
 * Provider OpenAI-compatible: POST {baseUrl}/embeddings { model, input }.
 * Lempar error informatif bila task belum siap (tak ada model / API key).
 * Kembalikan array vektor sejajar dengan urutan `texts`.
 */
export async function runAIEmbedding(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const m = await resolveTaskModel("embedding");
  if (!m) throw new Error("Belum ada model untuk task 'embedding'. Atur di Admin → AI.");
  if (!m.ct || !m.iv || !m.tag) {
    throw new Error(`Provider '${m.providerName}' belum punya API key. Atur di Admin → AI.`);
  }
  const key = decryptToken(m.ct, m.iv, m.tag);

  const res = await fetch(`${m.baseUrl.replace(/\/$/, "")}/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: m.modelId, input: texts }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`AI embedding error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    data?: { embedding?: number[]; index?: number }[];
  };
  const items = data.data ?? [];
  if (items.length !== texts.length) {
    throw new Error(
      `Jumlah embedding (${items.length}) tidak sama dengan jumlah input (${texts.length}).`,
    );
  }

  // Urutkan sesuai `index` bila tersedia agar sejajar dengan input.
  return items
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((it) => it.embedding ?? []);
}
