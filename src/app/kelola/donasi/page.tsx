import { redirect } from "next/navigation";
import {
  HandCoins,
  HeartHandshake,
  PlusCircle,
  Save,
  Trash2,
  FileText,
  Link as LinkIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import {
  myTitikOptions,
  myCampaigns,
  type MyCampaignItem,
} from "@/lib/queries/kelola-donasi";
import { createCampaign, addDonationUpdate, softDeleteCampaign } from "@/lib/actions/donasi";

export const dynamic = "force-dynamic";

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

function StatusBadge({ status }: { status: MyCampaignItem["status"] }) {
  if (status === "completed") return <Badge tone="success">Tercapai</Badge>;
  if (status === "closed") return <Badge tone="muted">Ditutup</Badge>;
  return <Badge tone="brand">Aktif</Badge>;
}

export default async function KelolaDonasiPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const [titikOptions, campaigns] = await Promise.all([
    myTitikOptions(userId),
    myCampaigns(userId),
  ]);

  const hasTitik = titikOptions.length > 0;

  return (
    <div>
      <AdminPageHeader
        title="Kelola Donasi"
        subtitle="Buat dan kelola campaign donasi untuk titik dakwah yang Anda kelola. Campaign langsung tampil di halaman donasi jamaah."
      />

      {!hasTitik ? (
        <Card className="px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <HeartHandshake className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Belum ada titik dakwah</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Anda perlu mengelola minimal satu titik dakwah sebelum dapat membuat campaign donasi. Ajukan titik dakwah ke
            admin terlebih dahulu.
          </p>
          <div className="mt-5">
            <Button href="/kelola" variant="outline">
              Kembali ke Ringkasan
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Daftar campaign milik */}
          <div className="space-y-5">
            {campaigns.length === 0 ? (
              <Card className="px-6 py-16 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <HandCoins className="h-7 w-7" />
                </span>
                <h2 className="display mt-4 text-lg text-ink">Belum ada campaign</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Buat campaign donasi pertama lewat formulir di samping agar jamaah dapat berdonasi untuk titik dakwah
                  Anda.
                </p>
              </Card>
            ) : (
              campaigns.map((c) => (
                <Card key={c.id} className="p-5">
                  <div className="flex items-start gap-4">
                    {c.posterImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.posterImage}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded object-cover"
                      />
                    ) : (
                      <span className="grid h-16 w-16 shrink-0 place-items-center rounded bg-brand-50 text-brand-600">
                        <HandCoins className="h-6 w-6" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-ink">{c.title}</h3>
                        <StatusBadge status={c.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {c.titikName ?? "—"}
                        {c.endAt ? ` · sampai ${dateFmt.format(c.endAt)}` : ""}
                      </p>
                    </div>
                    <form action={softDeleteCampaign} className="shrink-0">
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        aria-label={`Hapus campaign ${c.title}`}
                        title="Hapus"
                        className="text-muted hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-end justify-between text-sm">
                      <span className="font-bold text-ink">{rupiah.format(c.collectedAmount)}</span>
                      <span className="text-xs text-muted">
                        target {c.targetAmount > 0 ? rupiah.format(c.targetAmount) : "—"}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-brand-50"
                      role="progressbar"
                      aria-valuenow={c.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-brand-600 transition-[width]"
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] font-bold text-brand-700">{c.progress}% terkumpul</p>
                  </div>

                  {/* Tambah laporan penggunaan dana */}
                  <details className="mt-4 rounded-sm border border-line bg-cream/50">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm font-bold text-ink">
                      <FileText className="h-4 w-4 text-brand-600" /> Tambah Laporan
                    </summary>
                    <form action={addDonationUpdate} className="space-y-3 px-3 pb-4 pt-1">
                      <input type="hidden" name="campaignId" value={c.id} />
                      <Field label="Judul Laporan" htmlFor={`update-title-${c.id}`}>
                        <Input
                          id={`update-title-${c.id}`}
                          name="title"
                          placeholder="Mis. Pembelian material tahap 1"
                          required
                        />
                      </Field>
                      <Field label="Uraian (opsional)" htmlFor={`update-body-${c.id}`}>
                        <textarea
                          id={`update-body-${c.id}`}
                          name="body"
                          rows={3}
                          placeholder="Rincian penggunaan dana…"
                          className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                        />
                      </Field>
                      <Field
                        label="Dana Terpakai (opsional)"
                        htmlFor={`update-amount-${c.id}`}
                        hint="Tulis angka, mis. 1.500.000"
                      >
                        <Input
                          id={`update-amount-${c.id}`}
                          name="amountUsed"
                          inputMode="numeric"
                          placeholder="0"
                        />
                      </Field>
                      <FileUpload
                        name="attachmentFile"
                        accept="image/*,application/pdf"
                        label="Bukti / Nota (opsional)"
                      />
                      <Button type="submit" variant="outline" size="sm" className="w-full">
                        <Save className="h-4 w-4" /> Simpan Laporan
                      </Button>
                    </form>
                  </details>
                </Card>
              ))
            )}
            {campaigns.length > 0 ? (
              <p className="text-xs text-muted">
                Menampilkan {campaigns.length} campaign aktif. Tombol Hapus melakukan <em>soft delete</em> (masuk
                recycle bin, bukan dihapus permanen).
              </p>
            ) : null}
          </div>

          {/* Form buat campaign */}
          <Card className="p-5">
            <p className="mb-3 flex items-center gap-2 font-bold text-ink">
              <PlusCircle className="h-4 w-4 text-brand-600" /> Buat Campaign Donasi
            </p>
            <form action={createCampaign} className="space-y-4">
              <Field label="Titik Dakwah" htmlFor="titikDakwahId">
                <select id="titikDakwahId" name="titikDakwahId" className={selectCls} defaultValue="" required>
                  <option value="" disabled>
                    Pilih titik milik Anda…
                  </option>
                  {titikOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Judul Campaign" htmlFor="title">
                <Input id="title" name="title" placeholder="Mis. Renovasi Atap Musala" required />
              </Field>

              <Field
                label="Slug (URL)"
                htmlFor="slug"
                hint="Huruf kecil, angka, tanda hubung. Mis. renovasi-atap-musala"
              >
                <Input id="slug" name="slug" placeholder="renovasi-atap-musala" required />
              </Field>

              <Field label="Target Dana" htmlFor="targetAmount" hint="Tulis angka, mis. 30.000.000">
                <Input id="targetAmount" name="targetAmount" inputMode="numeric" placeholder="0" required />
              </Field>

              <Field label="Deskripsi (opsional)" htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Ceritakan kebutuhan dan tujuan donasi…"
                  className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Mulai (opsional)" htmlFor="startAt">
                  <Input id="startAt" name="startAt" type="date" />
                </Field>
                <Field label="Selesai (opsional)" htmlFor="endAt">
                  <Input id="endAt" name="endAt" type="date" />
                </Field>
              </div>

              <Field
                label="Link Kontak (opsional)"
                htmlFor="contactLink"
                hint="WhatsApp/narahubung untuk konfirmasi donasi."
              >
                <div className="flex items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                  <LinkIcon className="h-4 w-4 shrink-0 text-muted" />
                  <input
                    id="contactLink"
                    name="contactLink"
                    type="url"
                    placeholder="https://wa.me/…"
                    className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                  />
                </div>
              </Field>

              <FileUpload name="posterFile" accept="image/*" label="Poster Campaign (opsional)" />
              <FileUpload name="qrisFile" accept="image/*" label="Gambar QRIS (opsional)" />

              <Button type="submit" variant="primary" className="w-full">
                <Save className="h-4 w-4" /> Simpan Campaign
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
