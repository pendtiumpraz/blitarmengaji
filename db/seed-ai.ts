/**
 * Seed AI Providers & Models (terbaru ~2026). API key DIKOSONGKAN —
 * diisi via Admin → AI (tersimpan terenkripsi). Idempoten.
 * Jalankan: npx tsx db/seed-ai.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { aiProviders, aiModels, aiTaskBindings } from "./schema";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum di-set");
const db = drizzle(neon(url), { schema: { aiProviders, aiModels, aiTaskBindings } });

type Kind = "chat" | "reasoning" | "embedding" | "vision" | "multimodal";
type Prov = {
  name: string;
  slug: string;
  baseUrl: string;
  docsUrl: string;
  models: { modelId: string; label: string; kind: Kind; ctx?: number }[];
};

// Provider OpenAI-compatible + model andalan terbaru (Mei 2026).
const PROVIDERS: Prov[] = [
  {
    name: "OpenAI", slug: "openai", baseUrl: "https://api.openai.com/v1", docsUrl: "https://platform.openai.com/docs",
    models: [
      { modelId: "gpt-5.1", label: "GPT-5.1", kind: "multimodal", ctx: 400000 },
      { modelId: "gpt-5.1-mini", label: "GPT-5.1 Mini", kind: "chat", ctx: 400000 },
      { modelId: "o4-mini", label: "o4-mini (reasoning)", kind: "reasoning", ctx: 200000 },
      { modelId: "text-embedding-3-large", label: "Embedding 3 Large", kind: "embedding", ctx: 8191 },
    ],
  },
  {
    name: "Anthropic", slug: "anthropic", baseUrl: "https://api.anthropic.com/v1", docsUrl: "https://docs.anthropic.com",
    models: [
      { modelId: "claude-opus-4-7", label: "Claude Opus 4.7", kind: "reasoning", ctx: 1000000 },
      { modelId: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", kind: "multimodal", ctx: 1000000 },
      { modelId: "claude-haiku-4-5", label: "Claude Haiku 4.5", kind: "chat", ctx: 200000 },
    ],
  },
  {
    name: "Google Gemini", slug: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", docsUrl: "https://ai.google.dev/gemini-api/docs",
    models: [
      { modelId: "gemini-3-pro", label: "Gemini 3 Pro", kind: "multimodal", ctx: 1000000 },
      { modelId: "gemini-2.5-flash", label: "Gemini 2.5 Flash", kind: "multimodal", ctx: 1000000 },
      { modelId: "gemini-2.5-pro", label: "Gemini 2.5 Pro", kind: "multimodal", ctx: 1000000 },
    ],
  },
  {
    name: "DeepSeek", slug: "deepseek", baseUrl: "https://api.deepseek.com", docsUrl: "https://api-docs.deepseek.com",
    models: [
      { modelId: "deepseek-chat", label: "DeepSeek V3 (chat)", kind: "chat", ctx: 131072 },
      { modelId: "deepseek-reasoner", label: "DeepSeek R1 (reasoning)", kind: "reasoning", ctx: 131072 },
    ],
  },
  {
    name: "xAI Grok", slug: "xai", baseUrl: "https://api.x.ai/v1", docsUrl: "https://docs.x.ai",
    models: [
      { modelId: "grok-4", label: "Grok 4", kind: "multimodal", ctx: 256000 },
      { modelId: "grok-4-fast", label: "Grok 4 Fast", kind: "chat", ctx: 2000000 },
    ],
  },
  {
    name: "Mistral", slug: "mistral", baseUrl: "https://api.mistral.ai/v1", docsUrl: "https://docs.mistral.ai",
    models: [
      { modelId: "mistral-large-latest", label: "Mistral Large", kind: "chat", ctx: 131072 },
      { modelId: "magistral-medium-latest", label: "Magistral Medium (reasoning)", kind: "reasoning", ctx: 131072 },
      { modelId: "mistral-small-latest", label: "Mistral Small", kind: "chat", ctx: 131072 },
    ],
  },
  {
    name: "Groq", slug: "groq", baseUrl: "https://api.groq.com/openai/v1", docsUrl: "https://console.groq.com/docs",
    models: [
      { modelId: "meta-llama/llama-4-maverick-17b-128e-instruct", label: "Llama 4 Maverick", kind: "multimodal", ctx: 1000000 },
      { modelId: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout", kind: "multimodal", ctx: 10000000 },
    ],
  },
  {
    name: "Alibaba Qwen", slug: "qwen", baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", docsUrl: "https://www.alibabacloud.com/help/en/model-studio",
    models: [
      { modelId: "qwen3-max", label: "Qwen3 Max", kind: "chat", ctx: 262144 },
      { modelId: "qwen-plus", label: "Qwen Plus", kind: "chat", ctx: 131072 },
    ],
  },
  {
    name: "OpenRouter", slug: "openrouter", baseUrl: "https://openrouter.ai/api/v1", docsUrl: "https://openrouter.ai/docs",
    models: [
      { modelId: "openai/gpt-5.1", label: "GPT-5.1 (via OpenRouter)", kind: "multimodal", ctx: 400000 },
      { modelId: "anthropic/claude-opus-4.7", label: "Claude Opus 4.7 (via OpenRouter)", kind: "reasoning", ctx: 1000000 },
      { modelId: "x-ai/grok-4", label: "Grok 4 (via OpenRouter)", kind: "multimodal", ctx: 256000 },
    ],
  },
  {
    name: "Cohere", slug: "cohere", baseUrl: "https://api.cohere.ai/compatibility/v1", docsUrl: "https://docs.cohere.com",
    models: [{ modelId: "command-a-03-2025", label: "Command A", kind: "chat", ctx: 256000 }],
  },
];

// Binding default task -> model (key kosong → belum jalan sampai diisi & dipilih di UI).
const DEFAULT_BINDINGS: { task: "chat" | "agent" | "doc" | "summarize" | "embedding"; provider: string; modelId: string }[] = [
  { task: "chat", provider: "deepseek", modelId: "deepseek-chat" },
  { task: "agent", provider: "deepseek", modelId: "deepseek-reasoner" },
  { task: "doc", provider: "openai", modelId: "gpt-5.1" },
  { task: "summarize", provider: "google", modelId: "gemini-2.5-flash" },
  { task: "embedding", provider: "openai", modelId: "text-embedding-3-large" },
];

async function main() {
  console.log("Seed AI providers & models (terbaru 2026)...");
  const modelUuidByKey = new Map<string, string>();

  for (const p of PROVIDERS) {
    const findProv = () =>
      db
        .select({ id: aiProviders.id })
        .from(aiProviders)
        .where(and(eq(aiProviders.slug, p.slug), isNull(aiProviders.deletedAt)))
        .limit(1);

    let prov = (await findProv())[0];
    if (!prov) {
      await db.insert(aiProviders).values({ name: p.name, slug: p.slug, baseUrl: p.baseUrl, docsUrl: p.docsUrl, isActive: true });
      prov = (await findProv())[0];
    }
    if (!prov) continue;

    const existing = await db
      .select({ modelId: aiModels.modelId })
      .from(aiModels)
      .where(and(eq(aiModels.providerId, prov.id), isNull(aiModels.deletedAt)));
    const have = new Set(existing.map((m) => m.modelId));

    for (const m of p.models) {
      if (!have.has(m.modelId)) {
        await db.insert(aiModels).values({
          providerId: prov.id,
          modelId: m.modelId,
          label: m.label,
          kind: m.kind,
          contextWindow: m.ctx ?? null,
          isActive: true,
        });
      }
      const [row] = await db
        .select({ id: aiModels.id })
        .from(aiModels)
        .where(and(eq(aiModels.providerId, prov.id), eq(aiModels.modelId, m.modelId), isNull(aiModels.deletedAt)))
        .limit(1);
      if (row) modelUuidByKey.set(`${p.slug}:${m.modelId}`, row.id);
    }
  }

  console.log(`Seed ${PROVIDERS.length} provider + model. Bind default task...`);
  for (const b of DEFAULT_BINDINGS) {
    const mid = modelUuidByKey.get(`${b.provider}:${b.modelId}`);
    if (!mid) continue;
    const exists = await db
      .select({ id: aiTaskBindings.id })
      .from(aiTaskBindings)
      .where(and(eq(aiTaskBindings.task, b.task), isNull(aiTaskBindings.deletedAt)))
      .limit(1);
    if (exists.length === 0) {
      await db.insert(aiTaskBindings).values({ task: b.task, modelId: mid, isActive: true });
    }
  }

  console.log("Seed AI selesai. Isi API key tiap provider via Admin → AI.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
