"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { aiConversations } from "../../../db/schema";

/**
 * Server actions (MUTATION) untuk riwayat chat AI.
 * Pembuatan percakapan & penyimpanan pesan dilakukan di route handler
 * (src/app/api/ai/chat/route.ts). Di sini hanya penghapusan percakapan.
 */

/**
 * Hapus (soft delete) sebuah percakapan AI milik user.
 * - Wajib login.
 * - Memastikan kepemilikan (ownership): hanya percakapan milik user yang bisa dihapus.
 * - Soft delete: set deleted_at & deleted_by, JANGAN hapus fisik (konvensi repo).
 */
export async function deleteConversation(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali.");
  }

  const raw = formData.get("id");
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!id) {
    throw new Error("ID percakapan tidak valid.");
  }

  await db
    .update(aiConversations)
    .set({ deletedAt: new Date(), deletedBy: userId })
    .where(
      and(
        eq(aiConversations.id, id),
        eq(aiConversations.userId, userId),
        isNull(aiConversations.deletedAt),
      ),
    );

  revalidatePath("/tanya-ai");
}
