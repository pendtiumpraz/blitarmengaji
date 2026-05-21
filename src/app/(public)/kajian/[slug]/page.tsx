import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Clock,
  Layers,
  MapPin,
  NotebookPen,
  Play,
  Text,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { getKajianBySlug } from "@/lib/queries/kajian";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kajian = await getKajianBySlug(slug);
  if (!kajian) return { title: "Tidak ditemukan" };

  const description =
    kajian.description ??
    ([kajian.ustadzName, kajian.titikName].filter(Boolean).join(" · ") ||
      `Kajian ${kajian.title} di Blitar Raya.`);

  return {
    title: kajian.title,
    description,
    openGraph: {
      title: kajian.title,
      description,
      ...(kajian.coverImage ? { images: [kajian.coverImage] } : {}),
    },
  };
}

const TYPE_LABEL: Record<string, string> = {
  offline: "Offline",
  online: "Online",
  hybrid: "Hybrid",
};

function initials(name: string | null): string {
  if (!name) return "BM";
  const parts = name.replace(/^Ust\.?\s*/i, "").trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase() || "BM";
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kajian = await getKajianBySlug(slug);

  if (!kajian) notFound();

  return (
    <Container className="pt-5 pb-16">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/kajian" className="hover:text-brand-600">
          Kajian
        </Link>
        {kajian.categoryName ? (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{kajian.categoryName}</span>
          </>
        ) : null}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-ink">{kajian.title}</span>
      </nav>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-3">
        {/* ===== KOLOM KIRI ===== */}
        <div className="space-y-6 lg:col-span-2">
          {/* Cover / player */}
          <div className="overflow-hidden rounded-[3px] bg-black shadow-[0_2px_10px_rgba(15,23,42,.06)]">
            <div className="relative grid aspect-video place-items-center bg-brand-600">
              {kajian.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={kajian.coverImage} alt={kajian.title} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="pat-girih-light absolute inset-0" />
              )}
              <span className="relative z-10 grid h-20 w-20 place-items-center rounded-full bg-white/25 backdrop-blur">
                <Play className="h-10 w-10 fill-white text-white" />
              </span>
              <span className="absolute left-3 top-3 z-10 rounded-full bg-black/40 px-2.5 py-0.5 text-[11px] font-bold text-white">
                {TYPE_LABEL[kajian.type] ?? kajian.type}
              </span>
            </div>
          </div>

          {/* Judul */}
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              {kajian.categoryName ? (
                <Badge tone="brand" className="text-xs">
                  {kajian.categoryName}
                </Badge>
              ) : null}
              <Badge tone="muted" className="text-xs">
                {TYPE_LABEL[kajian.type] ?? kajian.type}
              </Badge>
            </div>
            <h1 className="display text-2xl leading-tight text-ink sm:text-3xl">{kajian.title}</h1>
          </div>

          {/* Tentang */}
          <div className="rounded-[3px] border border-line bg-surface p-5 shadow-[0_2px_10px_rgba(15,23,42,.06)]">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink">
              <Text className="h-4 w-4 text-brand-600" /> Tentang Kajian Ini
            </h2>
            {kajian.description ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink/90">{kajian.description}</p>
            ) : (
              <p className="text-sm italic text-muted">Deskripsi kajian belum ditambahkan.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
              {kajian.kitab ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5">
                  <NotebookPen className="h-3.5 w-3.5 text-brand-600" /> Kitab: {kajian.kitab}
                </span>
              ) : null}
              {kajian.categoryName ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5">
                  <Layers className="h-3.5 w-3.5 text-brand-600" /> {kajian.categoryName}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-brand-600" /> {TYPE_LABEL[kajian.type] ?? kajian.type}
              </span>
            </div>
          </div>
        </div>

        {/* ===== KOLOM KANAN (SIDEBAR) ===== */}
        <aside className="space-y-5 lg:sticky lg:top-24">
          {/* Info ustadz */}
          {kajian.ustadzName ? (
            <div className="rounded-[3px] border border-line bg-surface p-5 shadow-[0_2px_10px_rgba(15,23,42,.06)]">
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {initials(kajian.ustadzName)}
                </span>
                <div className="flex-1">
                  <p className="font-bold leading-tight text-ink">{kajian.ustadzName}</p>
                  {kajian.ustadzSpecialization ? (
                    <p className="mt-0.5 text-xs text-muted">{kajian.ustadzSpecialization}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* Lokasi / titik dakwah */}
          <div className="rounded-[3px] border border-line bg-surface p-5 shadow-[0_2px_10px_rgba(15,23,42,.06)]">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <MapPin className="h-4 w-4 text-brand-600" /> Lokasi
            </h2>
            {kajian.titikName ? (
              <div className="rounded-[3px] bg-cream p-3">
                <p className="text-sm font-semibold leading-tight text-ink">{kajian.titikName}</p>
                {kajian.kecamatan ? <p className="mt-0.5 text-xs text-muted">{kajian.kecamatan}</p> : null}
                {kajian.gmapsUrl ? (
                  <a
                    href={kajian.gmapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Buka di Google Maps <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-sm italic text-muted">Lokasi belum ditentukan.</p>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}
