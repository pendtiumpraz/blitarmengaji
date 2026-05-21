"use server";

import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";

/**
 * Server action untuk domain Donasi.
 * Pola: validasi Zod → cek RBAC/ownership → tulis DB (soft delete via deletedAt/deletedBy)
 * → revalidatePath + redirect. Lihat AGENTS.md §0 & §4.
 */

/** Ambil id user yang sedang login (untuk createdBy/deletedBy). */
async function currentUserId(): Promise<string> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
  return uid;
}

/** Normalisasi nilai numerik Rupiah dari input ("30.000.000" / "Rp 30.000.000" → number). */
const rupiahToNumber = z
  .union([z.string(), z.number()])
  .transform((v) => {
    const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : 0;
  })
  .refine((n) => n >= 0, "Nominal tidak valid");

const optionalText = z
  .string()
  .trim()
  .transform((v): string | null => (v === "" ? null : v));

const optionalDate = z
  .string()
  .trim()
  .transform((v): Date | null => (v === "" ? null : new Date(v)));

const createCampaignSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(255),
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter")
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  titikDakwahId: z.string().uuid("Titik dakwah wajib dipilih"),
  targetAmount: rupiahToNumber,
  description: optionalText,
  startAt: optionalDate,
  endAt: optionalDate,
  qrisImage: optionalText,
  contactLink: optionalText,
});

export async function createCampaign(formData: FormData): Promise<void> {
  // RBAC: boleh membuat untuk semua titik (donation.create) atau hanya milik sendiri (donation.manage_own).
  const allowedAll = await can("donation.create");
  if (!allowedAll) await requirePermission("donation.manage_own");

  const userId = await currentUserId();

  const parsed = createCampaignSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    titikDakwahId: formData.get("titikDakwahId"),
    targetAmount: formData.get("targetAmount") ?? "0",
    description: formData.get("description") ?? "",
    startAt: formData.get("startAt") ?? "",
    endAt: formData.get("endAt") ?? "",
    qrisImage: formData.get("qrisImage") ?? "",
    contactLink: formData.get("contactLink") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data campaign tidak valid.");
  }
  const data = parsed.data;

  // Ownership check: bila hanya manage_own, titik harus dimiliki user.
  if (!allowedAll) {
    const titik = await db
      .select({ ownerUserId: schema.titikDakwah.ownerUserId })
      .from(schema.titikDakwah)
      .where(and(eq(schema.titikDakwah.id, data.titikDakwahId), isNull(schema.titikDakwah.deletedAt)))
      .limit(1);
    if (!titik[0] || titik[0].ownerUserId !== userId) {
      throw new Error("Akses ditolak: Anda hanya bisa membuat campaign untuk titik dakwah sendiri.");
    }
  }

  // Upload berkas NYATA ke Vercel Blob (poster & QRIS). File menang atas input URL.
  const poster = await uploadToBlob(formData.get("posterFile") as File | null, "donasi/poster");
  const qris = await uploadToBlob(formData.get("qrisFile") as File | null, "donasi/qris");

  await db.insert(schema.donationCampaigns).values({
    titikDakwahId: data.titikDakwahId,
    title: data.title,
    slug: data.slug,
    posterImage: poster,
    description: data.description,
    targetAmount: String(data.targetAmount),
    startAt: data.startAt,
    endAt: data.endAt,
    qrisImage: qris ?? data.qrisImage,
    contactLink: data.contactLink,
    createdBy: userId,
  });

  revalidatePath("/admin/donasi");
  revalidatePath("/donasi");
  redirect("/admin/donasi");
}

const updateCampaignSchema = z.object({
  id: z.string().uuid("Campaign tidak valid"),
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(255),
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter")
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  titikDakwahId: z.string().uuid("Titik dakwah wajib dipilih"),
  targetAmount: rupiahToNumber,
  description: optionalText,
  startAt: optionalDate,
  endAt: optionalDate,
  status: z.enum(["active", "completed", "closed"]),
  qrisImage: optionalText,
  contactLink: optionalText,
});

export async function updateCampaign(formData: FormData): Promise<void> {
  // RBAC: pengelola penuh (donation.manage) atau pemilik (donation.manage_own).
  const allowedAll = await can("donation.manage");
  if (!allowedAll) await requirePermission("donation.manage_own");

  const userId = await currentUserId();

  const parsed = updateCampaignSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    titikDakwahId: formData.get("titikDakwahId"),
    targetAmount: formData.get("targetAmount") ?? "0",
    description: formData.get("description") ?? "",
    startAt: formData.get("startAt") ?? "",
    endAt: formData.get("endAt") ?? "",
    status: formData.get("status") ?? "active",
    qrisImage: formData.get("qrisImage") ?? "",
    contactLink: formData.get("contactLink") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data campaign tidak valid.");
  }
  const data = parsed.data;

  // Verifikasi keberadaan + ownership bila perlu (campaign lama & titik tujuan).
  const rows = await db
    .select({
      id: schema.donationCampaigns.id,
      posterImage: schema.donationCampaigns.posterImage,
      qrisImage: schema.donationCampaigns.qrisImage,
      createdBy: schema.donationCampaigns.createdBy,
      titikOwner: schema.titikDakwah.ownerUserId,
    })
    .from(schema.donationCampaigns)
    .leftJoin(schema.titikDakwah, eq(schema.titikDakwah.id, schema.donationCampaigns.titikDakwahId))
    .where(and(eq(schema.donationCampaigns.id, data.id), isNull(schema.donationCampaigns.deletedAt)))
    .limit(1);

  const campaign = rows[0];
  if (!campaign) throw new Error("Campaign tidak ditemukan atau sudah dihapus.");

  if (!allowedAll && campaign.createdBy !== userId && campaign.titikOwner !== userId) {
    throw new Error("Akses ditolak: Anda hanya bisa mengubah campaign sendiri.");
  }

  // Bila pindah titik, pastikan titik tujuan dimiliki user (untuk manage_own).
  if (!allowedAll && data.titikDakwahId !== campaign.titikOwner) {
    const titik = await db
      .select({ ownerUserId: schema.titikDakwah.ownerUserId })
      .from(schema.titikDakwah)
      .where(and(eq(schema.titikDakwah.id, data.titikDakwahId), isNull(schema.titikDakwah.deletedAt)))
      .limit(1);
    if (!titik[0] || titik[0].ownerUserId !== userId) {
      throw new Error("Akses ditolak: Anda hanya bisa memindahkan ke titik dakwah sendiri.");
    }
  }

  // Upload berkas baru bila ada; pertahankan yang lama bila kosong.
  const newPoster = await uploadToBlob(formData.get("posterFile") as File | null, "donasi/poster");
  const newQris = await uploadToBlob(formData.get("qrisFile") as File | null, "donasi/qris");

  await db
    .update(schema.donationCampaigns)
    .set({
      titikDakwahId: data.titikDakwahId,
      title: data.title,
      slug: data.slug,
      posterImage: newPoster ?? campaign.posterImage,
      description: data.description,
      targetAmount: String(data.targetAmount),
      status: data.status,
      startAt: data.startAt,
      endAt: data.endAt,
      qrisImage: newQris ?? data.qrisImage ?? campaign.qrisImage,
      contactLink: data.contactLink,
      updatedAt: new Date(),
    })
    .where(eq(schema.donationCampaigns.id, data.id));

  revalidatePath("/admin/donasi");
  revalidatePath("/donasi");
  revalidatePath(`/donasi/${data.slug}`);
  redirect("/admin/donasi");
}

const addUpdateSchema = z.object({
  campaignId: z.string().uuid("Campaign tidak valid"),
  title: z.string().trim().min(3, "Judul laporan minimal 3 karakter").max(255),
  body: optionalText,
  amountUsed: rupiahToNumber.optional(),
  attachmentUrl: optionalText,
});

export async function addDonationUpdate(formData: FormData): Promise<void> {
  await requirePermission("donation.report");

  const parsed = addUpdateSchema.safeParse({
    campaignId: formData.get("campaignId"),
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    amountUsed: formData.get("amountUsed") ?? "0",
    attachmentUrl: formData.get("attachmentUrl") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data laporan tidak valid.");
  }
  const data = parsed.data;

  // Pastikan campaign masih aktif (belum di-soft-delete).
  const campaign = await db
    .select({ slug: schema.donationCampaigns.slug })
    .from(schema.donationCampaigns)
    .where(and(eq(schema.donationCampaigns.id, data.campaignId), isNull(schema.donationCampaigns.deletedAt)))
    .limit(1);
  if (!campaign[0]) throw new Error("Campaign tidak ditemukan.");

  // Upload bukti/nota NYATA ke Vercel Blob. File menang atas input URL.
  const attachment = await uploadToBlob(
    formData.get("attachmentFile") as File | null,
    "donasi/attachment",
  );

  await db.insert(schema.donationUpdates).values({
    campaignId: data.campaignId,
    title: data.title,
    body: data.body,
    amountUsed: data.amountUsed ? String(data.amountUsed) : null,
    attachmentUrl: attachment ?? data.attachmentUrl,
  });

  revalidatePath("/admin/donasi");
  revalidatePath("/donasi");
  revalidatePath(`/donasi/${campaign[0].slug}`);
  redirect("/admin/donasi");
}

const softDeleteSchema = z.object({
  id: z.string().uuid("Campaign tidak valid"),
});

export async function softDeleteCampaign(formData: FormData): Promise<void> {
  // RBAC: penghapus penuh (donation.manage / donation.delete) atau pemilik (donation.manage_own).
  const allowedAll = (await can("donation.manage")) || (await can("donation.delete"));
  if (!allowedAll) await requirePermission("donation.manage_own");

  const userId = await currentUserId();

  const parsed = softDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Campaign tidak valid.");
  }

  // Verifikasi keberadaan + ownership bila perlu.
  const rows = await db
    .select({
      id: schema.donationCampaigns.id,
      createdBy: schema.donationCampaigns.createdBy,
      titikOwner: schema.titikDakwah.ownerUserId,
    })
    .from(schema.donationCampaigns)
    .leftJoin(schema.titikDakwah, eq(schema.titikDakwah.id, schema.donationCampaigns.titikDakwahId))
    .where(and(eq(schema.donationCampaigns.id, parsed.data.id), isNull(schema.donationCampaigns.deletedAt)))
    .limit(1);

  const campaign = rows[0];
  if (!campaign) throw new Error("Campaign tidak ditemukan atau sudah dihapus.");

  if (!allowedAll && campaign.createdBy !== userId && campaign.titikOwner !== userId) {
    throw new Error("Akses ditolak: Anda hanya bisa menghapus campaign sendiri.");
  }

  await db
    .update(schema.donationCampaigns)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(eq(schema.donationCampaigns.id, parsed.data.id));

  revalidatePath("/admin/donasi");
  revalidatePath("/donasi");
  redirect("/admin/donasi");
}
