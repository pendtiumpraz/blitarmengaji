"use client";

import dynamic from "next/dynamic";
import type { TitikMarker } from "./map-view";

const MapView = dynamic(() => import("./map-view").then((m) => m.MapView), {
  ssr: false,
  loading: () => <div className="h-[460px] w-full animate-pulse rounded-lg border border-line bg-brand-50" />,
});

export function PetaMap({ markers, className }: { markers: TitikMarker[]; className?: string }) {
  return <MapView markers={markers} className={className ?? "h-[460px]"} />;
}
