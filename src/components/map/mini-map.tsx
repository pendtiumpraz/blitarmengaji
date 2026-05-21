"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-lg border border-line bg-brand-50" />,
});

export function MiniMap({
  lat,
  lng,
  name,
  slug,
  kecamatan,
  gmapsUrl,
  className = "h-56",
}: {
  lat: number;
  lng: number;
  name: string;
  slug: string;
  kecamatan?: string;
  gmapsUrl?: string;
  className?: string;
}) {
  return (
    <MapView
      markers={[{ slug, name, lat, lng, kecamatan, gmapsUrl }]}
      center={[lat, lng]}
      zoom={15}
      className={className}
    />
  );
}
