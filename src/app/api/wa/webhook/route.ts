import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { uploadToBlob } from "@/lib/blob";
import { waExtract, matchTitik, aiConfigured } from "@/lib/wa-extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WaPayload = {
  messageId?: string;
  accountId?: string;
  groupJid?: string;
  groupName?: string;
  sender?: string;
  pushName?: string;
  timestamp?: number;
  text?: string;
  hasImage?: boolean;
  imageMime?: string;
  imageBase64?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  // 1) Verifikasi secret
  const expected = process.env.WA_WEBHOOK_SECRET;
  if (!expected) return json({ ok: false, error: "Webhook belum dikonfigurasi (WA_WEBHOOK_SECRET kosong)." }, 503);
  if (req.headers.get("x-wa-secret") !== expected) return json({ ok: false, error: "Unauthorized" }, 401);

  let body: WaPayload;
  try {
    body = (await req.json()) as WaPayload;
  } catch {
    return json({ ok: false, error: "Body bukan JSON valid" }, 400);
  }

  // 2) Dedup by waMessageId
  if (body.messageId) {
    const existing = await db
      .select({ id: schema.waMessages.id })
      .from(schema.waMessages)
      .where(eq(schema.waMessages.waMessageId, body.messageId))
      .limit(1);
    if (existing[0]) return json({ ok: true, duplicate: true });
  }

  // 3) Upload gambar (bila ada)
  let imageUrl: string | null = null;
  if (body.hasImage && body.imageBase64) {
    try {
      const buf = Buffer.from(body.imageBase64, "base64");
      const file = new File([buf], `wa-${Date.now()}.jpg`, { type: body.imageMime || "image/jpeg" });
      imageUrl = await uploadToBlob(file, "wa");
    } catch {
      imageUrl = null;
    }
  }

  // 4) Simpan pesan mentah
  const [msg] = await db
    .insert(schema.waMessages)
    .values({
      accountId: body.accountId ?? null,
      groupJid: body.groupJid ?? null,
      groupName: body.groupName ?? null,
      sender: body.sender ?? null,
      pushName: body.pushName ?? null,
      text: body.text ?? null,
      hasImage: !!body.hasImage,
      imageUrl,
      waMessageId: body.messageId ?? null,
      waTimestamp: body.timestamp ? new Date(body.timestamp) : null,
      status: "received",
    })
    .returning({ id: schema.waMessages.id });

  // 5) Ekstraksi AI → antrian review
  if (!(await aiConfigured("wa_extract"))) {
    await db
      .update(schema.waMessages)
      .set({ classification: "pending", status: "ai_unconfigured" })
      .where(eq(schema.waMessages.id, msg.id));
    return json({ ok: true, queued: false, note: "AI 'wa_extract' belum dikonfigurasi" });
  }

  try {
    const result = await waExtract(body.text ?? "");
    let queued = false;

    if (result.type === "kajian" && result.kajian) {
      const k = result.kajian;
      const titikId = await matchTitik(k.titikHint || k.lokasi);
      await db.insert(schema.waIngestQueue).values({
        messageId: msg.id,
        type: "kajian",
        status: "pending",
        payloadJson: k,
        titikDakwahId: titikId,
        imageUrl,
      });
      queued = true;
    } else if (result.type === "faedah" && result.faedah) {
      await db.insert(schema.waIngestQueue).values({
        messageId: msg.id,
        type: "faedah",
        status: "pending",
        payloadJson: result.faedah,
        imageUrl,
      });
      queued = true;
    }

    await db
      .update(schema.waMessages)
      .set({ classification: result.type, status: "processed" })
      .where(eq(schema.waMessages.id, msg.id));

    return json({ ok: true, type: result.type, queued });
  } catch (e) {
    await db
      .update(schema.waMessages)
      .set({ classification: "error", status: "error" })
      .where(eq(schema.waMessages.id, msg.id));
    return json({ ok: true, queued: false, error: (e as Error).message });
  }
}
