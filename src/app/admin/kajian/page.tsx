import { BookOpen, Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { listKajianPaged, countKajian } from "@/lib/queries/kajian";
import { softDeleteKajian } from "@/lib/actions/kajian";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const TYPE_LABEL: Record<string, string> = {
  offline: "Offline",
  online: "Online",
  hybrid: "Hybrid",
};

export default async function AdminKajianPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [rows, total] = await Promise.all([
    listKajianPaged(page, PAGE_SIZE),
    countKajian(),
  ]);

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

      {total === 0 ? (
        // Empty state ramah
        <Card className="px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <BookOpen className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Belum ada kajian</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Mulai daftarkan kajian rutin pertama beserta ustadz dan titik dakwahnya agar tampil untuk jamaah.
          </p>
          <div className="mt-5">
            <Button href="/admin/kajian/baru">
              <Plus className="h-4 w-4" /> Tambah Kajian
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Table className="min-w-[820px]">
            <THead>
              <TR>
                <TH>Judul</TH>
                <TH>Ustadz</TH>
                <TH>Titik / Lokasi</TH>
                <TH>Tipe</TH>
                <TH>Status</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <tbody>
              {rows.map((r) => (
                <TR key={r.id} className="hover:bg-brand-50/50">
                  <TD>
                    <div className="font-bold text-ink">{r.title}</div>
                    {r.kitab ? <div className="text-xs text-muted">{r.kitab}</div> : null}
                  </TD>
                  <TD className="text-ink">{r.ustadzName ?? <span className="text-muted">—</span>}</TD>
                  <TD>
                    {r.titikName ? (
                      <>
                        <div className="text-ink">{r.titikName}</div>
                        {r.kecamatan ? <div className="text-xs text-muted">{r.kecamatan}</div> : null}
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TD>
                  <TD className="text-ink">{TYPE_LABEL[r.type] ?? r.type}</TD>
                  <TD>
                    <Badge tone={r.status === "published" ? "success" : "muted"}>
                      {r.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </TD>
                  <TD className="text-right">
                    <span className="inline-flex items-center gap-3 text-muted">
                      <a
                        href={`/kajian/${r.slug}`}
                        aria-label={`Lihat ${r.title}`}
                        title="Lihat"
                        className="hover:text-brand-600"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <a
                        href={`/admin/kajian/${r.id}`}
                        aria-label={`Edit ${r.title}`}
                        title="Edit"
                        className="hover:text-brand-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </a>
                      <form action={softDeleteKajian} className="inline-flex">
                        <input type="hidden" name="id" value={r.id} />
                        <button type="submit" aria-label={`Hapus ${r.title}`} title="Hapus" className="hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </span>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseHref="/admin/kajian" />

          <p className="mt-3 text-xs text-muted">
            Tombol Hapus melakukan <em>soft delete</em> (data masuk recycle bin, bukan dihapus permanen). Aksi muncul
            sesuai permission user pada modul ini.
          </p>
        </>
      )}
    </div>
  );
}
