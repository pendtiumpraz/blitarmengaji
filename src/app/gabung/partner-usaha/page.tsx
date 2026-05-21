import { Send, Store } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { SectionHeading } from "@/components/ui/section-heading";
import { registerBusinessPartner } from "@/lib/actions/registrasi-partner";

export const dynamic = "force-dynamic";

export default function GabungPartnerUsahaPage() {
  return (
    <Container className="max-w-2xl py-10">
      <SectionHeading
        align="left"
        eyebrow="Ukhuwah & Sinergi"
        title="Daftar Partner Usaha"
        subtitle="Daftarkan usaha jamaah Anda untuk bergabung di lapak dan direktori usaha Blitar Raya. Pengajuan akan ditinjau pengelola sebelum tampil."
        className="mb-8"
      />

      <form action={registerBusinessPartner} className="space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-brand-600">
            <Store className="h-5 w-5" />
            <h2 className="display text-lg text-ink">Profil Usaha</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Lengkapi data usaha Anda. Logo diunggah ke penyimpanan dan tampil di direktori setelah
            disetujui.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Nama usaha" htmlFor="name">
              <Input
                id="name"
                name="name"
                placeholder="Mis. Toko Kurma Barokah"
                required
                minLength={3}
                maxLength={255}
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="slug"
              hint="Alamat unik di direktori, mis. toko-kurma-barokah. Hanya huruf, angka, dan strip."
            >
              <Input
                id="slug"
                name="slug"
                placeholder="toko-kurma-barokah"
                required
                minLength={3}
                maxLength={255}
              />
            </Field>

            <Field
              label="Kategori"
              htmlFor="category"
              hint="Opsional. Mis. Kuliner, Busana Muslim, Jasa."
            >
              <Input
                id="category"
                name="category"
                placeholder="Kuliner"
                maxLength={128}
              />
            </Field>

            <Field
              label="Kontak WhatsApp"
              htmlFor="contactWa"
              hint="Opsional. Nomor WA yang bisa dihubungi, mis. 0812xxxxxxx."
            >
              <Input
                id="contactWa"
                name="contactWa"
                type="tel"
                inputMode="tel"
                placeholder="0812xxxxxxx"
                maxLength={32}
              />
            </Field>

            <Field label="Deskripsi" htmlFor="description" hint="Opsional. Ceritakan produk/jasa usaha Anda.">
              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={2000}
                placeholder="Jelaskan produk atau jasa yang ditawarkan usaha Anda…"
                className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </Field>

            <FileUpload name="logo" accept="image/*" label="Logo usaha (opsional)" />
          </div>
        </Card>

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-gold text-sm font-bold tracking-[0.01em] text-[#241f10] transition-colors hover:bg-gold-light"
        >
          <Send className="h-4 w-4" /> Ajukan Pendaftaran
        </button>

        <p className="text-center text-[11px] text-muted">
          Pengajuan berstatus menunggu (pending) dan akan ditinjau pengelola sebelum tampil di
          direktori.
        </p>
      </form>
    </Container>
  );
}
