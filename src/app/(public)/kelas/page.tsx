import { GraduationCap, BookMarked, PlayCircle, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { listCourses } from "@/lib/queries/belajar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kelas" };

// Ikon cover diputar berdasarkan urutan agar kartu tetap bervariasi (data dari DB).
const covers = [
  { tone: "bg-brand-600", icon: PlayCircle },
  { tone: "bg-gold", icon: GraduationCap },
  { tone: "bg-brand-700", icon: BookMarked },
  { tone: "bg-brand-600", icon: BookOpen },
] as const;

export default async function KelasPage() {
  const kelasList = await listCourses();

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          align="left"
          eyebrow="Belajar Terstruktur"
          title="Kelas Online"
          subtitle="Ikuti kursus dari para ustadz Blitar Raya — terstruktur per modul, bisa belajar kapan saja, dan semuanya gratis."
        />
        <Button href="/belajar-saya" variant="outline" size="sm">
          Belajar Saya
        </Button>
      </div>

      {kelasList.length === 0 ? (
        <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <GraduationCap className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h3 className="display mt-4 text-xl text-ink">Belum ada kelas online</h3>
          <p className="mt-1.5 max-w-[44ch] text-sm text-muted">
            Kelas dari para ustadz Blitar Raya sedang disiapkan. Nantikan materi terstruktur yang
            bisa kamu ikuti gratis, insya Allah segera hadir.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((k, i) => {
            const cover = covers[i % covers.length];
            const Icon = cover.icon;
            return (
              <div
                key={k.id}
                className="flex flex-col overflow-hidden rounded-[3px] border border-line bg-surface transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl"
              >
                <div className={`relative grid h-32 place-items-center ${cover.tone}`}>
                  {k.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={k.coverImage} alt={k.title} className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-12 w-12 text-white/90" strokeWidth={1.4} />
                  )}
                  <Badge tone="brand" className="absolute right-2 top-2 bg-surface text-brand-700">
                    Gratis
                  </Badge>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-[15px] font-bold leading-snug text-ink">{k.title}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted">
                    <span>{k.ustadzName ?? "Tim Pengajar"}</span>
                    <span aria-hidden>·</span>
                    <span>{k.lessonCount} pelajaran</span>
                    {k.level ? (
                      <>
                        <span aria-hidden>·</span>
                        <span className="capitalize">{k.level}</span>
                      </>
                    ) : null}
                  </p>

                  <div className="mt-auto pt-4">
                    <Button href={`/kelas/${k.slug}`} variant="outline" size="sm" className="w-full">
                      Lihat Kelas
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
