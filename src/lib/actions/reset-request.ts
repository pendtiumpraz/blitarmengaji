"use server";

import crypto from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";

/**
 * Server action LUPA SANDI — bagian REQUEST.
 * Pola useActionState: requestReset(prev, formData) -> ResetRequestState.
 *
 * Privasi: JANGAN bocorkan apakah email terdaftar. Pesan netral untuk
 * semua kasus valid; resetUrl hanya disertakan bila user benar ada.
 *
 * Catatan: belum ada layanan email, jadi tautan reset ditampilkan di layar
 * (di produksi nanti dikirim via email). Token disimpan di verification_tokens
 * dengan identifier `pwreset:<email>` (composite PK identifier+token).
 */

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam

const requestSchema = z.object({
  email: z.string().trim().email("Format email tidak valid."),
});

export type ResetRequestState = {
  ok: boolean;
  resetUrl?: string;
  message: string;
};

const NEUTRAL_MESSAGE =
  "Jika email tersebut terdaftar, kami telah membuat tautan untuk mengatur ulang kata sandimu.";

export async function requestReset(
  _prev: ResetRequestState | undefined,
  formData: FormData,
): Promise<ResetRequestState> {
  const parsed = requestSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Data tidak valid.",
    };
  }

  const email = parsed.data.email.toLowerCase();

  // Cek user aktif (belum dihapus). Hasil cek TIDAK dibocorkan ke pesan.
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.email, email), isNull(schema.users.deletedAt)))
    .limit(1);

  // Email tidak terdaftar: balas pesan netral yang sama (tanpa resetUrl).
  if (!user) {
    return { ok: true, message: NEUTRAL_MESSAGE };
  }

  const identifier = `pwreset:${email}`;

  // Hapus token lama untuk identifier ini agar hanya satu yang berlaku.
  await db
    .delete(schema.verificationTokens)
    .where(eq(schema.verificationTokens.identifier, identifier));

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MS);

  await db.insert(schema.verificationTokens).values({
    identifier,
    token,
    expires,
  });

  return {
    ok: true,
    resetUrl: `/atur-ulang/${token}`,
    message: NEUTRAL_MESSAGE,
  };
}
