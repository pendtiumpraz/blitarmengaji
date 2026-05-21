"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Server actions (MUTATION) untuk modul NOTIFIKASI in-app.
 * - markRead(formData: id) : tandai SATU notifikasi sebagai dibaca.
 * - markAllRead()          : tandai SEMUA notifikasi user sebagai dibaca.
 *
 * Keamanan: tiap action wajib sesi valid & HANYA menyentuh notifikasi
 * MILIK user tersebut (WHERE user_id = sesi). Tabel notifications tanpa
 * soft delete, jadi cukup set read_at = now untuk yang belum dibaca.
 */

const markReadSchema = z.object({
  id: z.string().uuid("ID notifikasi tidak valid."),
});

/** Tandai satu notifikasi (milik user) sebagai sudah dibaca. */
export async function markRead(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali.");
  }

  const parsed = markReadSchema.safeParse({
    id: String(formData.get("id") ?? "").trim(),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.id, parsed.data.id),
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
      ),
    );

  revalidatePath("/notifikasi");
}

/** Tandai SEMUA notifikasi belum dibaca milik user sebagai sudah dibaca. */
export async function markAllRead(): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali.");
  }

  await db
    .update(schema.notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.userId, userId),
        isNull(schema.notifications.readAt),
      ),
    );

  revalidatePath("/notifikasi");
}
