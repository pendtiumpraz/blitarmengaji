import { HandHeart, Megaphone, MapPin, Check, Trash2, Plus, ReceiptText, Pencil } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { listCampaignsPaged, countCampaigns } from "@/lib/queries/donasi";
import { softDeleteCampaign } from "@/lib/actions/donasi";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function rupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

function persen(terkumpul: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((terkumpul / target) * 100));
}

export default async function AdminDonasiPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [campaigns, total] = await Promise.all([
    listCampaignsPaged(page, PAGE_SIZE),
    countCampaigns(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Donasi"
        subtitle="Kelola campaign donasi per titik dakwah secara transparan untuk jamaah Blitar Raya."
        action={
          <Button href="/admin/donasi/baru" variant="gold">
            <Plus className="h-4 w-4" /> Buat Campaign
          </Button>
        }
      />

      <section>
        <h2 className="display flex items-center gap-2 text-lg text-ink">
          <Megaphone className="h-5 w-5 text-brand-600" /> Campaign Donasi
        </h2>

        {campaigns.length === 0 ? (
          <Card className="mt-4 grid place-items-center px-6 py-14 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
              <HandHeart className="h-7 w-7" />
            </div>
            <p className="display mt-3 text-lg text-ink">Belum ada campaign donasi</p>
            <p className="mt-1 max-w-md text-sm text-muted">
              Buat campaign penggalangan dana pertama untuk titik dakwah agar jamaah bisa ikut bersedekah.
            </p>
            <Button href="/admin/donasi/baru" variant="gold" className="mt-5">
              <Plus className="h-4 w-4" /> Buat Campaign
            </Button>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {campaigns.map((c) => {
              const collected = Number(c.collectedAmount ?? 0);
              const target = Number(c.targetAmount ?? 0);
              const pct = persen(collected, target);
              const selesai = c.status === "completed" || c.status === "closed";
              return (
                <Card key={c.id} className={selesai ? "p-4 opacity-90" : "p-4"}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-sm bg-brand-600 text-white">
                      <HandHeart className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold leading-tight text-ink">{c.title}</p>
                        {selesai ? (
                          <Badge tone="success" className="shrink-0">
                            <Check className="h-3 w-3" /> Selesai
                          </Badge>
                        ) : (
                          <Badge tone="warning" className="shrink-0">
                            Aktif
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                        <MapPin className="h-3 w-3" /> {c.titikName ?? "Titik dakwah"}
                        {c.kecamatan ? ` · ${c.kecamatan}` : ""}
                      </p>

                      {/* progress */}
                      <div className="mt-2.5">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-bold text-brand-700">{rupiah(collected)}</span>
                          <span className="text-muted">dari {target > 0 ? rupiah(target) : "—"}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-brand-50">
                          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-1 flex justify-between text-[11px] text-muted">
                          <span>{pct}% tercapai</span>
                          <span>/{c.slug}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <Button href={`/donasi/${c.slug}`} variant="ghost" size="sm">
                      <ReceiptText className="h-3.5 w-3.5" /> Lihat Publik
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button href={`/admin/donasi/${c.id}`} variant="outline" size="sm">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <form action={softDeleteCampaign}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button
                          type="submit"
                          variant="danger"
                          size="sm"
                          className="bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Hapus
                        </Button>
                      </form>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {total > 0 ? (
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseHref="/admin/donasi" />
        ) : null}
      </section>
    </div>
  );
}
