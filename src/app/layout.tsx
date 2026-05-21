import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Blitar Mengaji",
    template: "%s · Blitar Mengaji",
  },
  description:
    "Pusat informasi kajian, jadwal, peta dakwah, transparansi keuangan, dan ekosistem dakwah digital se-Blitar Raya. Gratis & terbuka.",
  applicationName: "Blitar Mengaji",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Blitar Mengaji", statusBarStyle: "default" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-icon-180.png",
  },
  openGraph: {
    siteName: "Blitar Mengaji",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E5C46",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Sumber kebenaran SSR untuk tema = cookie 'theme' (default 'teduh').
  // Mencegah flash karena <html data-theme> sudah benar sejak render server.
  const theme = (await cookies()).get("theme")?.value ?? "teduh";

  return (
    <html lang="id" data-theme={theme} className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Reem+Kufi:wght@500;600;700&family=Amiri:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
