import { redirect } from "next/navigation";
import { ArrowLeft, BadgeCheck, GraduationCap, Send } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card, OrnCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { OrnDivider } from "@/components/ui/orn-divider";
import { auth } from "@/lib/auth";
import { registerUstadz } from "@/lib/actions/registrasi-ustadz";

// Pendaftaran mandiri ustadz — WAJIB login. Data nyata + insert ke DB.
export const dynamic = "force-dynamic";

export default async function GabungUstadzPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/masuk?next=/gabung/ustadz");

  return (
    <Container className="max-w-2xl py-8">
      <Button href="/akun" variant="ghost" size="sm" className="mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Akun
      </Button>

      {/* Sambutan ber-ornamen */}
      <OrnCard className="p-6 sm:p-8">
        <span className="inline-grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
          <GraduationCap className="h-6 w-6" />
        </span>
        <h1 className="display mt-4 text-2xl text-brand-600 sm:text-3xl">Gabung sebagai Ustadz</h1>
        <p className="mt-2 max-w-[54ch] leading-relaxed text-muted">
          Daftarkan diri Anda untuk berbagi ilmu di Blitar Raya: menjawab pertanyaan jamaah,
          mengisi kajian, dan menulis di perpustakaan. Pengajuan Anda akan ditinjau admin sebelum
          diaktifkan.
        </p>
      </OrnCard>

      <OrnDivider className="my-7" />

      <form action={registerUstadz} className="space-y-5">
        {/* Identitas */}
        <Card className="p-6">
          <h2 className="display text-lg text-ink">Identitas</h2>
          <p className="mt-1 text-sm text-muted">Nama yang ditampilkan pada profil & jawaban Anda.</p>

          <div className="mt-5 space-y-4">
            <Field label="Nama lengkap" htmlFor="name">
              <Input id="name" name="name" placeholder="Mis. Ustadz Ahmad Fauzi" required />
            </Field>

            <Field
              label="Slug"
              htmlFor="slug"
              hint="Untuk alamat URL profil, mis. ahmad-fauzi (huruf kecil, tanpa spasi)."
            >
              <Input id="slug" name="slug" placeholder="ahmad-fauzi" required />
            </Field>

            <Field
              label="Bidang / Spesialisasi"
              htmlFor="specialization"
              hint="Opsional. Mis. Fikih, Tafsir, Tahsin Al-Qur'an."
            >
              <Input id="specialization" name="specialization" placeholder="Mis. Fikih & Tahsin" />
            </Field>
          </div>
        </Card>

        {/* Profil */}
        <Card className="p-6">
          <h2 className="display text-lg text-ink">Profil</h2>
          <p className="mt-1 text-sm text-muted">Perkenalan singkat & foto profil (opsional).</p>

          <div className="mt-5 space-y-4">
            <Field label="Bio / Perkenalan" htmlFor="bio" hint="Opsional. Riwayat belajar, pengajian rutin, atau pondok asal.">
              <textarea
                id="bio"
                name="bio"
                rows={4}
                placeholder="Ceritakan singkat tentang Anda…"
                className="w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </Field>

            <FileUpload name="photoFile" accept="image/*" label="Foto profil (opsional)" />
          </div>
        </Card>

        {/* Catatan peninjauan */}
        <div className="flex items-start gap-3 rounded-sm border border-line bg-cream px-4 py-3 text-sm text-muted">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
          <p>
            Pengajuan dibuat dengan status <b className="text-ink">menunggu verifikasi</b>. Tim admin
            akan meninjau sebelum profil Anda aktif.
          </p>
        </div>

        {/* Aksi */}
        <div className="flex flex-wrap justify-end gap-2">
          <Button href="/akun" variant="outline" size="md">
            Batal
          </Button>
          <Button type="submit" size="md">
            <Send className="h-4 w-4" /> Ajukan Pendaftaran
          </Button>
        </div>
      </form>
    </Container>
  );
}
