"use server";

import { and, eq, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadToBlob } from "@/lib/blob";
import { resolveUploadToken } from "@/lib/storage";

/**
 * Server action PENDAFTARAN MANDIRI USTADZ (publik, /gabung/ustadz).
 * Pola (lihat AGENTS.md §0 & §4):
 *   WAJIB login (auth) → validasi Zod → cek duplikat (1 user 1 profil ustadz
 *   aktif/pending) → upload foto ke Vercel Blob → insert ustadz_profiles
 *   { userId, name, slug, specialization, bio, photo, status: 'pending' } →
 *   revalidatePath + redirect('/akun?diajukan=ustadz').
 *
 * Kolom ustadz_profiles yang dipakai: userId, name, slug, specialization, bio,
 * photo, status.
 */

const opt = (v: FormDataEntryValue | null): string | undefined => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug minimal 2 karakter.")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  specialization: z.string().trim().optional(),
  bio: z.string().trim().optional(),
});

/**
 * Daftarkan diri sebagai ustadz. Membuat row ustadz_profiles status 'pending'
 * milik user yang sedang login (menunggu verifikasi admin).
 */
export async function registerUstadz(formData: FormData): Promise<void> {
  // WAJIB login.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk?next=/gabung/ustadz");

  const parsed = registerSchema.safeParse({
    name: opt(formData.get("name")),
    slug: opt(formData.get("slug")),
    specialization: opt(formData.get("specialization")),
    bio: opt(formData.get("bio")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;

  // Cegah duplikat: 1 user hanya boleh punya 1 profil ustadz yang aktif/pending.
  const mine = await db
    .select({ id: schema.ustadzProfiles.id })
    .from(schema.ustadzProfiles)
    .where(
      and(
        eq(schema.ustadzProfiles.userId, userId),
        inArray(schema.ustadzProfiles.status, ["active", "pending"]),
        isNull(schema.ustadzProfiles.deletedAt),
      ),
    )
    .limit(1);

  if (mine.length > 0) {
    throw new Error("Anda sudah mengajukan / memiliki profil ustadz.");
  }

  // Cegah slug bentrok dengan profil ustadz aktif lain (slug unik per profil aktif).
  const slugTaken = await db
    .select({ id: schema.ustadzProfiles.id })
    .from(schema.ustadzProfiles)
    .where(and(eq(schema.ustadzProfiles.slug, data.slug), isNull(schema.ustadzProfiles.deletedAt)))
    .limit(1);

  if (slugTaken.length > 0) {
    throw new Error("Slug sudah dipakai. Silakan pilih slug lain.");
  }

  // Upload foto ASLI ke Vercel Blob (multipart). Token storage milik ustadz bila
  // ada, jika tidak fallback ke token global (env) — lihat resolveUploadToken.
  const token = await resolveUploadToken("ustadz", userId);
  const photo = await uploadToBlob(
    formData.get("photoFile") as File | null,
    "ustadz/photo",
    token,
  );

  await db.insert(schema.ustadzProfiles).values({
    userId,
    name: data.name,
    slug: data.slug,
    specialization: data.specialization ?? null,
    bio: data.bio ?? null,
    photo,
    status: "pending",
  });

  revalidatePath("/gabung/ustadz");
  revalidatePath("/akun");
  redirect("/akun?diajukan=ustadz");
}
