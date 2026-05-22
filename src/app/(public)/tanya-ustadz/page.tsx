import { MessageCircleQuestion, Plus, UserRound, VenetianMask } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { listQuestionsPaged } from "@/lib/queries/tanya";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

/** Format waktu relatif sederhana dalam Bahasa Indonesia. */
function waktuRelatif(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const menit = Math.floor(diff / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;
  return `${Math.floor(bulan / 12)} tahun lalu`;
}

export default async function TanyaUstadzPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { rows: list, total } = await listQuestionsPaged(page, PAGE_SIZE, { publicOnly: true });

  return (
    <Container className="py-10">
      <SectionHeading
        align="left"
        eyebrow="Ukhuwah"
        title="Tanya Ustadz"
        subtitle={'Sampaikan pertanyaanmu — boleh sebagai "Hamba Allah" (anonim). Jawaban ustadz selalu menyebut nama beliau.'}
        className="mb-6"
      />

      <Button href="/tanya-ustadz/ajukan" variant="gold" size="lg" className="mb-6 w-full sm:w-auto">
        <Plus className="h-5 w-5" /> Ajukan Pertanyaan
      </Button>

      {list.length === 0 ? (
        <div className="rounded-[3px] border border-dashed border-line bg-surface px-6 py-14 text-center">
          <MessageCircleQuestion className="mx-auto h-10 w-10 text-brand-600/60" />
          <p className="mt-3 text-sm font-bold text-ink">Belum ada pertanyaan</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted">
            Jadilah yang pertama mengajukan pertanyaan kepada ustadz.
          </p>
          <Button href="/tanya-ustadz/ajukan" variant="primary" size="md" className="mt-5">
            <Plus className="h-4 w-4" /> Ajukan Pertanyaan
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((q) => {
            const dijawab = q.answers.length > 0;
            return (
              <div key={q.id} className="rounded-[3px] border border-line bg-surface p-4">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  {q.categoryName ? <Badge tone="brand">{q.categoryName}</Badge> : <span />}
                  {dijawab ? (
                    <Badge tone="success">Dijawab</Badge>
                  ) : (
                    <Badge tone="warning">Menunggu</Badge>
                  )}
                </div>
                <p className="text-sm font-bold text-ink">{q.title}</p>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink/70">{q.body}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted">
                  {q.isAnonymous ? (
                    <VenetianMask className="h-3.5 w-3.5" />
                  ) : (
                    <UserRound className="h-3.5 w-3.5" />
                  )}
                  oleh <b className="font-bold text-ink">{q.askerDisplay}</b> · {waktuRelatif(q.createdAt)}
                </p>

                {q.answers.map((a) => (
                  <div key={a.id} className="mt-3 rounded-[3px] border-l-2 border-brand-500 bg-cream p-3">
                    <p className="whitespace-pre-line text-xs leading-relaxed text-ink/80">{a.body}</p>
                    <p className="mt-1.5 text-[11px] font-bold text-brand-700">
                      — {a.ustadzName}
                      {a.ustadzSpecialization ? (
                        <span className="font-normal text-muted"> · {a.ustadzSpecialization}</span>
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {total > PAGE_SIZE ? (
        <div className="mt-6">
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseHref="/tanya-ustadz" />
        </div>
      ) : null}
    </Container>
  );
}
