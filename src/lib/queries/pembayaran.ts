import { db, schema } from "@/lib/db";
import { and, eq, desc, isNull, inArray } from "drizzle-orm";

/**
 * Query READ untuk domain Verifikasi Pembayaran (admin).
 * Sumber: tabel payment_confirmations (+ join donation_campaigns utk judul kampanye).
 * Selalu filter `isNull(deletedAt)` (soft delete — lihat AGENTS.md §4).
 */

export type PaymentConfirmationItem = {
  id: string;
  kind: "donation" | "order";
  refId: string;
  payerName: string | null;
  isAnonymous: boolean;
  amount: string | null;
  note: string | null;
  proofUrl: string | null;
  status: "pending" | "confirmed" | "rejected";
  confirmedAt: Date | null;
  createdAt: Date;
  /** Judul kampanye donasi (hanya terisi bila kind = donation & ref valid). */
  campaignTitle: string | null;
};

/** Daftar konfirmasi pembayaran berstatus pending (terbaru dulu).
 *  Untuk kind = donation, judul kampanye diisi via join donation_campaigns. */
export async function listPendingConfirmations(): Promise<PaymentConfirmationItem[]> {
  const rows = await db
    .select({
      id: schema.paymentConfirmations.id,
      kind: schema.paymentConfirmations.kind,
      refId: schema.paymentConfirmations.refId,
      payerName: schema.paymentConfirmations.payerName,
      isAnonymous: schema.paymentConfirmations.isAnonymous,
      amount: schema.paymentConfirmations.amount,
      note: schema.paymentConfirmations.note,
      proofUrl: schema.paymentConfirmations.proofUrl,
      status: schema.paymentConfirmations.status,
      confirmedAt: schema.paymentConfirmations.confirmedAt,
      createdAt: schema.paymentConfirmations.createdAt,
      campaignTitle: schema.donationCampaigns.title,
    })
    .from(schema.paymentConfirmations)
    // Join hanya nyambung saat kind = donation & refId menunjuk kampanye yang ada.
    .leftJoin(
      schema.donationCampaigns,
      and(
        eq(schema.paymentConfirmations.kind, "donation"),
        eq(schema.donationCampaigns.id, schema.paymentConfirmations.refId),
      ),
    )
    .where(
      and(
        eq(schema.paymentConfirmations.status, "pending"),
        isNull(schema.paymentConfirmations.deletedAt),
      ),
    )
    .orderBy(desc(schema.paymentConfirmations.createdAt));

  return rows;
}

/** Riwayat konfirmasi yang sudah diproses (confirmed/rejected), terbaru dulu. */
export async function listConfirmationHistory(limit = 20): Promise<PaymentConfirmationItem[]> {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20;

  const rows = await db
    .select({
      id: schema.paymentConfirmations.id,
      kind: schema.paymentConfirmations.kind,
      refId: schema.paymentConfirmations.refId,
      payerName: schema.paymentConfirmations.payerName,
      isAnonymous: schema.paymentConfirmations.isAnonymous,
      amount: schema.paymentConfirmations.amount,
      note: schema.paymentConfirmations.note,
      proofUrl: schema.paymentConfirmations.proofUrl,
      status: schema.paymentConfirmations.status,
      confirmedAt: schema.paymentConfirmations.confirmedAt,
      createdAt: schema.paymentConfirmations.createdAt,
      campaignTitle: schema.donationCampaigns.title,
    })
    .from(schema.paymentConfirmations)
    .leftJoin(
      schema.donationCampaigns,
      and(
        eq(schema.paymentConfirmations.kind, "donation"),
        eq(schema.donationCampaigns.id, schema.paymentConfirmations.refId),
      ),
    )
    .where(
      and(
        inArray(schema.paymentConfirmations.status, ["confirmed", "rejected"]),
        isNull(schema.paymentConfirmations.deletedAt),
      ),
    )
    .orderBy(desc(schema.paymentConfirmations.confirmedAt), desc(schema.paymentConfirmations.createdAt))
    .limit(safeLimit);

  return rows;
}
