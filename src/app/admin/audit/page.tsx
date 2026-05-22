import { ScrollText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listAuditLogs } from "@/lib/queries/audit";

/**
 * Viewer AUDIT LOG (admin). Guard akses sudah ditangani admin layout
 * (super admin '*' atau dashboard.view). Permission 'audit.view' bersifat
 * opsional dan dipakai untuk menampilkan menu di sidebar — super admin '*'
 * tetap bisa melihat halaman ini meski permission belum di-seed.
 *
 * UX: tabel pakai <DataTable> (search/sort/filter + pagination client-side).
 */

export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "createdAt", label: "Waktu", type: "datetime", sortable: true, className: "whitespace-nowrap" },
  { key: "actorName", label: "Pelaku", sortable: true, filter: true },
  { key: "action", label: "Aksi", type: "badge", sortable: true, filter: true },
  { key: "entity", label: "Entitas", sortable: true, filter: true },
  { key: "entityId", label: "ID Entitas", type: "code" },
];

export default async function AdminAuditPage() {
  // DataTable melakukan paginasi/sort/filter di client → ambil himpunan terbaru.
  const logs = await listAuditLogs(1, 500);

  const rows = logs.map((r) => ({
    id: r.id,
    createdAt: r.createdAt,
    actorName: r.actorName ?? "Sistem",
    action: r.action,
    entity: r.entity ?? "—",
    entityId: r.entityId ?? "—",
  }));

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
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="Belum ada catatan audit."
        />
      )}
    </div>
  );
}
