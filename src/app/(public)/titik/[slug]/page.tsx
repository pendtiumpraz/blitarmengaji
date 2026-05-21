import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, HandHeart, Info, MapPin, Navigation, Phone, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { DetailTabs } from "./tabs";
import { MiniMap } from "@/components/map/mini-map";
import { getTitikBySlug } from "@/lib/queries/titik";
import {
  campaignsByTitik,
  galleryByTitik,
  schedulesByTitik,
  videosByTitik,
} from "@/lib/queries/titik-media";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const titik = await getTitikBySlug(slug);
  if (!titik) return { title: "Tidak ditemukan" };

  const lokasi =
    [titik.kelurahan, titik.kecamatan].filter(Boolean).join(", ") || "Blitar Raya";
  const description =
    titik.description ?? `Titik dakwah ${titik.name} di ${lokasi}.`;

  return {
    title: titik.name,
    description,
    openGraph: {
      title: titik.name,
      description,
      ...(titik.coverImage ? { images: [titik.coverImage] } : {}),
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const titik = await getTitikBySlug(slug);
  if (!titik) notFound();

  const [galeri, video, jadwal, donasi] = await Promise.all([
    galleryByTitik(titik.id),
    videosByTitik(titik.id),
    schedulesByTitik(titik.id),
    campaignsByTitik(titik.id),
  ]);

  const lat = titik.latitude != null ? Number(titik.latitude) : null;
  const lng = titik.longitude != null ? Number(titik.longitude) : null;
  const coords = lat != null && lng != null ? { lat, lng } : null;
  const lokasi =
    titik.address ||
    [titik.kelurahan, titik.kecamatan].filter(Boolean).join(", ") ||
    "Blitar Raya";
  const gmapsLink = titik.gmapsUrl || (coords ? `https://www.google.com/maps?q=${coords.lat},${coords.lng}` : null);

  return (
    <>
      {/* COVER BESAR */}
      <section className="relative overflow-hidden bg-brand-600 text-cream">
        {titik.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={titik.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="pat-girih-light absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

        <Container className="relative z-10 flex h-56 flex-col justify-between py-5 md:h-64">
          <div className="flex justify-end">
            <button
              type="button"
              aria-label="Bagikan"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-cream backdrop-blur transition hover:bg-white/25"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          <div>
            {titik.status === "active" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-cream">
                <BadgeCheck className="h-3.5 w-3.5 text-gold-light" /> Terverifikasi
              </span>
            ) : null}
            <div className="mt-2 flex items-center gap-3">
              {titik.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={titik.logoUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-full border border-white/40 bg-white/10 object-cover"
                />
              ) : null}
              <h1 className="display text-3xl text-[#FBF4E2] md:text-4xl">{titik.name}</h1>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-cream/85">
              <MapPin className="h-4 w-4" /> {lokasi}
            </p>
          </div>
        </Container>
      </section>

      {/* KONTEN: 2 KOLOM DESKTOP */}
      <Container className="grid gap-6 py-10 lg:grid-cols-3">
        {/* KIRI — info + tab */}
        <div className="space-y-6 lg:col-span-2">
          <DetailTabs galeri={galeri} video={video} jadwal={jadwal} donasi={donasi} titikName={titik.name} />

          <Card className="p-6">
            <h2 className="display flex items-center gap-2 text-lg text-ink">
              <Info className="h-5 w-5 text-brand-600" /> Tentang Titik
            </h2>
            {titik.description ? (
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{titik.description}</p>
            ) : (
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                Belum ada deskripsi untuk titik dakwah ini.
              </p>
            )}
          </Card>
        </div>

        {/* KANAN — kartu aksi / peta mini */}
        <aside className="space-y-5">
          {/* Peta mini (hanya jika ada koordinat) */}
          <Card className="overflow-hidden">
            {coords ? (
              <MiniMap
                lat={coords.lat}
                lng={coords.lng}
                name={titik.name}
                slug={titik.slug}
                kecamatan={titik.kecamatan ?? undefined}
                gmapsUrl={titik.gmapsUrl ?? undefined}
                className="h-44"
              />
            ) : (
              <div className="grid h-44 place-items-center bg-brand-50 text-center text-sm text-muted">
                <span className="flex flex-col items-center gap-2">
                  <MapPin className="h-6 w-6 text-brand-600" />
                  Koordinat belum tersedia
                </span>
              </div>
            )}
            <div className="p-4">
              <p className="flex items-start gap-2 text-sm font-semibold text-ink">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" /> {lokasi}
              </p>
              {gmapsLink ? (
                <Button href={gmapsLink} variant="primary" size="md" className="mt-3 w-full">
                  <Navigation className="h-4 w-4" /> Buka di Google Maps
                </Button>
              ) : null}
            </div>
          </Card>

          {/* Kartu hubungi pengurus */}
          <div className="relative overflow-hidden rounded-[3px] bg-brand-700 p-5 text-cream">
            <div className="pat-girih-light absolute inset-0" />
            <div className="relative z-10">
              <p className="mb-1 text-xs text-cream/70">Pengurus / Takmir</p>
              <p className="display text-lg">{titik.ownerName ?? "Belum terdaftar"}</p>
              {titik.contactPhone ? (
                <Button
                  href={`tel:${titik.contactPhone}`}
                  variant="gold"
                  size="lg"
                  className="mt-3 w-full"
                >
                  <Phone className="h-4 w-4" /> Hubungi Pengurus
                </Button>
              ) : null}
              <Button href="/donasi" size="lg" className="mt-2 w-full bg-white/10 text-cream hover:bg-white/20">
                <HandHeart className="h-4 w-4 text-gold-light" /> Donasi ke Titik Ini
              </Button>
            </div>
          </div>
        </aside>
      </Container>
    </>
  );
}
