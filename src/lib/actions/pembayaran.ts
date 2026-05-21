"use server";

import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { uploadToBlob } from "@/lib/blob";

/**
 * Server action konfirmasi pembayaran sisi DONATUR (publik).
 * Pola: validasi Zod → upload bukti ke Vercel Blob → insert payment_confirmations
 * (status 'pending') → revalidatePath + redirect. Lihat AGENTS.md §0 & §4.
 *
 * TIDAK wajib login: donatur boleh tamu. Bila login & tidak anonim, nama bisa
 * diambil dari sesi user. Bila anonim, nama tidak disimpan (tampil "Hamba Allah").
 */

/** Normalisasi nilai numerik Rupiah dari input ("50.000" / "Rp 50.000" → number). */
const rupiahToNumber = z
  .union([z.string(), z.number()])
  .transform((v) => {
    const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : 0;
  })
  .refine((n) => n > 0, "Nominal donasi harus lebih dari 0.");

const optionalText = z
  .string()
  .trim()
  .transform((v): string | null => (v === "" ? null : v));

const confirmSchema = z.object({
  refId: z.string().uuid("Campaign tidak valid."),
  payerName: z.string().trim().max(255).optional(),
  isAnonymous: z.boolean(),
  amount: rupiahToNumber,
  note: optionalText,
});

/**
 * Donatur mengonfirmasi bahwa transfer/donasi telah dilakukan.
 * refId = donation campaign id (kind: 'donation'). Bukti transfer (opsional)
 * di-upload ke Blob → proofUrl. Status awal selalu 'pending' (menunggu verifikasi).
 */
export async function createDonationConfirmation(formData: FormData): Promise<void> {
  const session = await auth();
  const sessionName = session?.user?.name?.trim();

  const parsed = confirmSchema.safeParse({
    refId: String(formData.get("refId") ?? ""),
    payerName: String(formData.get("payerName") ?? ""),
    isAnonymous: String(formData.get("isAnonymous") ?? "") === "on",
    amount: formData.get("amount") ?? "0",
    note: String(formData.get("note") ?? ""),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data konfirmasi tidak valid.");
  }
  const data = parsed.data;

  // Pastikan campaign ada & belum di-soft-delete (ambil slug untuk redirect/revalidate).
  const campaignRows = await db
    .select({ slug: schema.donationCampaigns.slug })
    .from(schema.donationCampaigns)
    .where(and(eq(schema.donationCampaigns.id, data.refId), isNull(schema.donationCampaigns.deletedAt)))
    .limit(1);

  const campaign = campaignRows[0];
  if (!campaign) throw new Error("Campaign tidak ditemukan atau sudah ditutup.");

  // Tentukan nama penyetor: anonim → null (tampil "Hamba Allah"); selain itu
  // pakai input, jatuh ke nama sesi bila login & input kosong.
  let payerName: string | null = null;
  if (!data.isAnonymous) {
    payerName = data.payerName?.trim() || sessionName || null;
  }

  // Upload bukti transfer NYATA ke Vercel Blob (opsional).
  const proofUrl = await uploadToBlob(
    formData.get("proofFile") as File | null,
    "donasi/bukti",
  );

  await db.insert(schema.paymentConfirmations).values({
    kind: "donation",
    refId: data.refId,
    payerName,
    isAnonymous: data.isAnonymous,
    amount: String(data.amount),
    note: data.note,
    proofUrl,
    status: "pending",
  });

  revalidatePath(`/donasi/${campaign.slug}`);
  redirect(`/donasi/${campaign.slug}?konfirmasi=ok`);
}
