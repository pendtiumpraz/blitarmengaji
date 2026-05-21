import { Database, HardDrive, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { listStorageConfigs } from "@/lib/queries/storage";
import { createStorageConfig, softDeleteStorageConfig } from "@/lib/actions/storage";

// Modul Storage (admin) — data NYATA dari tabel storage_configs (Neon).
// Token Blob disimpan TERENKRIPSI (AES-256-GCM) & tidak pernah ditampilkan.
export const dynamic = "force-dynamic";

const OWNER_TYPES: { value: string; label: string }[] = [
  { value: "global", label: "Global (platform)" },
  { value: "user", label: "Pengguna" },
  { value: "titik", label: "Titik Dakwah" },
  { value: "media", label: "Media Partner" },
  { value: "partner", label: "Partner Usaha" },
  { value: "ustadz", label: "Ustadz" },
];

const OWNER_LABEL: Record<string, string> = Object.fromEntries(
  OWNER_TYPES.map((o) => [o.value, o.label]),
);

function StatusBadge({ status }: { status: "active" | "disabled" }) {
  return status === "active" ? (
    <Badge tone="success">Aktif</Badge>
  ) : (
    <Badge tone="muted">Nonaktif</Badge>
  );
}

export default async function AdminStoragePage() {
  const configs = await listStorageConfigs();

  return (
    <div>
      <AdminPageHeader
        title="Penyimpanan (Storage)"
        subtitle="Kelola token Vercel Blob per-entitas. Token disimpan terenkripsi AES-256-GCM dan tidak pernah ditampilkan kembali."
      />

      {/* Catatan keamanan */}
      <Card className="mb-5 flex items-start gap-3 bg-brand-50/50 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-brand-600 text-white">
          <Lock className="h-4 w-4" />
        </span>
        <p className="text-sm text-ink/80">
          <span className="font-bold text-ink">Keamanan:</span> token Blob dienkripsi
          dengan AES-256-GCM (kunci <code className="rounded bg-black/5 px-1">STORAGE_ENC_KEY</code>)
          sebelum disimpan ke database. Token plaintext tidak pernah dikirim ke browser
          maupun ditampilkan kembali — hanya didekripsi di server saat mengunggah berkas.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* Form tambah konfigurasi */}
        <Card className="h-fit p-5">
          <div className="mb-4 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-brand-600" />
            <h2 className="display text-lg text-ink">Tambah Konfigurasi</h2>
          </div>

          <form action={createStorageConfig} className="space-y-4">
            <Field label="Label" htmlFor="label" hint="Mis. “Blob Masjid Al-Falah”.">
              <Input id="label" name="label" placeholder="Nama konfigurasi" required />
            </Field>

            <Field
              label="Token Vercel Blob"
              htmlFor="token"
              hint="Akan dienkripsi & tidak ditampilkan lagi setelah disimpan."
            >
              <Input
                id="token"
                name="token"
                type="password"
                autoComplete="off"
                placeholder="vercel_blob_rw_..."
                required
              />
            </Field>

            <Field label="Jenis Pemilik" htmlFor="ownerType">
              <select
                id="ownerType"
                name="ownerType"
                defaultValue="global"
                className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              >
                {OWNER_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="ID Pemilik (opsional)"
              htmlFor="ownerId"
              hint="UUID entitas pemilik. Kosongkan untuk storage global."
            >
              <Input id="ownerId" name="ownerId" placeholder="UUID entitas" />
            </Field>

            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                name="isDefault"
                value="1"
                className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-600/30"
              />
              Jadikan storage default untuk pemilik ini
            </label>

            <Button type="submit" className="w-full">
              <ShieldCheck className="h-4 w-4" />
              Simpan Konfigurasi
            </Button>
          </form>
        </Card>

        {/* Daftar konfigurasi */}
        <div>
          {configs.length === 0 ? (
            <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Database className="h-7 w-7" />
              </span>
              <h2 className="display mt-4 text-lg text-ink">Belum ada konfigurasi storage</h2>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Tambahkan token Vercel Blob pertama. Tanpa konfigurasi, sistem memakai
                token global default dari environment.
              </p>
            </div>
          ) : (
            <>
              <Table className="min-w-[640px]">
                <THead>
                  <TR>
                    <TH>Label</TH>
                    <TH>Provider</TH>
                    <TH>Pemilik</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Aksi</TH>
                  </TR>
                </THead>
                <tbody>
                  {configs.map((c) => (
                    <TR key={c.id} className="hover:bg-brand-50/60">
                      <TD>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">{c.label ?? "—"}</span>
                          {c.isDefault ? <Badge tone="brand">Default</Badge> : null}
                        </div>
                      </TD>
                      <TD className="text-muted">{c.provider}</TD>
                      <TD className="text-ink/80">{OWNER_LABEL[c.ownerType] ?? c.ownerType}</TD>
                      <TD>
                        <StatusBadge status={c.status} />
                      </TD>
                      <TD className="text-right">
                        <form action={softDeleteStorageConfig} className="inline-flex">
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            aria-label={`Hapus ${c.label ?? "konfigurasi"}`}
                            title="Hapus"
                            className="text-muted"
                          >
                            <Trash2 className="h-4 w-4 hover:text-red-600" />
                          </button>
                        </form>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>

              <p className="mt-3 text-[11px] text-muted">
                Menampilkan {configs.length} konfigurasi aktif. Token tersimpan terenkripsi —
                tidak ditampilkan.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
