import { getSummary, listTransactions } from "@/lib/queries/keuangan";
import { renderKeuanganPdf } from "@/lib/pdf/keuangan";

// @react-pdf/renderer butuh runtime Node.js (bukan Edge).
export const runtime = "nodejs";
// Selalu segar dari Neon — jangan di-cache statik.
export const dynamic = "force-dynamic";

/**
 * GET /api/laporan/keuangan
 * Transparansi publik → tanpa auth. Ambil ringkasan + seluruh transaksi aktif,
 * render menjadi PDF, lalu tampilkan inline di tab baru.
 */
export async function GET() {
  const [summary, transactions] = await Promise.all([getSummary(), listTransactions()]);

  const pdf = await renderKeuanganPdf({ summary, transactions, generatedAt: new Date() });

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="laporan-keuangan.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
