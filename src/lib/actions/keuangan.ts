"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";
import { financeCategories, financeTransactions } from "../../../db/schema";

/**
 * Server action KEUANGAN.
 * - createTransaction: butuh permission `finance.create`.
 * - updateTransaction: butuh permission `finance.update`.
 * - createFinanceCategory: butuh permission `finance.update`.
 * - softDeleteTransaction: butuh permission `finance.delete` (soft delete, bukan hapus fisik).
 */

const createSchema = z.object({
  scope: z.string().trim(), // "" = global; selain itu = titik_dakwah.id (uuid)
  categoryId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  description: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined)),
  trxDate: z.string().trim().min(1, "Tanggal wajib diisi"),
});

export async function createTransaction(formData: FormData): Promise<void> {
  await requirePermission("finance.create");

  // Normalisasi: input jumlah boleh pakai pemisah ribuan (mis. "2.450.000").
  const rawAmount = String(formData.get("amount") ?? "").replace(/[^\d]/g, "");

  const parsed = createSchema.safeParse({
    scope: formData.get("scope") ?? "",
    categoryId: formData.get("categoryId") ?? undefined,
    type: formData.get("type") ?? "",
    amount: rawAmount,
    description: formData.get("description") ?? undefined,
    trxDate: formData.get("trxDate") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data transaksi tidak valid.");
  }

  const data = parsed.data;
  const session = await auth();

  // Bukti transaksi (opsional) → Vercel Blob.
  const proof = await uploadToBlob(formData.get("proofFile") as File | null, "keuangan/bukti");

  await db.insert(financeTransactions).values({
    titikDakwahId: data.scope === "" ? null : data.scope,
    categoryId: data.categoryId ?? null,
    type: data.type,
    amount: data.amount.toFixed(2),
    description: data.description ?? null,
    trxDate: new Date(data.trxDate),
    proofUrl: proof,
    createdBy: session?.user?.id ?? null,
  });

  revalidatePath("/admin/keuangan");
  revalidatePath("/keuangan");
}

const updateSchema = createSchema.extend({
  id: z.string().uuid("ID transaksi tidak valid."),
});

export async function updateTransaction(formData: FormData): Promise<void> {
  await requirePermission("finance.update");

  // Normalisasi: input jumlah boleh pakai pemisah ribuan (mis. "2.450.000").
  const rawAmount = String(formData.get("amount") ?? "").replace(/[^\d]/g, "");

  const parsed = updateSchema.safeParse({
    id: formData.get("id") ?? "",
    scope: formData.get("scope") ?? "",
    categoryId: formData.get("categoryId") ?? undefined,
    type: formData.get("type") ?? "",
    amount: rawAmount,
    description: formData.get("description") ?? undefined,
    trxDate: formData.get("trxDate") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data transaksi tidak valid.");
  }

  const data = parsed.data;

  // Bukti baru (opsional) → Vercel Blob. null = tidak ada unggahan ⇒ pertahankan bukti lama.
  const newProof = await uploadToBlob(formData.get("proofFile") as File | null, "keuangan/bukti");

  await db
    .update(financeTransactions)
    .set({
      titikDakwahId: data.scope === "" ? null : data.scope,
      categoryId: data.categoryId ?? null,
      type: data.type,
      amount: data.amount.toFixed(2),
      description: data.description ?? null,
      trxDate: new Date(data.trxDate),
      // null dari uploadToBlob = tidak ada unggahan baru ⇒ jangan timpa kolom lama.
      ...(newProof ? { proofUrl: newProof } : {}),
      updatedAt: new Date(),
    })
    .where(
      and(eq(financeTransactions.id, data.id), isNull(financeTransactions.deletedAt)),
    );

  revalidatePath("/admin/keuangan");
  revalidatePath("/keuangan");
  redirect("/admin/keuangan");
}

const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi"),
  type: z.enum(["income", "expense"]),
});

export async function createFinanceCategory(formData: FormData): Promise<void> {
  await requirePermission("finance.update");

  const parsed = categorySchema.safeParse({
    name: formData.get("name") ?? "",
    type: formData.get("type") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data kategori tidak valid.");
  }

  await db.insert(financeCategories).values({
    name: parsed.data.name,
    type: parsed.data.type,
  });

  revalidatePath("/admin/keuangan");
  revalidatePath("/keuangan");
}

const deleteSchema = z.object({ id: z.string().uuid("ID transaksi tidak valid.") });

export async function softDeleteTransaction(formData: FormData): Promise<void> {
  await requirePermission("finance.delete");

  const parsed = deleteSchema.safeParse({ id: formData.get("id") ?? "" });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "ID transaksi tidak valid.");
  }

  const session = await auth();

  await db
    .update(financeTransactions)
    .set({ deletedAt: new Date(), deletedBy: session?.user?.id ?? null })
    .where(
      and(
        eq(financeTransactions.id, parsed.data.id),
        isNull(financeTransactions.deletedAt),
      ),
    );

  revalidatePath("/admin/keuangan");
  revalidatePath("/keuangan");
}
