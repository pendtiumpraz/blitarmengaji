import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listKajian } from "@/lib/queries/kajian";
import { softDeleteKajian } from "@/lib/actions/kajian";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  offline: "Offline",
  online: "Online",
  hybrid: "Hybrid",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Published",
  draft: "Draft",
};

const columns: Column[] = [
  { key: "title", label: "Judul", sortable: true },
  { key: "ustadzName", label: "Ustadz", sortable: true },
  { key: "titikName", label: "Titik / Lokasi", sortable: true },
  { key: "categoryName", label: "Kategori", sortable: true },
  { key: "type", label: "Tipe", type: "badge", sortable: true, filter: true },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
];

export default async function AdminKajianPage() {
  const all = await listKajian();
  const rows = all.map((k) => ({
    id: k.id,
    title: k.title,
    ustadzName: k.ustadzName ?? "—",
    titikName: k.titikName ?? "—",
    categoryName: k.categoryName ?? "—",
    type: TYPE_LABEL[k.type] ?? k.type,
    status: STATUS_LABEL[k.status] ?? k.status,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Kajian & Jadwal"
        subtitle="Kelola daftar kajian beserta ustadz, titik dakwah, dan jadwalnya di Blitar Raya."
        action={
          <Button href="/admin/kajian/baru">
            <Plus className="h-4 w-4" /> Tambah Kajian
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={rows}
        editBase="/admin/kajian"
        deleteAction={softDeleteKajian}
        deleteConfirmText="Kajian akan dipindah ke Recycle Bin (bisa dipulihkan)."
        emptyText="Belum ada kajian."
      />
    </div>
  );
}
