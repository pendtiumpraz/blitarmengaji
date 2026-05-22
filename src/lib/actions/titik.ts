"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";
import { resolveUploadToken } from "@/lib/storage";

/**
 * Server actions (MUTATION) untuk domain Titik Dakwah.
 * - RBAC dicek via requirePermission (lihat AGENTS.md §4).
 * - Soft delete: set deletedAt + deletedBy, JANGAN DELETE fisik.
 */

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

const createSchema = z.object({
  name: z.string().trim().min(2, "Nama titik minimal 2 karakter."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug minimal 2 karakter.")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  address: z.string().trim().optional(),
  kelurahan: z.string().trim().optional(),
  kecamatan: z.string().trim().optional(),
  contactPhone: z.string().trim().optional(),
  contactEmail: z.string().trim().email("Format email tidak valid.").optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  gmapsUrl: z.string().trim().url("Link Google Maps tidak valid.").optional(),
});

/** Buat titik dakwah baru. status default 'pending', ownerUserId = user login. */
export async function createTitik(formData: FormData): Promise<void> {
  await requirePermission("titik.create");

  const parsed = createSchema.safeParse({
    name: opt(formData.get("name")),
    slug: opt(formData.get("slug")),
    address: opt(formData.get("address")),
    kelurahan: opt(formData.get("kelurahan")),
    kecamatan: opt(formData.get("kecamatan")),
    contactPhone: opt(formData.get("contact_phone")),
    contactEmail: opt(formData.get("contact_email")),
    latitude: opt(formData.get("latitude")),
    longitude: opt(formData.get("longitude")),
    gmapsUrl: opt(formData.get("gmaps_url")),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/titik?err=" + encodeURIComponent(msg));
  }

  const data = parsed.data;
  const ownerUserId = (await auth())?.user?.id ?? null;

  // Upload berkas ASLI ke Vercel Blob. Token storage milik titik bila ada, jika
  // tidak fallback ke token global (env) — lihat resolveUploadToken & uploadToBlob.
  const token = await resolveUploadToken("titik", ownerUserId);
  const coverImage = await uploadToBlob(
    formData.get("coverFile") as File | null,
    "titik/cover",
    token,
  );
  const logoUrl = await uploadToBlob(
    formData.get("logoFile") as File | null,
    "titik/logo",
    token,
  );

  await db.insert(schema.titikDakwah).values({
    name: data.name,
    slug: data.slug,
    address: data.address ?? null,
    kelurahan: data.kelurahan ?? null,
    kecamatan: data.kecamatan ?? null,
    contactPhone: data.contactPhone ?? null,
    contactEmail: data.contactEmail ?? null,
    // numeric Drizzle menerima string; latitude/longitude disimpan sebagai numeric.
    latitude: data.latitude !== undefined ? String(data.latitude) : null,
    longitude: data.longitude !== undefined ? String(data.longitude) : null,
    gmapsUrl: data.gmapsUrl ?? null,
    coverImage,
    logoUrl,
    status: "pending",
    ownerUserId,
  });

  revalidatePath("/admin/titik");
  revalidatePath("/peta");
  redirect("/admin/titik?ok=" + encodeURIComponent("Data titik tersimpan."));
}

const updateSchema = createSchema.extend({
  id: z.string().uuid("ID titik tidak valid."),
});

/** Perbarui titik dakwah. Cover/logo lama dipertahankan bila tidak ada unggahan baru. */
export async function updateTitik(formData: FormData): Promise<void> {
  await requirePermission("titik.update");

  const parsed = updateSchema.safeParse({
    id: opt(formData.get("id")),
    name: opt(formData.get("name")),
    slug: opt(formData.get("slug")),
    address: opt(formData.get("address")),
    kelurahan: opt(formData.get("kelurahan")),
    kecamatan: opt(formData.get("kecamatan")),
    contactPhone: opt(formData.get("contact_phone")),
    contactEmail: opt(formData.get("contact_email")),
    latitude: opt(formData.get("latitude")),
    longitude: opt(formData.get("longitude")),
    gmapsUrl: opt(formData.get("gmaps_url")),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/titik?err=" + encodeURIComponent(msg));
  }

  const data = parsed.data;
  const editorUserId = (await auth())?.user?.id ?? null;

  // Unggah berkas baru ke Vercel Blob; bila kosong, pertahankan nilai lama.
  const token = await resolveUploadToken("titik", editorUserId);
  const newCover = await uploadToBlob(
    formData.get("coverFile") as File | null,
    "titik/cover",
    token,
  );
  const newLogo = await uploadToBlob(
    formData.get("logoFile") as File | null,
    "titik/logo",
    token,
  );

  await db
    .update(schema.titikDakwah)
    .set({
      name: data.name,
      slug: data.slug,
      address: data.address ?? null,
      kelurahan: data.kelurahan ?? null,
      kecamatan: data.kecamatan ?? null,
      contactPhone: data.contactPhone ?? null,
      contactEmail: data.contactEmail ?? null,
      latitude: data.latitude !== undefined ? String(data.latitude) : null,
      longitude: data.longitude !== undefined ? String(data.longitude) : null,
      gmapsUrl: data.gmapsUrl ?? null,
      // null dari uploadToBlob = tidak ada unggahan baru ⇒ jangan timpa kolom lama.
      ...(newCover ? { coverImage: newCover } : {}),
      ...(newLogo ? { logoUrl: newLogo } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.titikDakwah.id, data.id), isNull(schema.titikDakwah.deletedAt)));

  revalidatePath("/admin/titik");
  revalidatePath("/peta");
  redirect("/admin/titik?ok=" + encodeURIComponent("Data titik tersimpan."));
}

const deleteSchema = z.object({
  id: z.string().uuid("ID titik tidak valid."),
});

/** Soft delete titik dakwah (set deletedAt + deletedBy). */
export async function softDeleteTitik(formData: FormData): Promise<void> {
  await requirePermission("titik.delete");

  const parsed = deleteSchema.safeParse({ id: opt(formData.get("id")) });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const deletedBy = (await auth())?.user?.id ?? null;

  await db
    .update(schema.titikDakwah)
    .set({ deletedAt: new Date(), deletedBy })
    .where(and(eq(schema.titikDakwah.id, parsed.data.id), isNull(schema.titikDakwah.deletedAt)));

  revalidatePath("/admin/titik");
  revalidatePath("/peta");
  redirect("/admin/titik?ok=" + encodeURIComponent("Titik dihapus — tersedia di Recycle Bin."));
}

/** Aktifkan / nonaktifkan titik dakwah (tanpa hapus). Nonaktif = hilang dari peta & dropdown. */
export async function toggleTitikActive(formData: FormData): Promise<void> {
  await requirePermission("titik.update");

  const parsed = deleteSchema.safeParse({ id: opt(formData.get("id")) });
  if (!parsed.success) {
    redirect("/admin/titik?err=" + encodeURIComponent("Titik tidak valid."));
  }

  const rows = await db
    .select({ isActive: schema.titikDakwah.isActive })
    .from(schema.titikDakwah)
    .where(and(eq(schema.titikDakwah.id, parsed.data.id), isNull(schema.titikDakwah.deletedAt)))
    .limit(1);
  if (!rows[0]) {
    redirect("/admin/titik?err=" + encodeURIComponent("Titik tidak ditemukan."));
  }

  const next = !rows[0].isActive;
  await db
    .update(schema.titikDakwah)
    .set({ isActive: next, updatedAt: new Date() })
    .where(eq(schema.titikDakwah.id, parsed.data.id));

  revalidatePath("/admin/titik");
  revalidatePath("/peta");
  redirect("/admin/titik?ok=" + encodeURIComponent(next ? "Titik diaktifkan." : "Titik dinonaktifkan."));
}
