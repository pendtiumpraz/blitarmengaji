import { db, schema } from "@/lib/db";
import { and, count, desc, eq, isNull } from "drizzle-orm";

/**
 * Query READ untuk modul NOTIFIKASI in-app (halaman /notifikasi).
 * Tabel `notifications` TIDAK pakai soft delete (lihat db/schema.ts),
 * jadi tidak ada filter deletedAt. Selalu scoped per `userId`.
 */

export type MyNotification = {
  id: string;
  type: string;
  payloadJson: unknown;
  readAt: Date | null;
  createdAt: Date;
};

/**
 * Daftar notifikasi milik satu user, terbaru dulu.
 * @param limit jumlah maksimum baris (default 50).
 */
export async function listMyNotifications(
  userId: string,
  limit = 50,
): Promise<MyNotification[]> {
  return db
    .select({
      id: schema.notifications.id,
      type: schema.notifications.type,
      payloadJson: schema.notifications.payloadJson,
      readAt: schema.notifications.readAt,
      createdAt: schema.notifications.createdAt,
    })
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit);
}

/** Jumlah notifikasi BELUM dibaca (readAt IS NULL) milik satu user. */
export async function unreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
      ),
    );
  return row?.value ?? 0;
}
