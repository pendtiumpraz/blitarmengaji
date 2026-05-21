import { Smartphone, Download, ShieldCheck, Globe } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = { title: "Unduh Aplikasi (APK)" };

export default function UnduhApkPage() {
  const apkUrl = process.env.NEXT_PUBLIC_APK_URL;

  const steps = [
    "Ketuk tombol Unduh APK di atas — berkas .apk akan tersimpan di HP.",
    "Buka berkas; bila diminta, izinkan “Instal dari sumber tak dikenal” untuk browser Anda.",
    "Ketuk Instal, lalu buka aplikasi Blitar Mengaji dari layar utama.",
  ];

  return (
    <Container className="py-10">
      <SectionHeading
        align="left"
        eyebrow="Aplikasi"
        title="Unduh Aplikasi Blitar Mengaji"
        subtitle="Pasang di HP Android untuk akses lebih cepat — kajian, jadwal, peta, donasi, dalam genggaman."
        className="mb-6"
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-600 text-white">
              <Smartphone className="h-7 w-7" />
            </span>
            <div>
              <p className="display text-xl text-ink">Blitar Mengaji untuk Android</p>
              <p className="text-sm text-muted">Aplikasi resmi (APK) — gratis.</p>
            </div>
          </div>

          {apkUrl ? (
            <a
              href={apkUrl}
              download
              className="mt-5 inline-flex items-center gap-2 rounded-sm bg-brand-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
            >
              <Download className="h-5 w-5" /> Unduh APK
            </a>
          ) : (
            <div className="mt-5 rounded-sm border border-dashed border-line bg-cream px-4 py-3 text-sm text-muted">
              APK akan segera tersedia. Untuk sementara, Anda bisa <strong className="text-ink">memasang sebagai PWA</strong>:
              buka menu browser → <em>Tambahkan ke Layar Utama</em>.
            </div>
          )}

          <ol className="mt-6 space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-ink">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                  {i + 1}
                </span>
                <span className="text-muted">{s}</span>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-sm font-bold text-ink">Aman & ringan</p>
            <p className="mt-1 text-xs text-muted">
              Aplikasi membungkus situs resmi (TWA) — konten selalu terbaru, tanpa unduh ulang tiap pembaruan.
            </p>
          </Card>
          <Card className="p-5">
            <Globe className="h-5 w-5 text-brand-600" />
            <p className="mt-2 text-sm font-bold text-ink">Tetap bisa lewat browser</p>
            <p className="mt-1 text-xs text-muted">
              Tak ingin pasang? Semua fitur tetap jalan di browser HP/komputer.
            </p>
          </Card>
        </div>
      </div>
    </Container>
  );
}
