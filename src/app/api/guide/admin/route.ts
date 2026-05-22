import { renderAdminGuidePdf } from "@/lib/pdf/admin-guide";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  if (!(await can("dashboard.view")) && !(await can("*"))) {
    return new Response("Forbidden", { status: 403 });
  }
  const pdf = await renderAdminGuidePdf();
  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="panduan-admin-blitar-mengaji.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
