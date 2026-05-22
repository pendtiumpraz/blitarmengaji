import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { renderAkunTitikPdf, type TitikRow } from "@/lib/pdf/akun-titik";

// @react-pdf/renderer butuh runtime Node.js (bukan Edge).
export const runtime = "nodejs";
// Selalu segar — jangan di-cache statik.
export const dynamic = "force-dynamic";

/**
 * GET /api/guide/akun-titik
 * Hanya untuk pengelola akun (permission 'user.manage' atau super admin '*').
 * Membaca data/sample-credentials.json lalu render PDF Daftar Akun Pengelola Titik inline.
 */
export async function GET() {
  // GUARD: harus login.
  const s = await auth();
  if (!s) {
    return Response.json({ error: "Tidak terautentikasi." }, { status: 401 });
  }
  // GUARD: harus punya izin kelola user atau super admin.
  if (!(await can("user.manage")) && !(await can("*"))) {
    return Response.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const file = path.join(process.cwd(), "data", "sample-credentials.json");
  if (!existsSync(file)) {
    return Response.json(
      { error: "Data kredensial belum tersedia. Jalankan: npm run db:seed:sample" },
      { status: 404 },
    );
  }

  const parsed = JSON.parse(readFileSync(file, "utf8")) as { titik?: TitikRow[] };
  const rows = Array.isArray(parsed.titik) ? parsed.titik : [];

  const pdf = await renderAkunTitikPdf(rows);

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="daftar-akun-titik.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
