import { Crest } from "@/components/Crest";
import { ResetForm } from "./form";

/**
 * Halaman ALUR LUPA SANDI — bagian CONFIRM.
 * Pengguna membuka tautan /atur-ulang/<token> dari email reset.
 * params adalah Promise (Next.js App Router terbaru).
 */
export default async function AturUlangPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="space-y-6">
      {/* Crest + judul */}
      <div className="text-center">
        <Crest className="mx-auto h-16 w-16" />
        <h1 className="display mt-4 text-3xl text-ink">Atur Ulang Kata Sandi</h1>
        <p className="mt-1.5 text-sm text-muted">Buat kata sandi baru untuk akunmu</p>
      </div>

      <ResetForm token={token} />
    </div>
  );
}
