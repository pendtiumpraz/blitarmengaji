import { notFound } from "next/navigation";
import { HandHeart, QrCode, MessageCircle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { getCampaignById, listTitikOptions } from "@/lib/queries/donasi";
import { updateCampaign } from "@/lib/actions/donasi";

export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

/** Format Date → "yyyy-mm-dd" untuk nilai default <input type="date">. */
function toDateInput(d: Date | null): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function AdminDonasiEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [campaign, titikOptions] = await Promise.all([
    getCampaignById(id),
    listTitikOptions(),
  ]);

  if (!campaign) notFound();

  const targetValue = campaign.targetAmount ? String(Math.round(Number(campaign.targetAmount))) : "";

  return (
    <div>
      <AdminPageHeader
        title="Edit Campaign Donasi"
        subtitle="Perbarui detail campaign penggalangan dana. Berkas lama dipertahankan bila tidak mengunggah yang baru."
        action={
          <Button href="/admin/donasi" variant="ghost">
            Kembali
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h2 className="display mb-4 flex items-center gap-2 text-base text-ink">
            <HandHeart className="h-5 w-5 text-brand-600" /> Detail Campaign
          </h2>

          <form action={updateCampaign} encType="multipart/form-data" className="space-y-4">
            <input type="hidden" name="id" value={campaign.id} />

            <Field label="Judul campaign" htmlFor="title">
              <Input
                id="title"
                name="title"
                required
                defaultValue={campaign.title}
                placeholder="Mis. Renovasi Tempat Wudhu & MCK"
              />
            </Field>

            <Field
              label="Slug (URL)"
              htmlFor="slug"
              hint="Huruf kecil, angka, dan tanda hubung. Mis. renovasi-wudhu-al-falah"
            >
              <Input
                id="slug"
                name="slug"
                required
                defaultValue={campaign.slug}
                placeholder="renovasi-wudhu-al-falah"
              />
            </Field>

            <Field label="Titik dakwah" htmlFor="titikDakwahId">
              <select
                id="titikDakwahId"
                name="titikDakwahId"
                required
                className={selectCls}
                defaultValue={campaign.titikDakwahId}
              >
                <option value="" disabled>
                  Pilih titik dakwah…
                </option>
                {titikOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.kecamatan ? ` · ${t.kecamatan}` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Target donasi" htmlFor="targetAmount" hint="Nominal dalam Rupiah.">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-muted">Rp</span>
                <Input
                  id="targetAmount"
                  name="targetAmount"
                  inputMode="numeric"
                  defaultValue={targetValue}
                  placeholder="30000000"
                />
              </div>
            </Field>

            <Field label="Deskripsi" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={4}
                className={textareaCls}
                defaultValue={campaign.description ?? ""}
                placeholder="Jelaskan tujuan dan rencana penggunaan dana…"
              />
            </Field>

            <FileUpload
              name="posterFile"
              accept="image/*"
              label="Poster campaign"
              defaultUrl={campaign.posterImage}
            />

            <div className="grid grid-cols-2 gap-3">
              <Field label="Tanggal mulai" htmlFor="startAt">
                <Input id="startAt" name="startAt" type="date" defaultValue={toDateInput(campaign.startAt)} />
              </Field>
              <Field label="Tanggal selesai" htmlFor="endAt">
                <Input id="endAt" name="endAt" type="date" defaultValue={toDateInput(campaign.endAt)} />
              </Field>
            </div>

            <Field label="Status" htmlFor="status">
              <select id="status" name="status" className={selectCls} defaultValue={campaign.status}>
                <option value="active">Aktif</option>
                <option value="completed">Selesai</option>
                <option value="closed">Ditutup</option>
              </select>
            </Field>

            <FileUpload
              name="qrisFile"
              accept="image/*"
              label="Gambar QRIS (unggah)"
              defaultUrl={campaign.qrisImage}
            />

            <Field
              label="Gambar QRIS (URL)"
              htmlFor="qrisImage"
              hint="Opsional — dipakai bila tidak mengunggah berkas QRIS baru."
            >
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 shrink-0 text-muted" />
                <Input
                  id="qrisImage"
                  name="qrisImage"
                  type="url"
                  defaultValue={campaign.qrisImage ?? ""}
                  placeholder="https://…/qris.png"
                />
              </div>
            </Field>

            <Field
              label="Kontak / WhatsApp (URL)"
              htmlFor="contactLink"
              hint="Opsional — tautan wa.me untuk konfirmasi donasi."
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 shrink-0 text-muted" />
                <Input
                  id="contactLink"
                  name="contactLink"
                  type="url"
                  defaultValue={campaign.contactLink ?? ""}
                  placeholder="https://wa.me/62…"
                />
              </div>
            </Field>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button href="/admin/donasi" variant="outline" type="button">
                Batal
              </Button>
              <Button type="submit" variant="gold">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h2 className="display mb-2 flex items-center gap-2 text-base text-ink">
              <HandHeart className="h-5 w-5 text-brand-600" /> Ringkasan
            </h2>
            <p className="text-sm text-muted">
              Titik dakwah: <span className="font-bold text-ink">{campaign.titikName ?? "—"}</span>
              {campaign.kecamatan ? ` · ${campaign.kecamatan}` : ""}
            </p>
            <p className="mt-2 text-sm text-muted">
              Terkumpul:{" "}
              <span className="font-bold text-brand-700">
                Rp {Number(campaign.collectedAmount ?? 0).toLocaleString("id-ID")}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-muted">URL publik: /donasi/{campaign.slug}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
