"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";
import { financeTransactions, titikDakwah } from "../../../db/schema";

/**
 * Server actions (MUTATION) untuk KELOLA KEUANGAN per-titik (route /kelola/keuangan).
 * Pola: WAJIB login → cek ownership titik (manage_own) → validasi Zod → tulis DB.
 * Soft delete via deletedAt/deletedBy (JANGAN DELETE fisik — lihat AGENTS.md §4).
 *
 * Otorisasi:
 *  - Super admin ('*') boleh kelola kas titik manapun.
 *  - Selain itu, titik tujuan WAJIB milik user (titik_dakwah.owner_user_id).
 */

/** Pastikan titik (id) milik user login & aktif. Lempar error bila bukan. */
async function assertOwnsTitik(titikDakwahId: string, userId: string): Promise<void> {
  // Super admin lolos cek ownership.
  if (await can("*")) return;

  const rows = await db
    .select({ ownerUserId: titikDakwah.ownerUserId })
    .from(titikDakwah)
    .where(and(eq(titikDakwah.id, titikDakwahId), isNull(titikDakwah.deletedAt)))
    .limit(1);

  if (!rows[0] || rows[0].ownerUserId !== userId) {
    throw new Error("Akses ditolak: Anda hanya bisa mengelola kas titik milik sendiri.");
  }
}

const createSchema = z.object({
  titikDakwahId: z.string().uuid("Titik dakwah wajib dipilih."),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0."),
  categoryId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  trxDate: z.string().trim().min(1, "Tanggal wajib diisi."),
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
});

/**
 * Catat transaksi kas untuk titik milik user. Bukti (opsional) → Vercel Blob.
 * createdBy = user login. titikDakwahId WAJIB & harus milik user.
 */
export async function createOwnTransaction(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Sesi tidak valid. Silakan masuk kembali.");

  // Normalisasi: input jumlah boleh pakai pemisah ribuan (mis. "2.450.000").
  const rawAmount = String(formData.get("amount") ?? "").replace(/[^\d]/g, "");

  const parsed = createSchema.safeParse({
    titikDakwahId: formData.get("titikDakwahId") ?? "",
    type: formData.get("type") ?? "",
    amount: rawAmount,
    categoryId: formData.get("categoryId") ?? undefined,
    trxDate: formData.get("trxDate") ?? "",
    description: formData.get("description") ?? undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data transaksi tidak valid.");
  }
  const data = parsed.data;

  // Ownership: titik tujuan harus milik user (super admin lolos).
  await assertOwnsTitik(data.titikDakwahId, userId);

  // Bukti transaksi (opsional) → Vercel Blob.
  const proof = await uploadToBlob(formData.get("proofFile") as File | null, "keuangan/bukti");

  await db.insert(financeTransactions).values({
    titikDakwahId: data.titikDakwahId,
    categoryId: data.categoryId ?? null,
    type: data.type,
    amount: data.amount.toFixed(2),
    description: data.description ?? null,
    trxDate: new Date(data.trxDate),
    proofUrl: proof,
    createdBy: userId,
  });

  revalidatePath("/kelola/keuangan");
}

const deleteSchema = z.object({
  id: z.string().uuid("ID transaksi tidak valid."),
});

/**
 * Soft delete transaksi kas (set deletedAt + deletedBy). Cek ownership:
 * transaksi harus terikat ke titik milik user (super admin lolos).
 */
export async function softDeleteOwnTransaction(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Sesi tidak valid. Silakan masuk kembali.");

  const parsed = deleteSchema.safeParse({ id: formData.get("id") ?? "" });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "ID transaksi tidak valid.");
  }

  // Ownership: transaksi harus pada titik milik user (super admin lolos).
  if (!(await can("*"))) {
    const rows = await db
      .select({ ownerUserId: titikDakwah.ownerUserId })
      .from(financeTransactions)
      .leftJoin(titikDakwah, eq(financeTransactions.titikDakwahId, titikDakwah.id))
      .where(and(eq(financeTransactions.id, parsed.data.id), isNull(financeTransactions.deletedAt)))
      .limit(1);

    if (!rows[0] || rows[0].ownerUserId !== userId) {
      throw new Error("Akses ditolak: Anda hanya bisa menghapus kas titik milik sendiri.");
    }
  }

  await db
    .update(financeTransactions)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(and(eq(financeTransactions.id, parsed.data.id), isNull(financeTransactions.deletedAt)));

  revalidatePath("/kelola/keuangan");
}
