import { Crest } from "@/components/Crest";

/**
 * Layout MINIMAL khusus auth — TANPA header/footer/bottom-nav publik.
 * Desktop: panel kiri brand ber-ornamen (Crest + tagline) + area form di kanan.
 * Mobile: hanya area form yang ditampilkan di tengah.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 bg-cream">
      {/* Panel kiri brand — hanya desktop */}
      <aside className="relative hidden w-[44%] max-w-xl overflow-hidden bg-brand-600 text-cream lg:flex">
        <div className="pat-girih-light absolute inset-0" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <Crest className="h-12 w-12" />
            <span className="display text-xl text-[#FBF4E2]">Blitar Mengaji</span>
          </div>

          <div>
            <p className="font-arabic mb-6 text-3xl leading-[1.9] text-gold-light" dir="rtl">
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </p>
            <h2 className="display max-w-[16ch] text-4xl leading-[1.1] text-[#FBF4E2]">
              Menyalakan <em className="italic text-gold-light">Cahaya Ilmu</em> di Blitar Raya
            </h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-cream/80">
              Satu pintu untuk menemukan majelis ilmu terdekat, bertanya kepada ustadz, belajar di kelas online, dan
              menyimpan jadwal kajianmu.
            </p>
          </div>

          <p className="text-xs uppercase tracking-[0.22em] text-gold-light/80">Assalamu&apos;alaikum · Kota Blitar</p>
        </div>
      </aside>

      {/* Area form di kanan / tengah */}
      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
