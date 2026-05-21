import { notFound } from "next/navigation";
import { ArrowLeft, KeyRound, Lock, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { getProviderById } from "@/lib/queries/ai-admin";
import { updateProvider } from "@/lib/actions/ai-providers";

// Edit provider AI — data NYATA dari ai_providers (Neon).
// API key TIDAK PERNAH didekripsi/ditampilkan; field kosong = biarkan key lama.
export const dynamic = "force-dynamic";

export default async function AdminAiProviderEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const provider = await getProviderById(id);
  if (!provider) notFound();

  const hasKey = provider.apiKeyCiphertext != null;

  return (
    <div>
      <AdminPageHeader
        title="Edit Provider AI"
        subtitle="Ubah nama, slug, base URL, docs, atau ganti API key. Kosongkan API key untuk mempertahankan yang lama."
        action={
          <Button href="/admin/ai/providers" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <Card className="p-5">
          <form action={updateProvider} className="space-y-4">
            <input type="hidden" name="id" value={provider.id} />

            <Field label="Nama" htmlFor="name">
              <Input id="name" name="name" defaultValue={provider.name} required />
            </Field>

            <Field
              label="Slug"
              htmlFor="slug"
              hint="Huruf kecil, angka, tanda hubung."
            >
              <Input id="slug" name="slug" defaultValue={provider.slug} required />
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
                defaultValue={provider.baseUrl}
                required
              />
            </Field>

            <Field label="Docs URL (opsional)" htmlFor="docsUrl">
              <Input
                id="docsUrl"
                name="docsUrl"
                type="url"
                defaultValue={provider.docsUrl ?? ""}
                placeholder="https://platform.deepseek.com/docs"
              />
            </Field>

            <Field
              label="API Key"
              htmlFor="apiKey"
              hint={
                hasKey
                  ? "Sudah tersimpan. Kosongkan untuk mempertahankan key lama; isi untuk menggantinya."
                  : "Belum ada key. Isi untuk menambahkannya (akan dienkripsi)."
              }
            >
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                autoComplete="off"
                placeholder={hasKey ? "Biarkan kosong untuk tidak mengubah" : "sk-..."}
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
            <h2 className="display text-lg text-ink">Status Key</h2>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">API Key</span>
              {hasKey ? (
                <Badge tone="success">
                  <KeyRound className="h-3 w-3" /> Key terisi
                </Badge>
              ) : (
                <Badge tone="muted">Tanpa key</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Provider</span>
              {provider.isActive ? (
                <Badge tone="success">Aktif</Badge>
              ) : (
                <Badge tone="muted">Nonaktif</Badge>
              )}
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-sm bg-brand-50/50 p-3 text-[11px] text-ink/70">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
            API key tersimpan terenkripsi AES-256-GCM dan tidak pernah ditampilkan
            kembali untuk alasan keamanan.
          </p>
        </Card>
      </div>
    </div>
  );
}
