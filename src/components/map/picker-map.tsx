"use client";

import dynamic from "next/dynamic";
import type { TitikMarker } from "./map-view";

const LocationPicker = dynamic(() => import("./location-picker").then((m) => m.LocationPicker), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full animate-pulse rounded-lg border border-line bg-brand-50" />,
});

export function PickerMap({
  initial,
  existing,
  initialGmaps,
}: {
  initial?: [number, number];
  existing?: TitikMarker[];
  initialGmaps?: string;
}) {
  return <LocationPicker initial={initial} existing={existing} initialGmaps={initialGmaps} />;
}
