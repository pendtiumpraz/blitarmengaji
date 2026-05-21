"use server";

import { and, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schema } from "@/lib/db";

/**
 * Server action ALUR LUPA SANDI — bagian CONFIRM (set sandi baru via token).
 *
 * Token disimpan di `verification_tokens`:
 *   { identifier: `pwreset:<email>`, token, expires }
 *
 * Pola useActionState: resetPassword(prev, formData) -> ResetState.
 * Sukses -> kembalikan { ok: true, ... } (form menampilkan pesan + tautan /masuk).
 */

export type ResetState =
  | { ok: false; message: string }
  | { ok: true; message: string };

const PWRESET_PREFIX = "pwreset:";

const resetSchema = z
  .object({
    token: z.string().trim().min(1, "Token tidak ada."),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export async function resetPassword(
  _prev: ResetState | undefined,
  formData: FormData,
): Promise<ResetState> {
  const parsed = resetSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const { token, password } = parsed.data;

  // Cari baris token.
  const [row] = await db
    .select()
    .from(schema.verificationTokens)
    .where(eq(schema.verificationTokens.token, token))
    .limit(1);

  const invalidMsg = "Tautan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.";

  if (!row) {
    return { ok: false, message: invalidMsg };
  }

  // Cek kedaluwarsa.
  if (row.expires.getTime() < Date.now()) {
    // Bersihkan token kedaluwarsa.
    await db
      .delete(schema.verificationTokens)
      .where(
        and(
          eq(schema.verificationTokens.identifier, row.identifier),
          eq(schema.verificationTokens.token, row.token),
        ),
      );
    return { ok: false, message: invalidMsg };
  }

  // Hanya terima token reset sandi (identifier berprefix `pwreset:`).
  if (!row.identifier.startsWith(PWRESET_PREFIX)) {
    return { ok: false, message: invalidMsg };
  }

  const email = row.identifier.slice(PWRESET_PREFIX.length).toLowerCase();
  if (!email) {
    return { ok: false, message: invalidMsg };
  }

  // Pastikan user (aktif/belum dihapus) ada.
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user) {
    // Tidak membocorkan info — perlakukan seperti token tidak valid.
    return { ok: false, message: invalidMsg };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Update sandi.
  await db
    .update(schema.users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(schema.users.email, email));

  // Hapus token (sekali pakai).
  await db
    .delete(schema.verificationTokens)
    .where(
      and(
        eq(schema.verificationTokens.identifier, row.identifier),
        eq(schema.verificationTokens.token, row.token),
      ),
    );

  return {
    ok: true,
    message: "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.",
  };
}
