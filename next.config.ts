import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // izinkan upload file (gambar/PDF) lewat Server Action
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
