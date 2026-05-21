import { Building2, Eye, MapPinned, Pencil, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { listTitikPaged } from "@/lib/queries/titik";
import { softDeleteTitik } from "@/lib/actions/titik";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function StatusBadge({ status }: { status: "active" | "pending" | "rejected" }) {
  if (status === "active") return <Badge tone="success">Terverifikasi</Badge>;
  if (status === "rejected") return <Badge tone="danger">Ditolak</Badge>;
  return <Badge tone="warning">Menunggu</Badge>;
}

export default async function AdminTitikList({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { rows: titik, total } = await listTitikPaged(page, PAGE_SIZE);

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

      {total === 0 ? (
        <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <MapPinned className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Belum ada titik dakwah</h2>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Daftarkan masjid, mushola, atau majelis taklim pertama agar muncul di peta dan bisa dikelola di sini.
          </p>
          <Button href="/admin/titik/baru" size="md" className="mt-5">
            + Tambah Titik
          </Button>
        </div>
      ) : (
        <>
          <Table className="min-w-[720px]">
            <THead>
              <TR>
                <TH>Nama</TH>
                <TH>Kecamatan</TH>
                <TH>Pengelola</TH>
                <TH>Status</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <tbody>
              {titik.map((t) => (
                <TR key={t.id} className="hover:bg-brand-50/60">
                  <TD>
                    <div className="flex items-center gap-3">
                      {t.coverImage || t.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={(t.coverImage ?? t.logoUrl) as string}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-sm object-cover"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-brand-600 text-white">
                          <Building2 className="h-4 w-4" />
                        </span>
                      )}
                      <span className="font-bold text-ink">{t.name}</span>
                    </div>
                  </TD>
                  <TD className="text-muted">{t.kecamatan ?? "—"}</TD>
                  <TD className="text-ink/80">{t.ownerName ?? "—"}</TD>
                  <TD>
                    <StatusBadge status={t.status} />
                  </TD>
                  <TD className="text-right">
                    <span className="inline-flex items-center gap-3 text-muted">
                      <a href={`/titik/${t.slug}`} aria-label={`Lihat ${t.name}`} title="Lihat">
                        <Eye className="h-4 w-4 hover:text-brand-600" />
                      </a>
                      <a href={`/admin/titik/${t.id}`} aria-label={`Ubah ${t.name}`} title="Ubah">
                        <Pencil className="h-4 w-4 hover:text-brand-600" />
                      </a>
                      <form action={softDeleteTitik} className="inline-flex">
                        <input type="hidden" name="id" value={t.id} />
                        <button type="submit" aria-label={`Hapus ${t.name}`} title="Hapus">
                          <Trash2 className="h-4 w-4 hover:text-red-600" />
                        </button>
                      </form>
                    </span>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseHref="/admin/titik" />
        </>
      )}
    </div>
  );
}
