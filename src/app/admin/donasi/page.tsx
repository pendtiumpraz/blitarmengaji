import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listCampaigns } from "@/lib/queries/donasi";
import { softDeleteCampaign } from "@/lib/actions/donasi";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  completed: "Selesai",
  closed: "Ditutup",
};

const columns: Column[] = [
  { key: "title", label: "Judul", sortable: true },
  { key: "titikName", label: "Titik Dakwah", sortable: true, filter: true },
  { key: "target", label: "Target", type: "money", sortable: true },
  { key: "collected", label: "Terkumpul", type: "money", sortable: true },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
];

export default async function AdminDonasiPage() {
  const all = await listCampaigns();
  const rows = all.map((c) => ({
    id: c.id,
    title: c.title,
    titikName: c.titikName ?? "—",
    target: Number(c.targetAmount ?? 0),
    collected: Number(c.collectedAmount ?? 0),
    status: STATUS_LABEL[c.status] ?? c.status,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Donasi"
        subtitle="Kelola campaign donasi per titik dakwah secara transparan untuk jamaah Blitar Raya."
        action={
          <Button href="/admin/donasi/baru" size="sm">
            + Tambah Campaign
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        editBase="/admin/donasi"
        deleteAction={softDeleteCampaign}
        deleteConfirmText="Campaign akan dipindah ke Recycle Bin (bisa dipulihkan)."
        emptyText="Belum ada campaign donasi."
      />
    </div>
  );
}
