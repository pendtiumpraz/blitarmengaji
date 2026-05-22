import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, Lock, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getStorageConfigById } from "@/lib/queries/storage";
import { updateStorageConfig } from "@/lib/actions/storage";

// Edit konfigurasi storage — data NYATA dari storage_configs (Neon).
// Token Blob TIDAK PERNAH didekripsi/ditampilkan; field kosong = biarkan token lama.
export const dynamic = "force-dynamic";

const OWNER_TYPES: { value: string; label: string }[] = [
  { value: "global", label: "Global (platform)" },
  { value: "user", label: "Pengguna" },
  { value: "titik", label: "Titik Dakwah" },
  { value: "media", label: "Media Partner" },
  { value: "partner", label: "Partner Usaha" },
  { value: "ustadz", label: "Ustadz" },
];

export default async function AdminStorageEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const config = await getStorageConfigById(id);
  if (!config) notFound();

  const hasKey = config.hasKey;

  return (
    <div>
      <AdminPageHeader
        title="Edit Konfigurasi Storage"
        subtitle="Ubah label, base URL, pemilik, atau status. Kosongkan token untuk mempertahankan yang lama."
        action={
          <Button href="/admin/storage" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Card className="p-5">
          <form action={updateStorageConfig} className="space-y-4">
            <input type="hidden" name="id" value={config.id} />

            <Field label="Label" htmlFor="label" hint="Mis. “Blob Masjid Al-Falah”.">
              <Input id="label" name="label" defaultValue={config.label ?? ""} required />
            </Field>

            <Field
              label="Base URL (opsional)"
              htmlFor="baseUrl"
              hint="Custom domain/bucket. Kosongkan untuk default."
            >
              <Input
                id="baseUrl"
                name="baseUrl"
                type="url"
                defaultValue={config.baseUrl ?? ""}
                placeholder="https://blob.contoh.com"
              />
            </Field>

            <Field label="Jenis Pemilik" htmlFor="ownerType">
              <select
                id="ownerType"
                name="ownerType"
                defaultValue={config.ownerType}
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
              <Input
                id="ownerId"
                name="ownerId"
                defaultValue={config.ownerId ?? ""}
                placeholder="UUID entitas"
              />
            </Field>

            <Field label="Status" htmlFor="status">
              <select
                id="status"
                name="status"
                defaultValue={config.status}
                className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              >
                <option value="active">Aktif</option>
                <option value="disabled">Nonaktif</option>
              </select>
            </Field>

            <label className="flex items-center gap-2.5 text-sm text-ink">
              <input
                type="checkbox"
                name="isDefault"
                value="1"
                defaultChecked={config.isDefault}
                className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-600/30"
              />
              Jadikan storage default untuk pemilik ini
            </label>

            <Field
              label="Token Vercel Blob"
              htmlFor="token"
              hint={
                hasKey
                  ? "Sudah tersimpan. Kosongkan untuk mempertahankan token lama; isi untuk menggantinya."
                  : "Belum ada token. Isi untuk menambahkannya (akan dienkripsi)."
              }
            >
              <Input
                id="token"
                name="token"
                type="password"
                autoComplete="off"
                placeholder={hasKey ? "Biarkan kosong untuk tidak mengubah" : "vercel_blob_rw_..."}
              />
            </Field>

            <Button type="submit">
              <Save className="h-4 w-4" /> Simpan Perubahan
            </Button>
          </form>
        </Card>

        {/* Ringkasan status */}
        <Card className="h-fit p-5">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand-600" />
            <h2 className="display text-lg text-ink">Status Token</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Token Blob</span>
              {hasKey ? (
                <Badge tone="success">
                  <KeyRound className="h-3 w-3" /> Token terisi
                </Badge>
              ) : (
                <Badge tone="muted">Tanpa token</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Status</span>
              {config.status === "active" ? (
                <Badge tone="success">Aktif</Badge>
              ) : (
                <Badge tone="muted">Nonaktif</Badge>
              )}
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-sm bg-brand-50/50 p-3 text-[11px] text-ink/70">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            Token Blob tersimpan terenkripsi AES-256-GCM dan tidak pernah ditampilkan
            kembali untuk alasan keamanan.
          </p>
        </Card>
      </div>
    </div>
  );
}
