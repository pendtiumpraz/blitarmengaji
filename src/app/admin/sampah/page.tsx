import { RotateCcw, Trash2, Trash } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { listSampah, countSampah } from "@/lib/queries/sampah";
import { restoreItem, hardDeleteItem } from "@/lib/actions/sampah";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDeletedAt(d: Date): string {
  try {
    return dateFmt.format(d);
  } catch {
    return new Date(d).toLocaleString("id-ID");
  }
}

export default async function AdminSampahPage() {
  const sections = await listSampah();
  const total = countSampah(sections);
  const filled = sections.filter((s) => s.items.length > 0);

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
        <div className="space-y-8">
          {filled.map((section) => (
            <section key={section.type}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="display text-lg text-ink">{section.title}</h2>
                <Badge tone="muted">{section.items.length} item</Badge>
              </div>

              <Table className="min-w-[640px]">
                <THead>
                  <TR>
                    <TH>Label</TH>
                    <TH>Dihapus pada</TH>
                    <TH className="text-right">Aksi</TH>
                  </TR>
                </THead>
                <tbody>
                  {section.items.map((item) => (
                    <TR key={`${item.type}:${item.id}`} className="hover:bg-brand-50/60">
                      <TD>
                        <span className="font-bold text-ink">{item.label}</span>
                      </TD>
                      <TD className="text-muted">{formatDeletedAt(item.deletedAt)}</TD>
                      <TD className="text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <form action={restoreItem} className="inline-flex">
                            <input type="hidden" name="type" value={item.type} />
                            <input type="hidden" name="id" value={item.id} />
                            <Button type="submit" variant="outline" size="sm" title={`Pulihkan ${item.label}`}>
                              <RotateCcw className="h-4 w-4" />
                              Pulihkan
                            </Button>
                          </form>
                          <form action={hardDeleteItem} className="inline-flex">
                            <input type="hidden" name="type" value={item.type} />
                            <input type="hidden" name="id" value={item.id} />
                            <Button type="submit" variant="danger" size="sm" title={`Hapus permanen ${item.label}`}>
                              <Trash2 className="h-4 w-4" />
                              Hapus Permanen
                            </Button>
                          </form>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>

              <p className="mt-2 text-xs text-muted">
                Hapus permanen tidak dapat dibatalkan — data akan hilang selamanya.
              </p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
