import { HandHeart, ReceiptText, QrCode, MessageCircle, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { listTitikOptions, listCampaigns } from "@/lib/queries/donasi";
import { createCampaign, addDonationUpdate } from "@/lib/actions/donasi";

export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function AdminDonasiBaruPage() {
  const [titikOptions, campaigns] = await Promise.all([listTitikOptions(), listCampaigns()]);

  return (
    <div>
      <AdminPageHeader
        title="Buat Campaign Donasi"
        subtitle="Buat campaign penggalangan dana per titik dakwah, lalu catat penggunaan dana agar transparan ke jamaah."
        action={
          <Button href="/admin/donasi" variant="ghost">
            Kembali
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ===== Form Campaign ===== */}
        <Card className="p-5 lg:col-span-3">
          <h2 className="display mb-4 flex items-center gap-2 text-base text-ink">
            <HandHeart className="h-5 w-5 text-brand-600" /> Detail Campaign
          </h2>

          {titikOptions.length === 0 ? (
            <div className="rounded-sm border border-dashed border-line bg-brand-50/40 px-4 py-8 text-center">
              <p className="text-sm font-bold text-ink">Belum ada titik dakwah</p>
              <p className="mt-1 text-sm text-muted">
                Tambahkan titik dakwah terlebih dahulu sebelum membuat campaign donasi.
              </p>
              <Button href="/admin/titik/baru" variant="outline" size="sm" className="mt-4">
                Tambah Titik Dakwah
              </Button>
            </div>
          ) : (
            <form action={createCampaign} encType="multipart/form-data" className="space-y-4">
              <Field label="Judul campaign" htmlFor="title">
                <Input id="title" name="title" required placeholder="Mis. Renovasi Tempat Wudhu & MCK" />
              </Field>

              <Field label="Slug (URL)" htmlFor="slug" hint="Huruf kecil, angka, dan tanda hubung. Mis. renovasi-wudhu-al-falah">
                <Input id="slug" name="slug" required placeholder="renovasi-wudhu-al-falah" />
              </Field>

              <Field label="Titik dakwah" htmlFor="titikDakwahId">
                <select id="titikDakwahId" name="titikDakwahId" required className={selectCls} defaultValue="">
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
                  <Input id="targetAmount" name="targetAmount" inputMode="numeric" placeholder="30000000" />
                </div>
              </Field>

              <Field label="Deskripsi" htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className={textareaCls}
                  placeholder="Jelaskan tujuan dan rencana penggunaan dana…"
                />
              </Field>

              <FileUpload name="posterFile" accept="image/*" label="Poster campaign" />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Tanggal mulai" htmlFor="startAt">
                  <Input id="startAt" name="startAt" type="date" />
                </Field>
                <Field label="Tanggal selesai" htmlFor="endAt">
                  <Input id="endAt" name="endAt" type="date" />
                </Field>
              </div>

              <FileUpload name="qrisFile" accept="image/*" label="Gambar QRIS (unggah)" />

              <Field
                label="Gambar QRIS (URL)"
                htmlFor="qrisImage"
                hint="Opsional — dipakai bila tidak mengunggah berkas QRIS di atas."
              >
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 shrink-0 text-muted" />
                  <Input id="qrisImage" name="qrisImage" type="url" placeholder="https://…/qris.png" />
                </div>
              </Field>

              <Field
                label="Kontak / WhatsApp (URL)"
                htmlFor="contactLink"
                hint="Opsional — tautan wa.me untuk konfirmasi donasi."
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 shrink-0 text-muted" />
                  <Input id="contactLink" name="contactLink" type="url" placeholder="https://wa.me/62…" />
                </div>
              </Field>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button href="/admin/donasi" variant="outline" type="button">
                  Batal
                </Button>
                <Button type="submit" variant="gold">
                  Simpan Campaign
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* ===== Tambah Laporan Penggunaan Dana ===== */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h2 className="display mb-3 flex items-center gap-2 text-base text-ink">
              <ReceiptText className="h-5 w-5 text-brand-600" /> Tambah Laporan Penggunaan Dana
            </h2>

            {campaigns.length === 0 ? (
              <p className="rounded-sm bg-brand-50/40 px-3 py-6 text-center text-sm text-muted">
                Belum ada campaign. Buat campaign dulu untuk menambahkan laporan penggunaan dana.
              </p>
            ) : (
              <form action={addDonationUpdate} encType="multipart/form-data" className="space-y-3">
                <Field label="Campaign" htmlFor="campaignId">
                  <select id="campaignId" name="campaignId" required className={selectCls} defaultValue="">
                    <option value="" disabled>
                      Pilih campaign…
                    </option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Judul laporan" htmlFor="upd-title">
                  <Input id="upd-title" name="title" required placeholder="Mis. Pembelian keramik & semen" />
                </Field>
                <Field label="Keterangan" htmlFor="upd-body">
                  <textarea
                    id="upd-body"
                    name="body"
                    rows={3}
                    className={textareaCls}
                    placeholder="Rincian penggunaan dana…"
                  />
                </Field>
                <Field label="Jumlah dipakai" htmlFor="amountUsed">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted">Rp</span>
                    <Input id="amountUsed" name="amountUsed" inputMode="numeric" placeholder="7200000" />
                  </div>
                </Field>
                <FileUpload
                  name="attachmentFile"
                  accept="image/*,application/pdf,.pdf"
                  label="Bukti/Nota (unggah)"
                />
                <Field
                  label="Lampiran nota (URL)"
                  htmlFor="attachmentUrl"
                  hint="Opsional — dipakai bila tidak mengunggah berkas di atas."
                >
                  <Input id="attachmentUrl" name="attachmentUrl" type="url" placeholder="https://…/nota.pdf" />
                </Field>
                <Button type="submit" variant="gold" className="w-full">
                  <Plus className="h-4 w-4" /> Tambah Laporan
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
