"use client";

import { useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { titikIcon, BLITAR_CENTER, type TitikMarker } from "./map-view";

/** Pin abu untuk titik lain (referensi). */
const refIcon = L.divIcon({
  className: "",
  html: `<svg width="24" height="30" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg"><path d="M16 0C7.2 0 0 7.2 0 16c0 11.2 16 24 16 24s16-12.8 16-24C32 7.2 24.8 0 16 0z" fill="#9aa1ab"/><circle cx="16" cy="16" r="8" fill="#fff"/></svg>`,
  iconSize: [24, 30],
  iconAnchor: [12, 30],
});

function ClickToSet({ onSet }: { onSet: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSet(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Picker lokasi titik dakwah: klik / drag pin di peta untuk MENGUNCI koordinat,
 * lihat daftar titik lain sebagai referensi, dan isi link Google Maps.
 */
export function LocationPicker({
  initial,
  existing = [],
  initialGmaps = "",
}: {
  initial?: [number, number];
  existing?: TitikMarker[];
  initialGmaps?: string;
}) {
  const start = initial ?? BLITAR_CENTER;
  const [pos, setPos] = useState<[number, number]>(start);
  const [gmaps, setGmaps] = useState(initialGmaps);
  const [locked, setLocked] = useState(false);

  const autoLink = `https://www.google.com/maps?q=${pos[0].toFixed(6)},${pos[1].toFixed(6)}`;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="h-[420px] overflow-hidden rounded-lg border border-line lg:col-span-2">
        <MapContainer center={start} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToSet
            onSet={(lat, lng) => {
              setPos([lat, lng]);
              setLocked(false);
            }}
          />
          {existing.map((t) => (
            <Marker key={t.slug} position={[t.lat, t.lng]} icon={refIcon} />
          ))}
          <Marker
            position={pos}
            draggable
            icon={titikIcon}
            eventHandlers={{
              dragend(e) {
                const ll = (e.target as L.Marker).getLatLng();
                setPos([ll.lat, ll.lng]);
                setLocked(false);
              },
            }}
          />
        </MapContainer>
      </div>

      <div className="space-y-3">
        <div className="rounded-sm border border-line bg-surface p-3">
          <p className="text-xs font-bold text-muted">Koordinat terpilih</p>
          <p className="mt-1 font-mono text-sm text-ink">
            {pos[0].toFixed(6)}, {pos[1].toFixed(6)}
          </p>
          <p className="mt-1 text-[11px] text-muted">Klik peta atau geser pin untuk menentukan lokasi.</p>
          {/* nilai siap dikirim form (nanti ke titik_dakwah) */}
          <input type="hidden" name="latitude" value={pos[0]} readOnly />
          <input type="hidden" name="longitude" value={pos[1]} readOnly />
        </div>

        <div className="rounded-sm border border-line bg-surface p-3">
          <label htmlFor="gmaps" className="text-xs font-bold text-muted">
            Link Google Maps
          </label>
          <input
            id="gmaps"
            name="gmaps_url"
            value={gmaps}
            onChange={(e) => setGmaps(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className="mt-1 h-10 w-full rounded-sm border border-line bg-cream px-2 text-sm focus:border-brand-600 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setGmaps(autoLink)}
            className="mt-2 text-[11px] font-bold text-brand-600 hover:underline"
          >
            Pakai link dari pin
          </button>
          {gmaps ? (
            <a href={gmaps} target="_blank" rel="noopener noreferrer" className="mt-2 block text-[11px] font-bold text-gold-dark">
              Tes buka di Google Maps ↗
            </a>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setLocked(true)}
          className="w-full rounded-sm bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
        >
          {locked ? "✓ Lokasi Terkunci" : "Kunci Lokasi"}
        </button>

        {existing.length > 0 ? (
          <div className="rounded-sm border border-line bg-surface p-3">
            <p className="mb-1 text-xs font-bold text-muted">Daftar titik (referensi)</p>
            <ul className="space-y-1 text-xs text-ink/80">
              {existing.map((t) => (
                <li key={t.slug} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {t.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
