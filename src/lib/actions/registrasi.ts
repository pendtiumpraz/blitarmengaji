"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadToBlob } from "@/lib/blob";
import { resolveUploadToken } from "@/lib/storage";

/**
 * Server actions PENDAFTARAN MANDIRI (self-service) untuk hub /gabung.
 * Berbeda dari src/lib/actions/titik.ts (yang dipakai admin & butuh requirePermission):
 * di sini SIAPA PUN yang LOGIN (jamaah) boleh mengajukan. Hasilnya selalu row
 * status 'pending' milik user pengaju (ownerUserId) — verifikasi & assign role
 * dilakukan admin (agent lain).
 */

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

const titikSchema = z.object({
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

/**
 * Daftarkan Titik Dakwah (masjid/mushola/majelis) secara mandiri oleh jamaah.
 * WAJIB login: ambil userId dari sesi; bila null lempar error.
 * Insert row titik_dakwah { ...field, ownerUserId, status: 'pending' }.
 */
export async function registerTitik(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Anda harus masuk untuk mengajukan titik dakwah.");
  }

  const parsed = titikSchema.safeParse({
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
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;

  // Upload cover ASLI ke Vercel Blob (folder logis 'titik/cover'). Pengaju adalah
  // jamaah biasa, jadi storage owner = user; fallback ke token global bila tak ada.
  const token = await resolveUploadToken("user", userId);
  const coverImage = await uploadToBlob(
    formData.get("coverFile") as File | null,
    "titik/cover",
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
    ownerUserId: userId,
    status: "pending",
  });

  revalidatePath("/gabung/titik");
  revalidatePath("/akun");
  redirect("/akun?diajukan=titik");
}
