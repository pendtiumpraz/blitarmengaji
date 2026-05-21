import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiConversations, aiMessages } from "../../../db/schema";

/**
 * Query layer untuk riwayat chat AI (percakapan & pesan) per user.
 * Selalu memfilter soft-delete (deleted_at IS NULL) pada ai_conversations,
 * dan selalu memastikan kepemilikan (ownership) ke userId yang diberikan.
 *
 * Catatan: ai_messages tidak punya kolom soft-delete; penghapusan dilakukan
 * di level percakapan (soft delete ai_conversations).
 */

export type ConversationListItem = {
  id: string;
  title: string | null;
  createdAt: Date;
};

export type ConversationMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  createdAt: Date;
};

/**
 * Daftar percakapan AI milik user (terbaru dulu), hanya yang aktif
 * (deleted_at IS NULL). Mengembalikan array kosong bila tidak ada.
 */
export async function listMyConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  return db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      createdAt: aiConversations.createdAt,
    })
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.userId, userId),
        isNull(aiConversations.deletedAt),
      ),
    )
    .orderBy(desc(aiConversations.createdAt));
}

/**
 * Pesan dalam satu percakapan, urut createdAt (terlama dulu) untuk render kronologis.
 * Memastikan percakapan milik user (& belum terhapus). Bila bukan milik user atau
 * percakapan tidak ditemukan, mengembalikan array kosong.
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
): Promise<ConversationMessage[]> {
  // Pastikan percakapan ada, aktif, dan milik user.
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

  if (!owned[0]) return [];

  return db
    .select({
      id: aiMessages.id,
      role: aiMessages.role,
      content: aiMessages.content,
      model: aiMessages.model,
      createdAt: aiMessages.createdAt,
    })
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(asc(aiMessages.createdAt));
}
