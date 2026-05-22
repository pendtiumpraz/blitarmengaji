import { Lock, Plus, ShieldCheck } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listAiProviders } from "@/lib/queries/ai-admin";
import {
  createProvider,
  softDeleteProvider,
  toggleProviderActive,
} from "@/lib/actions/ai-providers";

// Modul Provider AI (admin) — data NYATA dari tabel ai_providers (Neon).
// API key disimpan TERENKRIPSI (AES-256-GCM) & tidak pernah ditampilkan kembali.
export const dynamic = "force-dynamic";

const columns: Column[] = [
  { key: "id", label: "ID", type: "code" },
  { key: "name", label: "Nama", sortable: true },
  { key: "baseUrl", label: "Base URL", type: "code" },
  { key: "hasKey", label: "API Key", type: "bool" },
  { key: "isActive", label: "Aktif", type: "bool", sortable: true },
];

export default async function AdminAiProvidersPage() {
  const providers = await listAiProviders();
  const rows = providers.map((p) => ({
    id: p.id,
    name: p.name,
    baseUrl: p.baseUrl,
    hasKey: p.hasKey,
    isActive: p.isActive,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Provider AI"
        subtitle="Kelola penyedia model AI (endpoint OpenAI-compatible) beserta API key-nya. API key disimpan terenkripsi AES-256-GCM dan tidak pernah ditampilkan kembali."
      />

      {/* Catatan keamanan */}
      <Card className="mb-5 flex items-start gap-3 bg-brand-50/50 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-brand-600 text-white">
          <Lock className="h-4 w-4" />
        </span>
        <p className="text-sm text-ink/80">
          <span className="font-bold text-ink">Keamanan:</span> API key dienkripsi
          dengan AES-256-GCM sebelum disimpan ke database. Plaintext tidak pernah
          dikirim ke browser maupun ditampilkan kembali — hanya didekripsi di server
          saat memanggil model AI.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* Form tambah provider */}
        <Card className="h-fit p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand-600" />
            <h2 className="display text-lg text-ink">Tambah Provider</h2>
          </div>

          <form action={createProvider} className="space-y-4">
            <Field label="Nama" htmlFor="name" hint="Mis. “DeepSeek”.">
              <Input id="name" name="name" placeholder="Nama provider" required />
            </Field>

            <Field label="Slug" htmlFor="slug" hint="Huruf kecil, angka, tanda hubung. Mis. “deepseek”.">
              <Input id="slug" name="slug" placeholder="deepseek" required />
            </Field>

            <Field
              label="Base URL"
              htmlFor="baseUrl"
              hint="Endpoint OpenAI-compatible."
            >
              <Input
                id="baseUrl"
                name="baseUrl"
                type="url"
                placeholder="https://api.deepseek.com"
                required
              />
            </Field>

            <Field label="Docs URL (opsional)" htmlFor="docsUrl">
              <Input
                id="docsUrl"
                name="docsUrl"
                type="url"
                placeholder="https://platform.deepseek.com/docs"
              />
            </Field>

            <Field
              label="API Key (opsional)"
              htmlFor="apiKey"
              hint="Akan dienkripsi & tidak ditampilkan lagi setelah disimpan. Bisa diisi belakangan."
            >
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                autoComplete="off"
                placeholder="sk-..."
              />
            </Field>

            <Button type="submit" className="w-full">
              <ShieldCheck className="h-4 w-4" />
              Simpan Provider
            </Button>
          </form>
        </Card>

        {/* Daftar provider */}
        <DataTable
          columns={columns}
          rows={rows}
          editBase="/admin/ai/providers"
          deleteAction={softDeleteProvider}
          deleteConfirmText="Provider akan dihapus (soft delete)."
          rowActions={[
            {
              action: toggleProviderActive,
              label: "Toggle",
            },
          ]}
          emptyText="Belum ada provider AI."
        />
      </div>
    </div>
  );
}
