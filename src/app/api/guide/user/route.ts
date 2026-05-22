import { renderUserGuidePdf } from "@/lib/pdf/user-guide";

// @react-pdf/renderer butuh runtime Node.js (bukan Edge).
export const runtime = "nodejs";

/**
 * GET /api/guide/user
 * Panduan pengguna publik → tanpa auth. Render PDF lalu tampilkan inline
 * di tab baru dengan nama berkas "panduan-pengguna-blitar-mengaji.pdf".
 */
export async function GET() {
  const pdf = await renderUserGuidePdf();

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'inline; filename="panduan-pengguna-blitar-mengaji.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
