"use client";

import { useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PetaMap } from "@/components/map/peta-map";
import type { TitikMarker } from "@/components/map/map-view";

export type TitikItem = {
  slug: string;
  name: string;
  kecamatan: string | null;
  address: string | null;
  status: "active" | "pending" | "rejected";
  image: string | null;
  lat: number | null;
  lng: number | null;
  gmapsUrl?: string;
};

function statusTone(status: TitikItem["status"]): { tone: "success" | "warning" | "danger"; label: string } {
  if (status === "active") return { tone: "success", label: "Terverifikasi" };
  if (status === "rejected") return { tone: "danger", label: "Ditolak" };
  return { tone: "warning", label: "Menunggu" };
}

/** Peta + search/filter kecamatan + grid kartu titik. Filter ikut menyaring marker peta. */
export function PetaExplorer({ titik }: { titik: TitikItem[] }) {
  const [q, setQ] = useState("");
  const [kec, setKec] = useState("");

  const kecList = useMemo(
    () => Array.from(new Set(titik.map((t) => t.kecamatan).filter(Boolean) as string[])).sort(),
    [titik],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return titik.filter((t) => {
      if (kec && (t.kecamatan ?? "") !== kec) return false;
      if (query && !`${t.name} ${t.kecamatan ?? ""} ${t.address ?? ""}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [titik, q, kec]);

  const markers: TitikMarker[] = filtered
    .filter((t) => t.lat != null && t.lng != null)
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      kecamatan: t.kecamatan ? `${t.kecamatan}, Blitar Raya` : undefined,
      lat: t.lat as number,
      lng: t.lng as number,
      gmapsUrl: t.gmapsUrl,
      image: t.image ?? undefined,
    }));

  return (
    <div>
      {/* PETA — lebar penuh; marker ikut filter */}
      <PetaMap markers={markers} className="h-[480px] w-full" />
      <p className="mt-2 text-[11px] text-muted">
        Klik pin untuk lihat detail & buka di Google Maps. Peta dari OpenStreetMap.
      </p>

      {/* SEARCH + FILTER kecamatan */}
      <div className="mb-4 mt-8 flex flex-wrap items-center gap-2">
        <div className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-sm border border-line bg-surface px-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama titik / masjid / alamat…"
            className="h-full w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
        <select
          value={kec}
          onChange={(e) => setKec(e.target.value)}
          className="h-10 rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none"
        >
          <option value="">Semua kecamatan</option>
          {kecList.map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <span className="text-xs text-muted">{filtered.length} titik</span>
      </div>

      {/* GRID kartu */}
      {filtered.length === 0 ? (
        <div className="rounded-[3px] border border-dashed border-line bg-surface px-6 py-12 text-center text-sm text-muted">
          Tidak ada titik yang cocok dengan pencarian/filter.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const s = statusTone(t.status);
            return (
              <div key={t.slug} className="flex flex-col rounded-[3px] border border-line bg-surface p-4">
                <div className="flex gap-3">
                  {t.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.image} alt={t.name} className="h-14 w-14 shrink-0 rounded-[3px] object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[3px] bg-brand-50">
                      <Building2 className="h-6 w-6 text-brand-600" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-snug text-ink">{t.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {t.kecamatan ? `${t.kecamatan}, Blitar Raya` : "Blitar Raya"}
                    </p>
                    <Badge tone={s.tone} className="mt-1.5">{s.label}</Badge>
                  </div>
                </div>

                {t.address ? (
                  <p className="mt-3 line-clamp-2 rounded-[3px] bg-cream px-3 py-2 text-xs text-muted">{t.address}</p>
                ) : null}

                <Button href={`/titik/${t.slug}`} variant="outline" size="sm" className="mt-3 w-full sm:mt-auto sm:pt-3">
                  Lihat Detail
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
