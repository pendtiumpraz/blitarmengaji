"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadToBlob } from "@/lib/blob";
import { resolveUploadToken } from "@/lib/storage";

/**
 * Server actions (MUTATION) untuk PROFIL user yang sedang login.
 * - WAJIB login (auth()) — bukan permission RBAC; user mengelola dirinya sendiri.
 * - Avatar di-upload ke Vercel Blob lalu disimpan ke users.image.
 */

/**
 * Unggah foto profil (avatar) user yang sedang login → users.image.
 * Berkas ASLI dikirim lewat field 'avatarFile' (multipart) dan di-upload ke
 * Vercel Blob via uploadToBlob (token storage user bila ada, fallback global).
 */
export async function updateAvatar(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Harus masuk untuk mengubah foto profil.");
  }

  const file = formData.get("avatarFile") as File | null;
  if (!file || typeof file === "string" || file.size === 0) {
    throw new Error("Pilih berkas foto terlebih dahulu.");
  }

  // Token storage milik user bila ada storage_config default-nya; jika tidak,
  // fallback ke token global (env) — lihat resolveUploadToken & uploadToBlob.
  const token = await resolveUploadToken("user", userId);
  const url = await uploadToBlob(file, "avatar", token);
  if (!url) {
    throw new Error("Gagal mengunggah foto profil.");
  }

  await db
    .update(schema.users)
    .set({ image: url, updatedAt: new Date() })
    .where(and(eq(schema.users.id, userId), isNull(schema.users.deletedAt)));

  revalidatePath("/akun");
}
