import { ScrollText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { listAuditLogs, countAuditLogs } from "@/lib/queries/audit";

/**
 * Viewer AUDIT LOG (admin). Guard akses sudah ditangani admin layout
 * (super admin '*' atau dashboard.view). Permission 'audit.view' bersifat
 * opsional dan dipakai untuk menampilkan menu di sidebar — super admin '*'
 * tetap bisa melihat halaman ini meski permission belum di-seed.
 */

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const waktuFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [rows, total] = await Promise.all([
    listAuditLogs(page, PAGE_SIZE),
    countAuditLogs(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Audit Log"
        subtitle="Catatan aksi sensitif di platform: pemulihan & hapus permanen data, verifikasi pembayaran, dan lainnya. Tersusun dari yang terbaru."
      />

      {rows.length === 0 ? (
        <Card className="grid place-items-center px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <ScrollText className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Belum ada catatan audit</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Aksi sensitif yang dilakukan admin akan tercatat di sini secara otomatis.
          </p>
        </Card>
      ) : (
        <>
          <Table className="min-w-[640px]">
            <THead>
              <TR>
                <TH>Waktu</TH>
                <TH>Pelaku</TH>
                <TH>Aksi</TH>
                <TH>Entitas</TH>
                <TH>ID Entitas</TH>
              </TR>
            </THead>
            <tbody>
              {rows.map((r) => (
                <TR key={r.id} className="hover:bg-brand-50/50">
                  <TD className="whitespace-nowrap text-muted">{waktuFmt.format(r.createdAt)}</TD>
                  <TD className="text-ink">
                    {r.actorName ? (
                      <span className="font-bold">{r.actorName}</span>
                    ) : (
                      <span className="text-muted">Sistem</span>
                    )}
                  </TD>
                  <TD>
                    <Badge tone="muted">{r.action}</Badge>
                  </TD>
                  <TD className="text-ink">{r.entity ?? <span className="text-muted">—</span>}</TD>
                  <TD className="font-mono text-[11px] text-muted">
                    {r.entityId ?? "—"}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseHref="/admin/audit" />
        </>
      )}
    </div>
  );
}
