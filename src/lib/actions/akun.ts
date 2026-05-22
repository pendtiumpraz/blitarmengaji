"use server";

import { and, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";

const DAY = 24 * 60 * 60 * 1000;
const PW_COOLDOWN_DAYS = 14;

async function currentUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/masuk");
  return id;
}

const pwSchema = z.object({
  current: z.string().min(1, "Password saat ini wajib diisi."),
  next: z.string().min(8, "Password baru minimal 8 karakter."),
});

/**
 * Ganti password sendiri.
 * - Pertama kali: bebas (passwordChangedAt masih null).
 * - Berikutnya: butuh jeda 14 hari sejak perubahan terakhir.
 */
export async function changeOwnPassword(formData: FormData): Promise<void> {
  const id = await currentUserId();
  const parsed = pwSchema.safeParse({
    current: String(formData.get("current") ?? ""),
    next: String(formData.get("next") ?? ""),
  });
  if (!parsed.success) {
    redirect("/akun?err=" + encodeURIComponent(parsed.error.issues[0]?.message ?? "Data tidak valid."));
  }

  const rows = await db
    .select({ hash: schema.users.passwordHash, changedAt: schema.users.passwordChangedAt })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  const u = rows[0];
  if (!u?.hash || !(await bcrypt.compare(parsed.data.current, u.hash))) {
    redirect("/akun?err=" + encodeURIComponent("Password saat ini salah."));
  }

  // Cooldown 14 hari untuk perubahan berikutnya (pertama kali bebas).
  if (u.changedAt) {
    const nextAllowed = new Date(u.changedAt).getTime() + PW_COOLDOWN_DAYS * DAY;
    if (Date.now() < nextAllowed) {
      const tgl = new Date(nextAllowed).toLocaleDateString("id-ID", { dateStyle: "long" });
      redirect("/akun?err=" + encodeURIComponent(`Password baru bisa diubah lagi setelah ${tgl} (jeda 14 hari).`));
    }
  }

  const newHash = await bcrypt.hash(parsed.data.next, 10);
  await db
    .update(schema.users)
    .set({ passwordHash: newHash, passwordChangedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, id));

  revalidatePath("/akun");
  redirect("/akun?ok=" + encodeURIComponent("Password berhasil diubah."));
}

const emailSchema = z.object({ email: z.string().trim().email("Format email tidak valid.") });

/** Ganti email sendiri — HANYA 1 kali (setelah itu terkunci). */
export async function changeOwnEmail(formData: FormData): Promise<void> {
  const id = await currentUserId();
  const parsed = emailSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (!parsed.success) {
    redirect("/akun?err=" + encodeURIComponent(parsed.error.issues[0]?.message ?? "Email tidak valid."));
  }
  const email = parsed.data.email.toLowerCase();

  const rows = await db
    .select({ email: schema.users.email, changedAt: schema.users.emailChangedAt })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  const u = rows[0];
  if (!u) redirect("/masuk");
  if (u.changedAt) {
    redirect("/akun?err=" + encodeURIComponent("Email hanya dapat diubah satu kali dan sudah pernah diubah."));
  }
  if (email === u.email.toLowerCase()) {
    redirect("/akun?err=" + encodeURIComponent("Email baru sama dengan email saat ini."));
  }
  const taken = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.email, email), ne(schema.users.id, id)))
    .limit(1);
  if (taken[0]) {
    redirect("/akun?err=" + encodeURIComponent("Email sudah digunakan akun lain."));
  }

  await db
    .update(schema.users)
    .set({ email, emailChangedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, id));

  revalidatePath("/akun");
  redirect("/akun?ok=" + encodeURIComponent("Email berhasil diubah (hanya bisa sekali)."));
}
