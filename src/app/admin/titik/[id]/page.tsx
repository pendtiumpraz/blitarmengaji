import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { PickerMap } from "@/components/map/picker-map";
import type { TitikMarker } from "@/components/map/map-view";
import { getTitikById, listTitik } from "@/lib/queries/titik";
import { updateTitik } from "@/lib/actions/titik";

export const dynamic = "force-dynamic";

export default async function AdminTitikEdit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const titik = await getTitikById(id);
  if (!titik) notFound();

  // Titik lain (yang punya koordinat) sebagai referensi pin di peta — kecuali titik ini sendiri.
  const all = await listTitik();
  const existing: TitikMarker[] = all
    .filter((t) => t.id !== titik.id && t.latitude != null && t.longitude != null)
    .map((t) => ({
      slug: t.slug,
      name: t.name,
      kecamatan: t.kecamatan ?? undefined,
      lat: Number(t.latitude),
      lng: Number(t.longitude),
      gmapsUrl: t.gmapsUrl ?? undefined,
    }));

  const initial: [number, number] | undefined =
    titik.latitude != null && titik.longitude != null
      ? [Number(titik.latitude), Number(titik.longitude)]
      : undefined;

  return (
    <div>
      <AdminPageHeader
        title="Ubah Titik Dakwah"
        subtitle={`Perbarui data untuk ${titik.name}.`}
        action={
          <Button href="/admin/titik" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <form action={updateTitik} className="space-y-5">
        <input type="hidden" name="id" value={titik.id} />

        {/* Identitas titik */}
        <Card className="p-6">
          <h2 className="display text-lg text-ink">Identitas Titik</h2>
          <p className="mt-1 text-sm text-muted">Informasi dasar tempat dakwah.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nama titik" htmlFor="name">
                <Input id="name" name="name" placeholder="Mis. Masjid Al-Falah" defaultValue={titik.name} required />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Slug" htmlFor="slug" hint="Untuk alamat URL, mis. masjid-al-falah (huruf kecil, tanpa spasi).">
                <Input id="slug" name="slug" placeholder="masjid-al-falah" defaultValue={titik.slug} required />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Alamat lengkap" htmlFor="address">
                <Input id="address" name="address" placeholder="Jl. Merdeka No. 12" defaultValue={titik.address ?? ""} />
              </Field>
            </div>
            <Field label="Kelurahan" htmlFor="kelurahan">
              <Input id="kelurahan" name="kelurahan" placeholder="Mis. Kepanjenkidul" defaultValue={titik.kelurahan ?? ""} />
            </Field>
            <Field label="Kecamatan" htmlFor="kecamatan">
              <Input id="kecamatan" name="kecamatan" placeholder="Mis. Kepanjenkidul" defaultValue={titik.kecamatan ?? ""} />
            </Field>
          </div>
        </Card>

        {/* Kontak */}
        <Card className="p-6">
          <h2 className="display text-lg text-ink">Kontak</h2>
          <p className="mt-1 text-sm text-muted">Nomor & email yang bisa dihubungi jamaah.</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Telepon / WhatsApp" htmlFor="contact_phone">
              <Input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                inputMode="tel"
                placeholder="08xx xxxx xxxx"
                defaultValue={titik.contactPhone ?? ""}
              />
            </Field>
            <Field label="Email" htmlFor="contact_email">
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                placeholder="titik@email.com"
                defaultValue={titik.contactEmail ?? ""}
              />
            </Field>
          </div>
        </Card>

        {/* Media */}
        <Card className="p-6">
          <h2 className="display text-lg text-ink">Media</h2>
          <p className="mt-1 text-sm text-muted">
            Foto sampul & logo titik (diunggah ke Vercel Blob). Kosongkan untuk mempertahankan berkas lama.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <FileUpload name="coverFile" accept="image/*" label="Cover / Foto" defaultUrl={titik.coverImage} />
            <FileUpload name="logoFile" accept="image/*" label="Logo" defaultUrl={titik.logoUrl} />
          </div>
        </Card>

        {/* Lokasi */}
        <Card className="p-6">
          <h2 className="display flex items-center gap-2 text-lg text-ink">
            <MapPin className="h-5 w-5 text-brand-600" /> Lokasi
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Klik peta atau geser pin untuk <b>memperbarui koordinat</b>, lalu salin <b>link Google Maps</b>. Tersimpan ke kolom{" "}
            <code>latitude</code>, <code>longitude</code>, dan <code>gmaps_url</code> pada <code>titik_dakwah</code>.
          </p>

          <div className="mt-4">
            {/* PickerMap menyuntikkan hidden input latitude / longitude / gmaps_url ke dalam form ini. */}
            <PickerMap
              initial={initial ?? [-8.0954, 112.1609]}
              existing={existing}
              initialGmaps={titik.gmapsUrl ?? ""}
            />
          </div>
        </Card>

        {/* Aksi */}
        <div className="flex flex-wrap justify-end gap-2">
          <Button href="/admin/titik" variant="outline" size="md">
            Batal
          </Button>
          <Button type="submit" size="md">
            <Save className="h-4 w-4" /> Simpan
          </Button>
        </div>
      </form>
    </div>
  );
}
