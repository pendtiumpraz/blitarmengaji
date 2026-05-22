import { Building2, MapPinned } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PetaMap } from "@/components/map/peta-map";
import type { TitikMarker } from "@/components/map/map-view";
import { listTitik } from "@/lib/queries/titik";

export const dynamic = "force-dynamic";

export const metadata = { title: "Peta Kajian" };

function statusTone(status: "active" | "pending" | "rejected"): {
  tone: "success" | "warning" | "danger";
  label: string;
} {
  if (status === "active") return { tone: "success", label: "Terverifikasi" };
  if (status === "rejected") return { tone: "danger", label: "Ditolak" };
  return { tone: "warning", label: "Menunggu" };
}

export default async function PetaPage() {
  // Hanya titik AKTIF yang tampil di peta publik (yang dinonaktifkan disembunyikan).
  const titikList = (await listTitik()).filter((t) => t.isActive !== false);

  // Marker hanya untuk titik yang punya koordinat.
  const markers: TitikMarker[] = titikList
    .filter((t) => t.latitude != null && t.longitude != null)
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      kecamatan: t.kecamatan ? `${t.kecamatan}, Blitar Raya` : undefined,
      lat: Number(t.latitude),
      lng: Number(t.longitude),
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

      {titikList.length === 0 ? (
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
        <div className="grid gap-5 lg:grid-cols-3">
          {/* PETA Leaflet + OpenStreetMap (gratis) */}
          <div className="lg:col-span-2">
            <PetaMap markers={markers} className="h-[460px]" />
            <p className="mt-2 text-[11px] text-muted">
              Klik pin untuk lihat detail & buka di Google Maps. Peta dari OpenStreetMap.
            </p>
          </div>

          {/* sidebar daftar titik */}
          <aside>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-ink">{titikList.length} Titik Dakwah</p>
              <span className="text-xs text-muted">Urutkan: Terbaru</span>
            </div>
            <div className="space-y-3">
              {titikList.map((t) => {
                const s = statusTone(t.status);
                return (
                  <div key={t.slug} className="rounded-[3px] border border-line bg-surface p-3">
                    <div className="flex gap-3">
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[3px] bg-brand-50">
                        <Building2 className="h-6 w-6 text-brand-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-ink">{t.name}</p>
                        <p className="text-xs text-muted">
                          {t.kecamatan ? `${t.kecamatan}, Blitar Raya` : "Blitar Raya"}
                        </p>
                        <Badge tone={s.tone} className="mt-1.5">
                          {s.label}
                        </Badge>
                      </div>
                    </div>

                    {t.address ? (
                      <p className="mt-3 rounded-[3px] bg-cream px-3 py-2 text-xs text-muted">{t.address}</p>
                    ) : null}

                    <Button href={`/titik/${t.slug}`} variant="outline" size="sm" className="mt-3 w-full">
                      Lihat Detail
                    </Button>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </Container>
  );
}
