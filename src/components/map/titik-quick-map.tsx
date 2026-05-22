"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { titikIcon, BLITAR_CENTER } from "./map-view";

function ClickCapture({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Mini-peta untuk menandai lokasi titik baru (klik = set koordinat). */
export function TitikQuickMap({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const [pos, setPos] = useState<[number, number] | null>(null);
  return (
    <div className="h-48 overflow-hidden rounded-sm border border-line">
      <MapContainer center={BLITAR_CENTER} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture
          onPick={(lat, lng) => {
            setPos([lat, lng]);
            onPick(lat, lng);
          }}
        />
        {pos ? <Marker position={pos} icon={titikIcon} /> : null}
      </MapContainer>
    </div>
  );
}
