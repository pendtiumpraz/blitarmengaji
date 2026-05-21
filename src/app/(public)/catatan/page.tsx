import Link from "next/link";
import { BookOpen, Clock, ArrowRight, FileText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { listPosts } from "@/lib/queries/konten";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Catatan Kajian — Blitar Mengaji",
  description:
    "Catatan & ringkasan kajian dari para ustadz di Blitar Raya — tafsir, fiqih, sirah, dan adab.",
};

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Estimasi waktu baca dari excerpt (~200 kata/menit). Konten penuh menyusul.
function readMinutes(text: string | null): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// Util gradient cover (deterministik dari id) — tanpa URL eksternal.
const COVERS = [
  "from-brand-700 to-brand-500",
  "from-gold-dark to-gold-light",
  "from-brand-800 to-brand-600",
  "from-brand-600 to-brand-400",
  "from-gold to-brand-500",
  "from-brand-700 to-brand-900",
] as const;
function coverFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return COVERS[sum % COVERS.length];
}

export default async function CatatanPage() {
  const notes = await listPosts();

  return (
    <>
      {/* HEADER */}
      <section className="bg-brand-600 text-cream">
        <div className="pat-girih-light relative">
          <Container className="relative z-10 py-14 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold-light/85">
              Ilmu yang Tertulis
            </p>
            <h1 className="display mx-auto mt-3 max-w-[18ch] text-4xl leading-[1.1] text-[#FBF4E2] md:text-5xl">
              Catatan <em className="italic text-gold-light">Kajian</em>
            </h1>
            <p className="mx-auto mt-5 max-w-[54ch] text-[16px] leading-relaxed text-cream/80">
              Ringkasan & transcript kajian dari para ustadz di Blitar Raya — agar ilmu yang
              didengar tetap terjaga dan mudah ditelaah ulang.
            </p>
          </Container>
        </div>
      </section>

      <Container className="py-12">
        <SectionHeading
          eyebrow="Pustaka Catatan"
          title="Telaah Ulang Ilmu Majelis"
          subtitle="Catatan kajian yang telah dipublikasikan oleh para ustadz."
          className="mb-8"
        />

        {notes.length === 0 ? (
          /* EMPTY STATE ramah */
          <div className="mx-auto max-w-md rounded-[3px] border border-dashed border-line bg-surface px-6 py-14 text-center shadow-card">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50">
              <FileText className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
            </div>
            <h3 className="display mt-4 text-xl text-ink">Belum ada catatan</h3>
            <p className="mx-auto mt-2 max-w-[40ch] text-sm leading-relaxed text-muted">
              Catatan kajian dari para ustadz akan tampil di sini begitu dipublikasikan.
              Nantikan ilmu yang tertulis dari majelis di Blitar Raya.
            </p>
          </div>
        ) : (
          /* GRID KARTU ARTIKEL */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => {
              const date = note.publishedAt ?? note.createdAt;
              const mins = readMinutes(note.excerpt);
              return (
                <Link
                  key={note.id}
                  href={`/catatan/${note.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[3px] border border-line bg-surface shadow-card transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl"
                >
                  {/* COVER (pakai coverImage bila ada, jika tidak gradient util) */}
                  {note.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={note.coverImage}
                      alt={note.title}
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`relative grid h-40 place-items-center bg-gradient-to-br ${coverFor(note.id)}`}
                    >
                      <div className="pat-trellis-light absolute inset-0" />
                      <BookOpen className="relative z-10 h-10 w-10 text-cream/90" strokeWidth={1.4} />
                      <span className="absolute left-3 top-3 z-10">
                        <Badge tone="gold" className="bg-black/25 text-gold-light backdrop-blur">
                          {note.type === "artikel" ? "Artikel" : "Catatan Kajian"}
                        </Badge>
                      </span>
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <Badge className="w-fit">
                      {note.type === "artikel" ? "Artikel" : "Catatan"}
                    </Badge>
                    <h3 className="display mt-2.5 text-lg leading-snug text-ink transition-colors group-hover:text-brand-700">
                      {note.title}
                    </h3>
                    {note.excerpt ? (
                      <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-muted">
                        {note.excerpt}
                      </p>
                    ) : null}
                    <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-[12px] text-muted">
                      {note.authorName ? (
                        <>
                          <span className="font-semibold text-ink/80">{note.authorName}</span>
                          <span className="text-line">·</span>
                        </>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {dateFmt.format(date)} · {mins} mnt baca
                      </span>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-600">
                      Baca catatan
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
