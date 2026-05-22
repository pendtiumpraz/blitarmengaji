import { MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PetaExplorer, type TitikItem } from "@/components/map/peta-explorer";
import { listTitik } from "@/lib/queries/titik";

export const dynamic = "force-dynamic";

export const metadata = { title: "Peta Kajian" };

export default async function PetaPage() {
  // Hanya titik AKTIF yang tampil di peta publik (yang dinonaktifkan disembunyikan).
  const titikList = (await listTitik()).filter((t) => t.isActive !== false);

  const titik: TitikItem[] = titikList.map((t) => ({
    slug: t.slug,
    name: t.name,
    kecamatan: t.kecamatan,
    address: t.address,
    status: t.status,
    image: t.coverImage ?? t.logoUrl ?? null,
    lat: t.latitude != null ? Number(t.latitude) : null,
    lng: t.longitude != null ? Number(t.longitude) : null,
    gmapsUrl: t.gmapsUrl ?? undefined,
  }));

  return (
    <Container className="py-10">
      <SectionHeading
        align="left"
        eyebrow="Jelajahi"
        title="Peta Kajian"
        subtitle="Temukan titik dakwah terdekat di Blitar Raya — masjid, mushola, dan majelis taklim."
        className="mb-6"
      />

      {titik.length === 0 ? (
        <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-20 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
            <MapPinned className="h-8 w-8" />
          </span>
          <h2 className="display mt-4 text-xl text-ink">Belum ada titik dakwah terdaftar</h2>
          <p className="mt-1 max-w-md text-sm text-muted">
            Titik dakwah di Blitar Raya akan tampil di peta ini begitu pengelola mendaftarkannya. Nantikan ya.
          </p>
          <Button href="/" variant="outline" size="md" className="mt-5">
            Kembali ke Beranda
          </Button>
        </div>
      ) : (
        <PetaExplorer titik={titik} />
      )}
    </Container>
  );
}
