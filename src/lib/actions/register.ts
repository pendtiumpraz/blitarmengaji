"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schema } from "@/lib/db";

/**
 * Server action REGISTER (dibuat terpisah dari auth.ts — milik bersama).
 * Pola useActionState: registerUser(prev, formData) -> string|undefined (pesan error).
 * Sukses -> redirect('/masuk?registered=1').
 */

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter."),
    email: z.string().trim().email("Format email tidak valid."),
    password: z.string().min(8, "Kata sandi minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["confirmPassword"],
  });

export async function registerUser(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return parsed.error.issues[0]?.message ?? "Data tidak valid.";
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Cek email belum terpakai (akun aktif / belum dihapus).
  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.email, normalizedEmail), isNull(schema.users.deletedAt)))
    .limit(1);

  if (existing.length > 0) {
    return "Email sudah terdaftar. Silakan masuk.";
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [created] = await db
    .insert(schema.users)
    .values({
      name,
      email: normalizedEmail,
      passwordHash,
      status: "active",
    })
    .returning({ id: schema.users.id });

  // Assign role default 'jamaah'.
  const [jamaahRole] = await db
    .select({ id: schema.roles.id })
    .from(schema.roles)
    .where(and(eq(schema.roles.slug, "jamaah"), isNull(schema.roles.deletedAt)))
    .limit(1);

  if (jamaahRole && created) {
    await db
      .insert(schema.userRoles)
      .values({ userId: created.id, roleId: jamaahRole.id })
      .onConflictDoNothing();
  }

  // redirect melempar NEXT_REDIRECT — jangan dibungkus try/catch.
  redirect("/masuk?registered=1");
}
