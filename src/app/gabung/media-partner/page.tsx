import { Radio, Send } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { SectionHeading } from "@/components/ui/section-heading";
import { registerMediaPartner } from "@/lib/actions/registrasi-partner";

export const dynamic = "force-dynamic";

export default function GabungMediaPartnerPage() {
  return (
    <Container className="max-w-2xl py-10">
      <SectionHeading
        align="left"
        eyebrow="Ukhuwah & Sinergi"
        title="Daftar Media Partner"
        subtitle="Ajukan media dakwah Anda untuk bersinergi menyiarkan kajian dan kebaikan di Blitar Raya. Pengajuan akan ditinjau pengelola sebelum tampil."
        className="mb-8"
      />

      <form action={registerMediaPartner} className="space-y-5">
        <Card className="p-6">
          <div className="flex items-center gap-2 text-brand-600">
            <Radio className="h-5 w-5" />
            <h2 className="display text-lg text-ink">Profil Media</h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Lengkapi data media partner. Logo diunggah ke penyimpanan dan tampil di direktori
            setelah disetujui.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Nama media" htmlFor="name">
              <Input
                id="name"
                name="name"
                placeholder="Mis. Radio Dakwah Blitar"
                required
                minLength={3}
                maxLength={255}
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="slug"
              hint="Alamat unik di direktori, mis. radio-dakwah-blitar. Hanya huruf, angka, dan strip."
            >
              <Input
                id="slug"
                name="slug"
                placeholder="radio-dakwah-blitar"
                required
                minLength={3}
                maxLength={255}
              />
            </Field>

            <Field
              label="Website"
              htmlFor="website"
              hint="Opsional. Sertakan https:// di depan, mis. https://radiodakwah.id."
            >
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://radiodakwah.id"
                maxLength={255}
              />
            </Field>

            <Field label="Deskripsi" htmlFor="description" hint="Opsional. Ceritakan fokus dakwah media Anda.">
              <textarea
                id="description"
                name="description"
                rows={4}
                maxLength={2000}
                placeholder="Jelaskan profil dan jangkauan media partner Anda…"
                className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </Field>

            <FileUpload name="logo" accept="image/*" label="Logo media (opsional)" />
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
