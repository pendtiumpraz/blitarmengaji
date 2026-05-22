import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { renderAkunTitikPdf } from "@/lib/pdf/akun-titik";
import { loadSampleCredentials } from "@/lib/sample-credentials";

// @react-pdf/renderer butuh runtime Node.js (bukan Edge).
export const runtime = "nodejs";
// Selalu segar — jangan di-cache statik.
export const dynamic = "force-dynamic";

/**
 * GET /api/guide/akun-titik
 * Hanya untuk pengelola akun (permission 'user.manage' atau super admin '*').
 * Kredensial: file lokal saat dev → DB terenkripsi saat produksi.
 */
export async function GET() {
  const s = await auth();
  if (!s) return Response.json({ error: "Tidak terautentikasi." }, { status: 401 });
  if (!(await can("user.manage")) && !(await can("*"))) {
    return Response.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const creds = await loadSampleCredentials();
  if (!creds) {
    return Response.json(
      { error: "Data kredensial belum tersedia. Jalankan: npm run db:seed:sample" },
      { status: 404 },
    );
  }

  const pdf = await renderAkunTitikPdf(Array.isArray(creds.titik) ? creds.titik : []);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="daftar-akun-titik.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
