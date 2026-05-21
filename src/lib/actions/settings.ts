"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";

/**
 * Server actions (MUTATION) untuk domain PENGATURAN.
 * - RBAC: requirePermission('settings.manage') (lihat AGENTS.md §4).
 * - settings disimpan key/value: upsert pakai onConflictDoUpdate(settings.key).
 * - Token storage TIDAK pernah disentuh di sini (terenkripsi di server, tak ke client).
 */

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

/** Upsert satu key settings (value disimpan sebagai JSON). */
async function upsertSetting(key: string, value: unknown) {
  await db
    .insert(schema.settings)
    .values({ key, valueJson: value })
    .onConflictDoUpdate({
      target: schema.settings.key,
      set: { valueJson: value, updatedAt: new Date() },
    });
}

const settingsSchema = z.object({
  siteName: z.string().trim().min(2, "Nama situs minimal 2 karakter."),
  siteDescription: z.string().trim().optional(),
  contactEmail: z.string().trim().email("Format email tidak valid.").optional(),
  contactWhatsapp: z.string().trim().optional(),
  defaultTheme: z
    .string()
    .trim()
    .min(1, "Pilih tema default.")
    .regex(/^[a-z0-9-]+$/, "Slug tema tidak valid."),
  instagram: z.string().trim().optional(),
  youtube: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
});

/**
 * Simpan pengaturan branding + tema default ke tabel `settings`
 * (beberapa key via onConflictDoUpdate). Butuh permission settings.manage.
 */
export async function saveSettings(formData: FormData): Promise<void> {
  await requirePermission("settings.manage");

  const parsed = settingsSchema.safeParse({
    siteName: opt(formData.get("site_name")),
    siteDescription: opt(formData.get("site_description")),
    contactEmail: opt(formData.get("contact_email")),
    contactWhatsapp: opt(formData.get("contact_whatsapp")),
    defaultTheme: opt(formData.get("default_theme")),
    instagram: opt(formData.get("instagram")),
    youtube: opt(formData.get("youtube")),
    facebook: opt(formData.get("facebook")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const d = parsed.data;

  // Upload NYATA logo situs ke Vercel Blob (bila ada berkas) -> settings.site_logo.
  const logoUrl = await uploadToBlob(formData.get("logoFile") as File | null, "branding");

  await Promise.all([
    upsertSetting("site_name", d.siteName),
    upsertSetting("site_description", d.siteDescription ?? ""),
    upsertSetting("contact_email", d.contactEmail ?? ""),
    upsertSetting("contact_whatsapp", d.contactWhatsapp ?? ""),
    upsertSetting("default_theme", d.defaultTheme),
    upsertSetting("social_instagram", d.instagram ?? ""),
    upsertSetting("social_youtube", d.youtube ?? ""),
    upsertSetting("social_facebook", d.facebook ?? ""),
    // Hanya overwrite logo bila ada berkas baru yang diunggah.
    ...(logoUrl ? [upsertSetting("site_logo", logoUrl)] : []),
  ]);

  revalidatePath("/admin/settings");
}

const paymentSchema = z
  .object({
    bankName: z.string().trim().optional(),
    accountNo: z.string().trim().optional(),
    accountName: z.string().trim().optional(),
    waNumber: z.string().trim().optional(),
    qrisImage: z.string().trim().optional(),
  })
  .refine((v) => v.bankName || v.accountNo || v.waNumber || v.qrisImage, {
    message: "Isi minimal nama bank / no. rekening / no. WhatsApp / gambar QRIS.",
  });

/**
 * Simpan metode pembayaran global (bank + konfirmasi WhatsApp) ke `payment_methods`.
 * Butuh permission settings.manage. Insert baris baru bertipe 'bank' milik global.
 */
export async function savePaymentMethod(formData: FormData): Promise<void> {
  await requirePermission("settings.manage");

  // Upload NYATA gambar QRIS ke Vercel Blob (bila ada berkas) -> payment_methods.qrisImage.
  const qrisUrl = await uploadToBlob(formData.get("qrisFile") as File | null, "payment");

  const parsed = paymentSchema.safeParse({
    bankName: opt(formData.get("bank_name")),
    accountNo: opt(formData.get("account_no")),
    accountName: opt(formData.get("account_name")),
    waNumber: opt(formData.get("wa_number")),
    qrisImage: qrisUrl ?? undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const d = parsed.data;

  await db.insert(schema.paymentMethods).values({
    ownerType: "global",
    ownerId: null,
    // QRIS bila gambar diunggah, selain itu transfer bank.
    type: d.qrisImage ? "qris" : "bank",
    qrisImage: d.qrisImage ?? null,
    bankName: d.bankName ?? null,
    accountNo: d.accountNo ?? null,
    accountName: d.accountName ?? null,
    waNumber: d.waNumber ?? null,
    isActive: true,
  });

  revalidatePath("/admin/settings");
}
