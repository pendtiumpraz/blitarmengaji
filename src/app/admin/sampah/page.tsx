import { Trash } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listSampah, countSampah } from "@/lib/queries/sampah";
import { restoreItem, hardDeleteItem } from "@/lib/actions/sampah";

export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "typeLabel", label: "Jenis", sortable: true, filter: true },
  { key: "label", label: "Label", sortable: true },
  { key: "deletedAt", label: "Dihapus pada", type: "datetime", sortable: true },
];

export default async function AdminSampahPage() {
  const sections = await listSampah();
  const total = countSampah(sections);

  // Gabungkan semua section jadi satu daftar baris. Tiap baris WAJIB punya
  // `id` & `type` (dikirim ulang sebagai hidden input lewat RowAction.fields).
  const rows = sections.flatMap((section) =>
    section.items.map((item) => ({
      id: item.id,
      type: item.type,
      typeLabel: section.title,
      label: item.label,
      deletedAt: item.deletedAt,
    })),
  );

  return (
    <div>
      <AdminPageHeader
        title="Recycle Bin"
        subtitle="Data yang sudah dihapus tersimpan di sini. Pulihkan agar aktif kembali, atau hapus permanen untuk membersihkan."
      />

      {total === 0 ? (
        <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Trash className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Recycle bin kosong</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Belum ada data yang dihapus. Item yang dihapus dari modul lain akan muncul di sini dan masih bisa dipulihkan.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowActions={[
            { action: restoreItem, label: "Pulihkan", idField: "id", fields: ["type"] },
            {
              action: hardDeleteItem,
              label: "Hapus permanen",
              idField: "id",
              fields: ["type"],
              confirm: true,
              danger: true,
              confirmTitle: "Hapus permanen?",
              confirmText: "Permanen & tidak bisa dipulihkan.",
            },
          ]}
          emptyText="Recycle bin kosong."
        />
      )}
    </div>
  );
}
