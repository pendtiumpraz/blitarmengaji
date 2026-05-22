import { PlusCircle, ServerCog } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listAiModels, listProviderOptions } from "@/lib/queries/ai-admin";
import {
  createModel,
  softDeleteModel,
  toggleModelActive,
} from "@/lib/actions/ai-models";

// Halaman ini membaca data langsung dari Neon → jangan di-cache statik.
export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

type ModelKind = "chat" | "reasoning" | "embedding" | "vision" | "multimodal";

const KINDS: { value: ModelKind; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "reasoning", label: "Reasoning" },
  { value: "embedding", label: "Embedding" },
  { value: "vision", label: "Vision" },
  { value: "multimodal", label: "Multimodal" },
];

const KIND_LABEL: Record<ModelKind, string> = {
  chat: "Chat",
  reasoning: "Reasoning",
  embedding: "Embedding",
  vision: "Vision",
  multimodal: "Multimodal",
};

const columns: Column[] = [
  { key: "id", label: "ID", type: "code" },
  { key: "providerName", label: "Provider", sortable: true, filter: true },
  { key: "modelId", label: "ID Model", type: "code" },
  { key: "label", label: "Label", sortable: true },
  { key: "kind", label: "Jenis", type: "badge", sortable: true, filter: true },
  { key: "isActive", label: "Aktif", type: "bool", sortable: true },
];

export default async function AdminAiModelsPage() {
  const [models, providers] = await Promise.all([listAiModels(), listProviderOptions()]);
  const rows = models.map((m) => ({
    id: m.id,
    providerName: m.providerName,
    modelId: m.modelId,
    label: m.label,
    kind: KIND_LABEL[m.kind as ModelKind] ?? m.kind,
    isActive: m.isActive,
    // toggleModelActive butuh nilai status saat ini ("true"/"false") → dibalik di server.
    current: String(m.isActive),
  }));

  return (
    <div>
      <AdminPageHeader
        title="Model AI"
        subtitle="Daftar model per provider yang dapat dipakai untuk chat, reasoning, embedding, maupun visi. Aktifkan model yang siap dipakai lalu tautkan ke tugas."
        action={
          <Button href="/admin/ai/providers" variant="outline">
            <ServerCog className="h-4 w-4" /> Kelola Provider
          </Button>
        }
      />

      {providers.length === 0 ? (
        // Empty state: model selalu menempel pada provider — arahkan ke halaman provider dulu.
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <ServerCog className="h-7 w-7 text-brand-600" />
          </span>
          <p className="display text-lg text-ink">Belum ada provider</p>
          <p className="max-w-md text-sm text-muted">
            Setiap model AI menempel pada sebuah provider (mis. DeepSeek). Tambahkan provider lebih
            dulu, lalu kembali ke sini untuk mendaftarkan modelnya.
          </p>
          <Button href="/admin/ai/providers" variant="primary" className="mt-1">
            <PlusCircle className="h-4 w-4" /> Tambah Provider
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Form tambah model (kiri) */}
          <div className="lg:col-span-2">
            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
                <PlusCircle className="h-4 w-4 text-brand-600" /> Tambah Model
              </h2>

              <form action={createModel} className="space-y-4">
                <Field label="Provider" htmlFor="m-provider">
                  <select id="m-provider" name="providerId" required className={selectCls} defaultValue="">
                    <option value="" disabled>
                      Pilih provider…
                    </option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="ID Model" htmlFor="m-modelId" hint="Persis seperti dipakai API, mis. deepseek-chat.">
                  <Input id="m-modelId" name="modelId" placeholder="deepseek-chat" required />
                </Field>

                <Field label="Label" htmlFor="m-label" hint="Nama ramah yang tampil di antarmuka.">
                  <Input id="m-label" name="label" placeholder="DeepSeek Chat" required />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jenis" htmlFor="m-kind">
                    <select id="m-kind" name="kind" defaultValue="chat" className={selectCls}>
                      {KINDS.map((k) => (
                        <option key={k.value} value={k.value}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Context Window" htmlFor="m-context" hint="Token (opsional).">
                    <Input
                      id="m-context"
                      name="contextWindow"
                      type="number"
                      min={1}
                      placeholder="64000"
                      inputMode="numeric"
                    />
                  </Field>
                </div>

                <Button type="submit" className="w-full">
                  <PlusCircle className="h-4 w-4" /> Simpan Model
                </Button>
              </form>
            </Card>
          </div>

          {/* Tabel model (kanan) */}
          <div className="lg:col-span-3">
            <DataTable
              columns={columns}
              rows={rows}
              editBase="/admin/ai/models"
              deleteAction={softDeleteModel}
              deleteConfirmText="Model akan dipindah ke recycle bin (soft delete)."
              rowActions={[
                {
                  action: toggleModelActive,
                  label: "Toggle",
                  fields: ["current"],
                },
              ]}
              emptyText="Belum ada model."
            />
          </div>
        </div>
      )}
    </div>
  );
}
