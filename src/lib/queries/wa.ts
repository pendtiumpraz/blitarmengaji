import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/** Antrian draft hasil ekstrak WA yang menunggu review. */
export async function listPendingIngest() {
  return db
    .select({
      id: schema.waIngestQueue.id,
      type: schema.waIngestQueue.type,
      payloadJson: schema.waIngestQueue.payloadJson,
      titikDakwahId: schema.waIngestQueue.titikDakwahId,
      titikName: schema.titikDakwah.name,
      imageUrl: schema.waIngestQueue.imageUrl,
      createdAt: schema.waIngestQueue.createdAt,
      groupName: schema.waMessages.groupName,
    })
    .from(schema.waIngestQueue)
    .leftJoin(schema.titikDakwah, eq(schema.titikDakwah.id, schema.waIngestQueue.titikDakwahId))
    .leftJoin(schema.waMessages, eq(schema.waMessages.id, schema.waIngestQueue.messageId))
    .where(eq(schema.waIngestQueue.status, "pending"))
    .orderBy(desc(schema.waIngestQueue.createdAt))
    .limit(100);
}

/** Log pesan WA terbaru. */
export async function listRecentMessages(limit = 50) {
  return db
    .select()
    .from(schema.waMessages)
    .orderBy(desc(schema.waMessages.createdAt))
    .limit(limit);
}

export async function listTitikOptions() {
  const rows = await db
    .select({ id: schema.titikDakwah.id, name: schema.titikDakwah.name })
    .from(schema.titikDakwah)
    .orderBy(schema.titikDakwah.name);
  return rows;
}
