import { renderPartnerGuidePdf } from "@/lib/pdf/partner-guide";

// @react-pdf/renderer butuh runtime Node.js (bukan Edge).
export const runtime = "nodejs";

/**
 * GET /api/guide/partner
 * Panduan publik (tanpa auth) → render PDF "Panduan Partner Usaha Blitar Mengaji"
 * lalu tampilkan inline di tab baru.
 */
export async function GET() {
  const pdf = await renderPartnerGuidePdf();

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="panduan-partner-blitar-mengaji.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
