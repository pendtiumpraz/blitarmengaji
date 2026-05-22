"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import {
  Image as ImageIcon,
  Check,
  Database,
  QrCode,
  Globe,
  Banknote,
  Inbox,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { cn } from "@/lib/cn";
import {
  saveSettings,
  savePaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from "@/lib/actions/settings";
import type {
  PaymentMethodRow,
  StorageConfigRow,
  ThemeRow,
} from "@/lib/queries/settings";

/* ============================================================
 * Props — data NYATA dari DB (page server component).
 * ============================================================ */

type Initial = {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactWhatsapp: string;
  defaultTheme: string;
  instagram: string;
  youtube: string;
  facebook: string;
  siteLogo: string;
};

const PROVIDER_LABEL: Record<StorageConfigRow["provider"], string> = {
  vercel_blob: "Vercel Blob",
  s3: "Amazon S3",
  r2: "Cloudflare R2",
  other: "Lainnya",
};

const PAYMENT_TYPE_LABEL: Record<PaymentMethodRow["type"], string> = {
  qris: "QRIS",
  bank: "Transfer Bank",
  ewallet: "E-Wallet",
};

/** Ambil warna dari tokens_json tema (fallback aman). */
function themeColor(tokens: unknown, key: string, fallback: string): string {
  if (tokens && typeof tokens === "object" && key in (tokens as Record<string, unknown>)) {
    const v = (tokens as Record<string, unknown>)[key];
    if (typeof v === "string" && v) return v;
  }
  return fallback;
}

function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/* ============================================================
 * Sub-komponen
 * ============================================================ */

function SectionCard({
  title,
  desc,
  icon: Icon,
  children,
}: {
  title: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 border-b border-line bg-brand-50/40 px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-brand-600 text-white">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="display text-base text-ink">{title}</h2>
          <p className="mt-0.5 text-xs text-muted">{desc}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

/* ============================================================
 * Form utama — branding + tema default disimpan via saveSettings.
 * ============================================================ */

export function SettingsForm({
  initial,
  themes,
  paymentMethods,
  storageConfigs,
}: {
  initial: Initial;
  themes: ThemeRow[];
  paymentMethods: PaymentMethodRow[];
  storageConfigs: StorageConfigRow[];
}) {
  // Tema terpilih: nilai dari settings, fallback ke tema pertama yang tersedia.
  const [theme, setTheme] = useState<string>(
    initial.defaultTheme || themes[0]?.slug || "",
  );

  return (
    <div className="space-y-6">
      {/* ====== Branding + Tema default (1 form -> saveSettings) ====== */}
      <form action={saveSettings} encType="multipart/form-data" className="space-y-6">
        {/* a) Branding & Profil */}
        <SectionCard
          icon={ImageIcon}
          title="Branding & Profil"
          desc="Identitas situs yang tampil di seluruh halaman. (settings)"
        >
          <div className="space-y-4">
            {/* Logo situs — upload NYATA ke Vercel Blob (settings.site_logo). */}
            <div className="flex flex-wrap items-end gap-4">
              {initial.siteLogo ? (
                <div>
                  <p className="mb-1 text-xs font-bold text-muted">Logo saat ini</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={initial.siteLogo}
                    alt="Logo situs"
                    className="h-16 w-16 rounded-sm border border-line bg-cream object-contain p-1"
                  />
                </div>
              ) : null}
              <FileUpload
                name="logoFile"
                accept="image/*"
                label="Logo Situs"
                defaultUrl={initial.siteLogo || null}
                className="min-w-[16rem] flex-1"
              />
            </div>
            <Field label="Nama Situs" htmlFor="site_name">
              <Input
                id="site_name"
                name="site_name"
                defaultValue={initial.siteName}
                placeholder="Blitar Mengaji"
                required
              />
            </Field>
            <Field
              label="Deskripsi Singkat"
              htmlFor="site_description"
              hint="Tampil di meta description & footer."
            >
              <textarea
                id="site_description"
                name="site_description"
                rows={3}
                defaultValue={initial.siteDescription}
                placeholder="Peta dakwah, jadwal kajian, dan ilmu untuk umat di Blitar Raya."
                className={textareaCls}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email Kontak" htmlFor="contact_email">
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  defaultValue={initial.contactEmail}
                  placeholder="halo@blitarmengaji.id"
                />
              </Field>
              <Field label="No. WhatsApp" htmlFor="contact_whatsapp">
                <Input
                  id="contact_whatsapp"
                  name="contact_whatsapp"
                  inputMode="tel"
                  defaultValue={initial.contactWhatsapp}
                  placeholder="0812-3456-7890"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Instagram" htmlFor="instagram">
                <Input id="instagram" name="instagram" defaultValue={initial.instagram} placeholder="@blitarmengaji" />
              </Field>
              <Field label="YouTube" htmlFor="youtube">
                <Input id="youtube" name="youtube" defaultValue={initial.youtube} placeholder="Blitar Mengaji" />
              </Field>
              <Field label="Facebook" htmlFor="facebook">
                <Input id="facebook" name="facebook" defaultValue={initial.facebook} placeholder="Blitar Mengaji" />
              </Field>
            </div>
          </div>
        </SectionCard>

        {/* b) Tema Default — dari ui_themes NYATA */}
        <SectionCard
          icon={Globe}
          title="Tema Default"
          desc="Tema bawaan platform untuk pengunjung baru. (settings.default_theme)"
        >
          {/* nilai tema terpilih dikirim lewat hidden input */}
          <input type="hidden" name="default_theme" value={theme} />
          {themes.length === 0 ? (
            <div className="rounded-sm border border-dashed border-line bg-brand-50/30 px-4 py-8 text-center">
              <Inbox className="mx-auto h-6 w-6 text-muted" />
              <p className="mt-2 text-sm font-bold text-ink">Belum ada tema</p>
              <p className="mt-0.5 text-xs text-muted">Jalankan seed untuk mengisi tema UI bawaan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {themes.map((t) => {
                const active = theme === t.slug;
                const primary = themeColor(t.tokensJson, "--c-brand-600", "#0E6E55");
                const accent = themeColor(t.tokensJson, "--c-gold", "#C9A227");
                const bg = themeColor(t.tokensJson, "--c-cream", "#F7F5EF");
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTheme(t.slug)}
                    className={cn(
                      "relative rounded-sm border-2 p-3 text-left transition-colors",
                      active ? "border-brand-600 ring-2 ring-brand-600/20" : "border-line hover:border-brand-300",
                    )}
                    style={{ background: bg }}
                  >
                    {active ? (
                      <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                    <div className="mb-2 flex gap-1.5">
                      <span className="h-6 w-6 rounded-full" style={{ background: primary }} />
                      <span className="h-6 w-6 rounded-full" style={{ background: accent }} />
                    </div>
                    <p className="text-sm font-bold text-ink">{t.name}</p>
                    <p className="text-[11px] text-muted">/{t.slug}</p>
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted">
            Tema aktif:{" "}
            <span className="font-bold text-brand-700">
              {themes.find((t) => t.slug === theme)?.name ?? "—"}
            </span>
            . Butuh permission <code>settings.manage</code>. Jamaah tetap bisa pilih tema sendiri di Akun.
          </p>
        </SectionCard>

        {/* Aksi simpan branding + tema */}
        <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
          <p className="mr-auto text-[11px] text-muted">
            Disimpan ke tabel <code>settings</code> (key/value) via server action.
          </p>
          <Button type="submit">
            <Check className="h-4 w-4" /> Simpan Pengaturan
          </Button>
        </div>
      </form>

      {/* ====== Metode Pembayaran (form terpisah -> savePaymentMethod) ====== */}
      <SectionCard
        icon={QrCode}
        title="Metode Pembayaran"
        desc="Transfer bank + konfirmasi WhatsApp (manual, tanpa payment gateway). (payment_methods)"
      >
        {paymentMethods.length === 0 ? (
          <div className="rounded-sm border border-dashed border-line bg-brand-50/30 px-4 py-6 text-center">
            <Inbox className="mx-auto h-6 w-6 text-muted" />
            <p className="mt-2 text-sm font-bold text-ink">Belum ada metode pembayaran</p>
            <p className="mt-0.5 text-xs text-muted">Tambahkan metode di bawah untuk donasi & pesanan.</p>
          </div>
        ) : (
          <ul className="mb-5 space-y-2">
            {paymentMethods.map((m) => (
              <li
                key={m.id}
                className="rounded-sm border border-line bg-brand-50/30 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {m.qrisImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.qrisImage}
                        alt="QRIS"
                        className="h-12 w-12 shrink-0 rounded-sm border border-line bg-surface object-contain p-0.5"
                      />
                    ) : (
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-surface text-brand-600 ring-1 ring-line">
                        {m.type === "qris" ? <QrCode className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                      </span>
                    )}
                    <div>
                      <p className="flex items-center gap-2 text-sm font-bold text-ink">
                        {m.bankName ?? PAYMENT_TYPE_LABEL[m.type]}
                        <Badge tone="muted">{PAYMENT_TYPE_LABEL[m.type]}</Badge>
                      </p>
                      <p className="text-xs text-muted">
                        {m.accountNo ? `${m.accountNo}` : "—"}
                        {m.accountName ? ` · a.n. ${m.accountName}` : ""}
                        {m.waNumber ? ` · WA ${m.waNumber}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={m.isActive ? "success" : "muted"}>{m.isActive ? "Aktif" : "Nonaktif"}</Badge>
                    <form action={deletePaymentMethod}>
                      <input type="hidden" name="id" value={m.id} />
                      <button
                        type="submit"
                        title="Hapus metode"
                        aria-label="Hapus metode"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Inline form ubah metode pembayaran (updatePaymentMethod) */}
                <details className="mt-2">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-bold text-brand-700 [&::-webkit-details-marker]:hidden">
                    <Pencil className="h-3.5 w-3.5" /> Ubah detail metode ini
                  </summary>
                  <form
                    action={updatePaymentMethod}
                    encType="multipart/form-data"
                    className="mt-3 space-y-3 border-t border-line pt-3"
                  >
                    <input type="hidden" name="id" value={m.id} />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Nama Bank" htmlFor={`bank_name-${m.id}`}>
                        <Input
                          id={`bank_name-${m.id}`}
                          name="bank_name"
                          defaultValue={m.bankName ?? ""}
                          placeholder="mis. BSI"
                        />
                      </Field>
                      <Field label="No. Rekening" htmlFor={`account_no-${m.id}`}>
                        <Input
                          id={`account_no-${m.id}`}
                          name="account_no"
                          inputMode="numeric"
                          defaultValue={m.accountNo ?? ""}
                          placeholder="000-000-0000"
                        />
                      </Field>
                      <Field label="Atas Nama" htmlFor={`account_name-${m.id}`}>
                        <Input
                          id={`account_name-${m.id}`}
                          name="account_name"
                          defaultValue={m.accountName ?? ""}
                          placeholder="Yayasan Blitar Mengaji"
                        />
                      </Field>
                    </div>
                    <Field
                      label="No. WhatsApp Konfirmasi"
                      htmlFor={`wa_number-${m.id}`}
                      hint="Pembayar klik wa.me prefilled untuk konfirmasi manual."
                    >
                      <Input
                        id={`wa_number-${m.id}`}
                        name="wa_number"
                        inputMode="tel"
                        defaultValue={m.waNumber ?? ""}
                        placeholder="0812-xxxx-xxxx"
                      />
                    </Field>
                    {/* Re-upload QRIS opsional — kosongkan untuk pertahankan gambar lama. */}
                    <FileUpload
                      name="qrisFile"
                      accept="image/*"
                      label="Ganti Gambar QRIS (opsional)"
                      defaultUrl={m.qrisImage ?? null}
                    />
                    <label className="flex items-center gap-2 text-xs font-bold text-muted">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={m.isActive}
                        className="h-4 w-4 rounded-sm border-line text-brand-600 focus:ring-brand-600/20"
                      />
                      Aktif
                    </label>
                    <div className="flex justify-end">
                      <Button type="submit" variant="outline" size="sm">
                        <Check className="h-4 w-4" /> Simpan Perubahan
                      </Button>
                    </div>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}

        <form
          action={savePaymentMethod}
          encType="multipart/form-data"
          className="space-y-4 border-t border-line pt-4"
        >
          <p className="text-xs font-bold text-muted">Tambah Metode (Transfer Bank / QRIS)</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nama Bank" htmlFor="bank_name">
              <Input id="bank_name" name="bank_name" placeholder="mis. BSI" />
            </Field>
            <Field label="No. Rekening" htmlFor="account_no">
              <Input id="account_no" name="account_no" inputMode="numeric" placeholder="000-000-0000" />
            </Field>
            <Field label="Atas Nama" htmlFor="account_name">
              <Input id="account_name" name="account_name" placeholder="Yayasan Blitar Mengaji" />
            </Field>
          </div>
          <Field
            label="No. WhatsApp Konfirmasi"
            htmlFor="wa_number"
            hint="Pembayar klik wa.me prefilled untuk konfirmasi manual."
          >
            <Input id="wa_number" name="wa_number" inputMode="tel" placeholder="0812-xxxx-xxxx" />
          </Field>
          {/* Gambar QRIS — upload NYATA ke Vercel Blob (payment_methods.qris_image). */}
          <FileUpload name="qrisFile" accept="image/*" label="Gambar QRIS" />
          <div className="flex justify-end">
            <Button type="submit" variant="outline" size="sm">
              <Banknote className="h-4 w-4" /> Tambah Metode
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* ====== Storage (read-only list) ====== */}
      <SectionCard
        icon={Database}
        title="Penyimpanan (Storage)"
        desc="Konfigurasi Blob per-entitas; fallback ke default global. (storage_configs)"
      >
        {storageConfigs.length === 0 ? (
          <div className="rounded-sm border border-dashed border-line bg-brand-50/30 px-4 py-6 text-center">
            <Inbox className="mx-auto h-6 w-6 text-muted" />
            <p className="mt-2 text-sm font-bold text-ink">Belum ada konfigurasi storage</p>
            <p className="mt-0.5 text-xs text-muted">Jalankan seed untuk membuat storage global default.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {storageConfigs.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-line bg-brand-50/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-surface text-brand-600 ring-1 ring-line">
                    <Database className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="flex items-center gap-2 text-sm font-bold text-ink">
                      {s.label ?? "Tanpa label"}
                      {s.isDefault ? <Badge tone="gold">Default global</Badge> : null}
                    </p>
                    <p className="text-xs text-muted">
                      {PROVIDER_LABEL[s.provider]} · {formatBytes(s.bytesUsed)} terpakai
                    </p>
                  </div>
                </div>
                <Badge tone={s.status === "active" ? "success" : "muted"}>
                  {s.status === "active" ? "Aktif" : "Nonaktif"}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 max-w-md text-[11px] text-muted">
          Token store disimpan terenkripsi (AES-256-GCM via <code>STORAGE_ENC_KEY</code>) dan{" "}
          <strong>tidak pernah</strong> dikirim ke client. Upload selalu lewat server.
        </p>
      </SectionCard>
    </div>
  );
}
