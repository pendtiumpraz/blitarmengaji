"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadToBlob } from "@/lib/blob";

/**
 * Server actions PENDAFTARAN MANDIRI PARTNER.
 * Pola: WAJIB login (auth userId) → validasi Zod → upload logo NYATA ke Vercel
 * Blob → insert dengan ownerUserId + status 'pending' → revalidatePath + redirect.
 * Tidak ada permission khusus: cukup pengguna terautentikasi yang mengajukan diri.
 */

const { mediaPartners, businessPartners } = schema;

/** Ambil id user yang sedang login; lempar bila belum masuk. */
async function requireUserId(): Promise<string> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) throw new Error("Anda harus masuk terlebih dahulu untuk mendaftar.");
  return uid;
}

/** Normalisasi slug aman dari teks (huruf kecil, tanpa simbol, dipisah strip). */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200);
}

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

/* ============================================================
 * MEDIA PARTNER
 * ============================================================ */

const mediaSchema = z.object({
  name: z.string().trim().min(3, "Nama media minimal 3 karakter.").max(255),
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter.")
    .max(255)
    .transform(slugify)
    .refine((s) => s.length >= 3, "Slug tidak valid; gunakan huruf/angka."),
  description: z.string().trim().max(2000).optional(),
  website: z
    .string()
    .trim()
    .url("Website harus berupa URL yang valid (mis. https://…).")
    .max(255)
    .optional(),
});

/** Pendaftaran mandiri MEDIA PARTNER. status 'pending', menunggu verifikasi admin. */
export async function registerMediaPartner(formData: FormData): Promise<void> {
  const userId = await requireUserId();

  const parsed = mediaSchema.safeParse({
    name: opt(formData.get("name")),
    slug: opt(formData.get("slug")),
    description: opt(formData.get("description")),
    website: opt(formData.get("website")),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data media partner tidak valid.");
  }
  const data = parsed.data;

  // Slug harus unik di antara entri yang belum dihapus.
  const dupe = (
    await db
      .select({ id: mediaPartners.id })
      .from(mediaPartners)
      .where(and(eq(mediaPartners.slug, data.slug), isNull(mediaPartners.deletedAt)))
      .limit(1)
  )[0];
  if (dupe) {
    throw new Error("Slug sudah dipakai media partner lain. Pilih slug yang berbeda.");
  }

  // Upload logo ASLI ke Vercel Blob (opsional).
  const logo = await uploadToBlob(formData.get("logo") as File | null, "partner/media");

  await db.insert(mediaPartners).values({
    name: data.name,
    slug: data.slug,
    logo,
    description: data.description ?? null,
    website: data.website ?? null,
    ownerUserId: userId,
    status: "pending",
  });

  revalidatePath("/gabung/media-partner");
  revalidatePath("/akun");
  redirect("/akun?diajukan=partner");
}

/* ============================================================
 * PARTNER USAHA (BUSINESS PARTNER)
 * ============================================================ */

const businessSchema = z.object({
  name: z.string().trim().min(3, "Nama usaha minimal 3 karakter.").max(255),
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter.")
    .max(255)
    .transform(slugify)
    .refine((s) => s.length >= 3, "Slug tidak valid; gunakan huruf/angka."),
  category: z.string().trim().max(128).optional(),
  description: z.string().trim().max(2000).optional(),
  contactWa: z
    .string()
    .trim()
    .max(32)
    .regex(/^[0-9+\-\s()]+$/, "Nomor WhatsApp hanya boleh angka dan simbol telepon.")
    .optional(),
});

/** Pendaftaran mandiri PARTNER USAHA. status 'pending', menunggu verifikasi admin. */
export async function registerBusinessPartner(formData: FormData): Promise<void> {
  const userId = await requireUserId();

  const parsed = businessSchema.safeParse({
    name: opt(formData.get("name")),
    slug: opt(formData.get("slug")),
    category: opt(formData.get("category")),
    description: opt(formData.get("description")),
    contactWa: opt(formData.get("contactWa")),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data partner usaha tidak valid.");
  }
  const data = parsed.data;

  // Slug harus unik di antara entri yang belum dihapus.
  const dupe = (
    await db
      .select({ id: businessPartners.id })
      .from(businessPartners)
      .where(and(eq(businessPartners.slug, data.slug), isNull(businessPartners.deletedAt)))
      .limit(1)
  )[0];
  if (dupe) {
    throw new Error("Slug sudah dipakai partner usaha lain. Pilih slug yang berbeda.");
  }

  // Upload logo ASLI ke Vercel Blob (opsional).
  const logo = await uploadToBlob(formData.get("logo") as File | null, "partner/usaha");

  await db.insert(businessPartners).values({
    name: data.name,
    slug: data.slug,
    logo,
    description: data.description ?? null,
    category: data.category ?? null,
    contactWa: data.contactWa ?? null,
    ownerUserId: userId,
    status: "pending",
  });

  revalidatePath("/gabung/partner-usaha");
  revalidatePath("/akun");
  redirect("/akun?diajukan=partner");
}
