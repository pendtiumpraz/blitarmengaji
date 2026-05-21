"use server";

import { z } from "zod";
import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

/**
 * Server action untuk Verifikasi Pembayaran (admin).
 * Pola: cek RBAC (donation.manage; super '*' otomatis lolos) → validasi Zod
 * → tulis DB → revalidatePath. Lihat AGENTS.md §0 & §4.
 */

/** Ambil id user yang sedang login (untuk confirmedBy). */
async function currentUserId(): Promise<string> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
  return uid;
}

const idSchema = z.object({
  id: z.string().uuid("Konfirmasi pembayaran tidak valid"),
});

/**
 * Verifikasi pembayaran: set status 'confirmed' + confirmedBy/confirmedAt.
 * Bila kind = 'donation', tambahkan amount ke donation_campaigns.collectedAmount (refId).
 */
export async function verifyPayment(formData: FormData): Promise<void> {
  await requirePermission("donation.manage");
  const userId = await currentUserId();

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Konfirmasi pembayaran tidak valid.");
  }

  // Ambil konfirmasi yang masih pending & belum di-soft-delete.
  const rows = await db
    .select({
      id: schema.paymentConfirmations.id,
      kind: schema.paymentConfirmations.kind,
      refId: schema.paymentConfirmations.refId,
      amount: schema.paymentConfirmations.amount,
    })
    .from(schema.paymentConfirmations)
    .where(
      and(
        eq(schema.paymentConfirmations.id, parsed.data.id),
        eq(schema.paymentConfirmations.status, "pending"),
        isNull(schema.paymentConfirmations.deletedAt),
      ),
    )
    .limit(1);

  const conf = rows[0];
  if (!conf) throw new Error("Konfirmasi pembayaran tidak ditemukan atau sudah diproses.");

  const now = new Date();

  await db
    .update(schema.paymentConfirmations)
    .set({ status: "confirmed", confirmedBy: userId, confirmedAt: now, updatedAt: now })
    .where(eq(schema.paymentConfirmations.id, conf.id));

  // Donasi: akumulasi nominal ke progress kampanye (atomik via SQL).
  if (conf.kind === "donation" && conf.amount) {
    await db
      .update(schema.donationCampaigns)
      .set({
        collectedAmount: sql`${schema.donationCampaigns.collectedAmount} + ${conf.amount}`,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.donationCampaigns.id, conf.refId),
          isNull(schema.donationCampaigns.deletedAt),
        ),
      );
  }

  await logAudit({
    action: "payment_verify",
    entity: "paymentConfirmations",
    entityId: conf.id,
    meta: { kind: conf.kind, amount: conf.amount },
  });

  revalidatePath("/admin/pembayaran");
  revalidatePath("/donasi");
}

/** Tolak pembayaran: set status 'rejected' + confirmedBy/confirmedAt. */
export async function rejectPayment(formData: FormData): Promise<void> {
  await requirePermission("donation.manage");
  const userId = await currentUserId();

  const parsed = idSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Konfirmasi pembayaran tidak valid.");
  }

  // Pastikan masih pending & belum dihapus sebelum menolak.
  const rows = await db
    .select({ id: schema.paymentConfirmations.id })
    .from(schema.paymentConfirmations)
    .where(
      and(
        eq(schema.paymentConfirmations.id, parsed.data.id),
        eq(schema.paymentConfirmations.status, "pending"),
        isNull(schema.paymentConfirmations.deletedAt),
      ),
    )
    .limit(1);

  if (!rows[0]) throw new Error("Konfirmasi pembayaran tidak ditemukan atau sudah diproses.");

  const now = new Date();

  await db
    .update(schema.paymentConfirmations)
    .set({ status: "rejected", confirmedBy: userId, confirmedAt: now, updatedAt: now })
    .where(eq(schema.paymentConfirmations.id, parsed.data.id));

  await logAudit({
    action: "payment_reject",
    entity: "paymentConfirmations",
    entityId: parsed.data.id,
  });

  revalidatePath("/admin/pembayaran");
}
