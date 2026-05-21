import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Blitar Mengaji — Majelis Ilmu Blitar Raya",
    short_name: "Blitar Mengaji",
    description:
      "Pusat informasi kajian, jadwal, peta dakwah, transparansi keuangan, dan ekosistem dakwah digital se-Blitar Raya. Gratis & terbuka.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "id",
    dir: "ltr",
    background_color: "#F4EEE1",
    theme_color: "#0E5C46",
    categories: ["education", "lifestyle", "books"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Jadwal Kajian",
        short_name: "Jadwal",
        url: "/jadwal",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Peta Dakwah",
        short_name: "Peta",
        url: "/peta",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Tanya AI",
        short_name: "Tanya AI",
        url: "/tanya-ai",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Donasi",
        short_name: "Donasi",
        url: "/donasi",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
