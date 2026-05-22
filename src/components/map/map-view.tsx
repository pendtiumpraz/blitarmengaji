"use client";

import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type TitikMarker = {
  slug: string;
  name: string;
  kecamatan?: string;
  jadwal?: string;
  lat: number;
  lng: number;
  /** Link Google Maps yang diinput pengelola (opsional). */
  gmapsUrl?: string;
  /** Foto sampul/logo titik (opsional). */
  image?: string;
};

/** Pusat default: Kota Blitar. */
export const BLITAR_CENTER: [number, number] = [-8.0954, 112.1609];

/** Marker pin custom (tanpa file gambar default Leaflet) — gaya craft. */
export const titikIcon = L.divIcon({
  className: "",
  html: `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0C7.2 0 0 7.2 0 16c0 11.2 16 24 16 24s16-12.8 16-24C32 7.2 24.8 0 16 0z" fill="#0E5C46"/>
    <circle cx="16" cy="16" r="9.5" fill="#C9A227"/>
    <path d="M11.5 22v-7.5c0-3.2 4.5-4.2 4.5-4.2s4.5 1 4.5 4.2V22" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/>
  </svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 40],
  popupAnchor: [0, -36],
});

/** Pin marker dengan thumbnail foto masjid (bulat + ekor pointer emerald). */
export function photoIcon(url: string) {
  const safe = url.replace(/"/g, "%22");
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:44px;height:52px;">
      <div style="width:44px;height:44px;border-radius:50%;border:3px solid #0E5C46;background:#fff;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.35);">
        <img src="${safe}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />
      </div>
      <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:9px solid #0E5C46;"></div>
    </div>`,
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -48],
  });
}

function gmapsLink(m: TitikMarker): string {
  return m.gmapsUrl && m.gmapsUrl.trim() ? m.gmapsUrl : `https://www.google.com/maps?q=${m.lat},${m.lng}`;
}

/**
 * Auto-zoom agar SEMUA marker masuk frame dengan padding (tidak mepet tepi).
 * Hanya aktif bila ≥2 marker; untuk 0–1 marker, hormati center/zoom yang diberikan.
 */
function FitBounds({ markers }: { markers: TitikMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length < 2) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]));
    if (!bounds.isValid()) return;
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14 });
  }, [map, markers]);
  return null;
}

export function MapView({
  markers,
  center,
  zoom = 13,
  className = "h-[460px]",
}: {
  markers: TitikMarker[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}) {
  const c = center ?? (markers[0] ? ([markers[0].lat, markers[0].lng] as [number, number]) : BLITAR_CENTER);
  return (
    <div className={`overflow-hidden rounded-lg border border-line ${className}`}>
      <MapContainer center={c} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((m) => (
          <Marker key={m.slug} position={[m.lat, m.lng]} icon={m.image ? photoIcon(m.image) : titikIcon}>
            <Popup>
              <div className="min-w-[180px] space-y-1">
                {m.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.image} alt={m.name} className="mb-1.5 h-20 w-full rounded object-cover" />
                ) : null}
                <p className="font-bold text-ink">{m.name}</p>
                {m.kecamatan ? <p className="text-xs text-muted">{m.kecamatan}</p> : null}
                {m.jadwal ? <p className="text-xs text-ink/80">{m.jadwal}</p> : null}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={`/titik/${m.slug}`} className="text-xs font-bold text-brand-600">
                    Detail →
                  </Link>
                  <a href={gmapsLink(m)} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-gold-dark">
                    Google Maps ↗
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
