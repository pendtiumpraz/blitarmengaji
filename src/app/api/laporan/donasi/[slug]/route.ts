import { getCampaignBySlug, listUpdates } from "@/lib/queries/donasi";
import { renderDonasiPdf } from "@/lib/pdf/donasi";

// @react-pdf/renderer butuh runtime Node.js (bukan edge).
export const runtime = "nodejs";

/**
 * GET /api/laporan/donasi/[slug]
 * Endpoint PUBLIK (transparansi) — tidak perlu auth.
 * Menghasilkan PDF "Laporan Penggunaan Dana Donasi" untuk satu campaign.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const campaign = await getCampaignBySlug(slug);
  if (!campaign) {
    return new Response("Campaign tidak ditemukan.", { status: 404 });
  }

  const updates = await listUpdates(campaign.id);
  const pdf = await renderDonasiPdf({ campaign, updates });

  // Uint8Array adalah BodyInit yang sah saat runtime (cast untuk lolos TS).
  return new Response(pdf as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="laporan-donasi-${slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
