import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listTitik } from "@/lib/queries/titik";
import { softDeleteTitik, toggleTitikActive } from "@/lib/actions/titik";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Terverifikasi",
  pending: "Menunggu",
  rejected: "Ditolak",
};

const columns: Column[] = [
  { key: "name", label: "Nama", sortable: true },
  { key: "kecamatan", label: "Kecamatan", sortable: true, filter: true },
  { key: "ownerName", label: "Pengelola" },
  { key: "status", label: "Verifikasi", type: "badge", sortable: true, filter: true },
  { key: "aktif", label: "Aktif", type: "badge", sortable: true, filter: true },
];

export default async function AdminTitikList() {
  const all = await listTitik();
  const rows = all.map((t) => ({
    id: t.id,
    name: t.name,
    kecamatan: t.kecamatan ?? "—",
    ownerName: t.ownerName ?? "—",
    status: STATUS_LABEL[t.status] ?? t.status,
    aktif: t.isActive ? "Aktif" : "Nonaktif",
  }));

  return (
    <div>
      <AdminPageHeader
        title="Titik Dakwah"
        subtitle="Kelola masjid, mushola, dan majelis taklim di Blitar Raya."
        action={
          <Button href="/admin/titik/baru" size="sm">
            + Tambah Titik
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        editBase="/admin/titik"
        deleteAction={softDeleteTitik}
        deleteConfirmText="Titik akan dipindah ke Recycle Bin (bisa dipulihkan)."
        rowActions={[
          {
            action: toggleTitikActive,
            label: "Aktif/Nonaktif",
            idField: "id",
            confirm: true,
            confirmTitle: "Ubah status aktif titik?",
            confirmText: "Titik nonaktif hilang dari peta & dropdown lokasi (tidak terhapus).",
            danger: false,
          },
        ]}
        emptyText="Belum ada titik dakwah."
      />
    </div>
  );
}
