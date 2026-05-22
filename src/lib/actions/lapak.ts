"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";

/**
 * Server actions (MUTATION) untuk domain LAPAK (products).
 * Pola: cek RBAC/ownership → upload berkas NYATA ke Vercel Blob → validasi Zod →
 * tulis DB → revalidatePath + redirect. Soft delete via deletedAt/deletedBy.
 * Kebijakan: MAKS 3 produk AKTIF per partner usaha (lihat AGENTS.md §4).
 */

const MAX_ACTIVE_PRODUCTS = 3;

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

const createSchema = z.object({
  title: z.string().trim().min(3, "Nama produk minimal 3 karakter.").max(255),
  businessPartnerId: z.string().uuid("Partner usaha wajib dipilih."),
  price: z.coerce.number().min(0, "Harga tidak valid."),
  contactLink: z.string().trim().min(1, "Kontak/link pemesanan wajib diisi."),
  description: z.string().trim().optional(),
});

/** Buat produk lapak baru. status default 'active'; upload posterFile → posterImage. */
export async function createProduct(formData: FormData): Promise<void> {
  // RBAC: pengelola penuh (lapak.manage) atau pemilik (lapak.manage_own).
  const allowedAll = await can("lapak.manage");
  if (!allowedAll) await requirePermission("lapak.manage_own");

  const parsed = createSchema.safeParse({
    title: opt(formData.get("title")),
    businessPartnerId: opt(formData.get("businessPartnerId")),
    price: opt(formData.get("price")),
    contactLink: opt(formData.get("contactLink")),
    description: opt(formData.get("description")),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data produk tidak valid.";
    redirect("/admin/lapak?err=" + encodeURIComponent(msg));
  }
  const data = parsed.data;

  // Pastikan partner ada & belum dihapus.
  const partner = (
    await db
      .select({ id: schema.businessPartners.id, ownerUserId: schema.businessPartners.ownerUserId })
      .from(schema.businessPartners)
      .where(
        and(
          eq(schema.businessPartners.id, data.businessPartnerId),
          isNull(schema.businessPartners.deletedAt),
        ),
      )
      .limit(1)
  )[0];
  if (!partner) {
    redirect("/admin/lapak?err=" + encodeURIComponent("Partner usaha tidak ditemukan."));
  }

  // Ownership: bila hanya manage_own, partner harus milik user login.
  if (!allowedAll) {
    const userId = (await auth())?.user?.id ?? null;
    if (!userId || partner.ownerUserId !== userId) {
      redirect(
        "/admin/lapak?err=" +
          encodeURIComponent("Akses ditolak: Anda hanya bisa menambah produk untuk usaha sendiri."),
      );
    }
  }

  // ENFORCE maksimal 3 produk AKTIF per partner.
  const activeRows = await db
    .select({ total: count(schema.products.id) })
    .from(schema.products)
    .where(
      and(
        eq(schema.products.businessPartnerId, data.businessPartnerId),
        eq(schema.products.status, "active"),
        isNull(schema.products.deletedAt),
      ),
    );
  const activeCount = Number(activeRows[0]?.total ?? 0);
  if (activeCount >= MAX_ACTIVE_PRODUCTS) {
    redirect(
      "/admin/lapak?err=" +
        encodeURIComponent(
          `Batas tercapai: maksimal ${MAX_ACTIVE_PRODUCTS} produk aktif per partner usaha.`,
        ),
    );
  }

  // Upload poster ASLI ke Vercel Blob (token global env).
  const posterImage = await uploadToBlob(
    formData.get("posterFile") as File | null,
    "lapak/poster",
  );

  await db.insert(schema.products).values({
    businessPartnerId: data.businessPartnerId,
    title: data.title,
    posterImage,
    description: data.description ?? null,
    // numeric Drizzle menerima string.
    price: String(data.price),
    contactLink: data.contactLink,
    status: "active",
  });

  revalidatePath("/admin/lapak");
  revalidatePath("/lapak");
  redirect("/admin/lapak?ok=" + encodeURIComponent("Tersimpan."));
}

const updateSchema = createSchema
  .omit({ businessPartnerId: true })
  .extend({
    id: z.string().uuid("ID produk tidak valid."),
    status: z.enum(["active", "inactive"], {
      message: "Status produk harus active atau inactive.",
    }),
  });

/**
 * Perbarui produk lapak. RBAC: lapak.manage (penuh) ATAU lapak.manage_own + ownership.
 * Upload posterFile baru bila ada; jika tidak, pertahankan poster lama.
 * Tetap menegakkan maksimal 3 produk AKTIF per partner — HANYA saat mengaktifkan
 * produk yang sebelumnya non-aktif.
 */
export async function updateProduct(formData: FormData): Promise<void> {
  // RBAC: pengelola penuh (lapak.manage) atau pemilik (lapak.manage_own).
  const allowedAll = await can("lapak.manage");
  if (!allowedAll) await requirePermission("lapak.manage_own");

  const parsed = updateSchema.safeParse({
    id: opt(formData.get("id")),
    title: opt(formData.get("title")),
    price: opt(formData.get("price")),
    contactLink: opt(formData.get("contactLink")),
    description: opt(formData.get("description")),
    status: opt(formData.get("status")),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data produk tidak valid.";
    redirect("/admin/lapak?err=" + encodeURIComponent(msg));
  }
  const data = parsed.data;

  // Ambil produk + pemilik usaha (pastikan ada & belum dihapus).
  const existing = (
    await db
      .select({
        posterImage: schema.products.posterImage,
        businessPartnerId: schema.products.businessPartnerId,
        status: schema.products.status,
        ownerUserId: schema.businessPartners.ownerUserId,
      })
      .from(schema.products)
      .innerJoin(
        schema.businessPartners,
        eq(schema.businessPartners.id, schema.products.businessPartnerId),
      )
      .where(and(eq(schema.products.id, data.id), isNull(schema.products.deletedAt)))
      .limit(1)
  )[0];
  if (!existing) {
    redirect("/admin/lapak?err=" + encodeURIComponent("Produk tidak ditemukan."));
  }

  // Ownership: bila hanya manage_own, produk harus milik usaha user login.
  const userId = (await auth())?.user?.id ?? null;
  if (!allowedAll) {
    if (!userId || existing.ownerUserId !== userId) {
      redirect(
        "/admin/lapak?err=" +
          encodeURIComponent("Akses ditolak: Anda hanya bisa mengubah produk usaha sendiri."),
      );
    }
  }

  // ENFORCE maksimal 3 produk AKTIF per partner — hanya saat MENGAKTIFKAN
  // produk yang sebelumnya non-aktif.
  if (data.status === "active" && existing.status !== "active") {
    const activeRows = await db
      .select({ total: count(schema.products.id) })
      .from(schema.products)
      .where(
        and(
          eq(schema.products.businessPartnerId, existing.businessPartnerId),
          eq(schema.products.status, "active"),
          isNull(schema.products.deletedAt),
        ),
      );
    const activeCount = Number(activeRows[0]?.total ?? 0);
    if (activeCount >= MAX_ACTIVE_PRODUCTS) {
      redirect(
        "/admin/lapak?err=" +
          encodeURIComponent(
            `Batas tercapai: maksimal ${MAX_ACTIVE_PRODUCTS} produk aktif per partner usaha.`,
          ),
      );
    }
  }

  // Upload poster baru bila ada; jika tidak, pertahankan yang lama.
  const newPoster = await uploadToBlob(
    formData.get("posterFile") as File | null,
    "lapak/poster",
  );
  const posterImage = newPoster ?? existing.posterImage;

  await db
    .update(schema.products)
    .set({
      title: data.title,
      posterImage,
      description: data.description ?? null,
      price: String(data.price),
      contactLink: data.contactLink,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.products.id, data.id), isNull(schema.products.deletedAt)));

  revalidatePath("/admin/lapak");
  revalidatePath("/lapak");
  redirect("/admin/lapak?ok=" + encodeURIComponent("Tersimpan."));
}

const deleteSchema = z.object({
  id: z.string().uuid("ID produk tidak valid."),
});

/** Soft delete produk lapak (set deletedAt + deletedBy). */
export async function softDeleteProduct(formData: FormData): Promise<void> {
  // RBAC: pengelola penuh (lapak.manage) atau pemilik (lapak.manage_own).
  const allowedAll = await can("lapak.manage");
  if (!allowedAll) await requirePermission("lapak.manage_own");

  const parsed = deleteSchema.safeParse({ id: opt(formData.get("id")) });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/lapak?err=" + encodeURIComponent(msg));
  }

  const userId = (await auth())?.user?.id ?? null;

  // Ownership: bila hanya manage_own, produk harus milik usaha user.
  if (!allowedAll) {
    const rows = await db
      .select({ ownerUserId: schema.businessPartners.ownerUserId })
      .from(schema.products)
      .innerJoin(
        schema.businessPartners,
        eq(schema.businessPartners.id, schema.products.businessPartnerId),
      )
      .where(and(eq(schema.products.id, parsed.data.id), isNull(schema.products.deletedAt)))
      .limit(1);
    if (!rows[0] || !userId || rows[0].ownerUserId !== userId) {
      redirect(
        "/admin/lapak?err=" +
          encodeURIComponent("Akses ditolak: Anda hanya bisa menghapus produk usaha sendiri."),
      );
    }
  }

  await db
    .update(schema.products)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(and(eq(schema.products.id, parsed.data.id), isNull(schema.products.deletedAt)));

  revalidatePath("/admin/lapak");
  revalidatePath("/lapak");
  redirect("/admin/lapak?ok=" + encodeURIComponent("Dihapus."));
}
