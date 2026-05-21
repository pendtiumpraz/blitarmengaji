import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Area privat & API tidak perlu di-index.
      disallow: ["/admin", "/kelola", "/ustadz", "/akun", "/api", "/gabung"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
