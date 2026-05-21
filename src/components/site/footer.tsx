import Link from "next/link";
import { Crest } from "@/components/Crest";
import { Container } from "@/components/ui/container";

const cols: [string, [string, string][]][] = [
  ["Jelajahi", [["Kajian", "/kajian"], ["Peta Dakwah", "/peta"], ["Catatan", "/catatan"], ["Perpustakaan", "/perpustakaan"]]],
  ["Umat", [["Daftarkan Lembaga", "/gabung"], ["Tanya Ustadz", "/tanya-ustadz"], ["Kelas Online", "/kelas"], ["Donasi", "/donasi"], ["Lapak UMKM", "/lapak"]]],
  ["Tentang", [["Profil", "/tentang"], ["Partner & Media", "/partner"], ["Keuangan", "/keuangan"], ["Kontak", "/kontak"]]],
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-brand-900 text-[#cfc8b4]">
      <div className="pat-trellis-light absolute inset-0" />
      <Container className="relative z-10 grid grid-cols-2 gap-8 py-14 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <Crest className="h-9 w-9" />
            <b className="font-kufi text-[17px] text-white">Blitar Mengaji</b>
          </div>
          <p className="mt-3.5 max-w-[30ch] text-[13px] leading-relaxed text-[#a9a18e]">
            Khidmat digital untuk menghidupkan majelis ilmu di Blitar Raya. Gratis, terbuka, amanah.
          </p>
        </div>
        {cols.map(([heading, links]) => (
          <nav key={heading} aria-label={heading}>
            <h4 className="font-kufi mb-3.5 text-[15px] text-white">{heading}</h4>
            {links.map(([label, href]) => (
              <Link key={href} href={href} className="block py-1 text-[13px] text-[#b9b2a0] transition hover:text-gold-light">
                {label}
              </Link>
            ))}
          </nav>
        ))}
      </Container>
      <div className="relative z-10 border-t border-white/10 py-4 text-center text-xs text-[#9b9483]">
        © 2026 Blitar Mengaji · Khidmat untuk umat di Blitar Raya
      </div>
    </footer>
  );
}
