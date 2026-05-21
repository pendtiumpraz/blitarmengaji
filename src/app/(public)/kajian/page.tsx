import Link from "next/link";
import { BookOpen, Calendar, MapPin, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { listKajian } from "@/lib/queries/kajian";

export const dynamic = "force-dynamic";

export const metadata = { title: "Kajian" };

const TYPE_LABEL: Record<string, string> = {
  offline: "Offline",
  online: "Online",
  hybrid: "Hybrid",
};

// Gradien cover bergiliran agar kartu tetap bervariasi tanpa data warna di DB.
const GRADIENTS = [
  "from-brand-600 to-brand-400",
  "from-brand-700 to-brand-500",
  "from-brand-600 to-brand-500",
  "from-brand-700 to-brand-600",
];

function initials(name: string | null): string {
  if (!name) return "BM";
  const parts = name.replace(/^Ust\.?\s*/i, "").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase() || "BM";
}

export default async function KajianListPage() {
  const all = await listKajian();
  // Halaman publik hanya menampilkan kajian yang sudah dipublikasikan.
  const kajianList = all.filter((k) => k.status === "published");

  return (
    <Container className="pt-10 pb-16">
      <SectionHeading
        eyebrow="Majelis Ilmu"
        title="Kajian & Rekaman"
        subtitle="Ikuti kajian rutin se-Blitar Raya — lengkap dengan ustadz, titik dakwah, dan kitab yang dibahas."
        className="mb-9"
      />

      {kajianList.length === 0 ? (
        // Empty state ramah
        <div className="mx-auto max-w-md rounded-[3px] border border-line bg-surface p-10 text-center shadow-[0_2px_10px_rgba(15,23,42,.06)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <BookOpen className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Belum ada kajian dipublikasikan</h2>
          <p className="mt-1 text-sm text-muted">
            Kajian rutin dari masjid, mushola, dan majelis taklim se-Blitar Raya akan tampil di sini. Pantau terus, ya.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {kajianList.map((k, i) => (
            <Link
              key={k.id}
              href={`/kajian/${k.slug}`}
              className="group flex flex-col overflow-hidden rounded-[3px] border border-line bg-surface shadow-[0_2px_10px_rgba(15,23,42,.06)] transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl"
            >
              {/* Cover */}
              <div className={`relative grid aspect-video place-items-center bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]}`}>
                {k.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={k.coverImage} alt={k.title} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="pat-girih-light absolute inset-0" />
                )}
                <span className="relative z-10 grid h-14 w-14 place-items-center rounded-full bg-white/25 backdrop-blur transition group-hover:scale-105">
                  <Play className="h-7 w-7 fill-white text-white" />
                </span>
                <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {TYPE_LABEL[k.type] ?? k.type}
                </span>
                {k.categoryName ? (
                  <Badge tone="brand" className="absolute right-2.5 top-2.5 z-10 text-[10px]">
                    {k.categoryName}
                  </Badge>
                ) : null}
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="display text-base leading-snug text-ink transition-colors group-hover:text-brand-700">
                  {k.title}
                </h3>

                {/* Ustadz */}
                {k.ustadzName ? (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
                      {initials(k.ustadzName)}
                    </span>
                    <p className="text-sm font-semibold text-ink">{k.ustadzName}</p>
                  </div>
                ) : null}

                <div className="mt-3 space-y-1.5 text-xs text-muted">
                  {k.titikName ? (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-brand-600" />
                      {k.titikName}
                      {k.kecamatan ? ` · ${k.kecamatan}` : ""}
                    </p>
                  ) : null}
                  {k.kitab ? (
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-brand-600" /> Kitab: {k.kitab}
                    </p>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
