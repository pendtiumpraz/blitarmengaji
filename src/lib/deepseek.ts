/**
 * Klien DeepSeek (chat completions). Butuh DEEPSEEK_API_KEY di .env.local.
 * Model: deepseek-chat (default), deepseek-reasoner, dll.
 */
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function deepseekConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function deepseekChat(
  messages: ChatMessage[],
  opts?: { model?: string; temperature?: number },
): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY belum di-set di .env.local");

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: opts?.model ?? "deepseek-chat",
      messages,
      temperature: opts?.temperature ?? 0.4,
      stream: false,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`DeepSeek API error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content ?? "";
}
