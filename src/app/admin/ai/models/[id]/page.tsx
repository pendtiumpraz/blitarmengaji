import { notFound } from "next/navigation";
import { ArrowLeft, BrainCircuit, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { getModelById, listProviderOptions } from "@/lib/queries/ai-admin";
import { updateModel } from "@/lib/actions/ai-models";

// Membaca data langsung dari Neon → jangan di-cache statik.
export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

const KINDS = [
  { value: "chat", label: "Chat" },
  { value: "reasoning", label: "Reasoning" },
  { value: "embedding", label: "Embedding" },
  { value: "vision", label: "Vision" },
  { value: "multimodal", label: "Multimodal" },
] as const;

export default async function EditAiModelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const model = await getModelById(id);
  if (!model) notFound();

  const providers = await listProviderOptions();

  return (
    <div>
      <AdminPageHeader
        title="Ubah Model"
        subtitle="Perbarui detail model AI. Perubahan berlaku untuk seluruh tugas yang menautkan model ini."
        action={
          <Button href="/admin/ai/models" variant="outline">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <div className="max-w-xl">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <BrainCircuit className="h-4 w-4 text-brand-600" /> Detail Model
          </h2>

          <form action={updateModel} className="space-y-4">
            <input type="hidden" name="id" value={model.id} />

            <Field label="Provider" htmlFor="m-provider">
              <select
                id="m-provider"
                name="providerId"
                required
                className={selectCls}
                defaultValue={model.providerId}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="ID Model" htmlFor="m-modelId" hint="Persis seperti dipakai API, mis. deepseek-chat.">
              <Input id="m-modelId" name="modelId" defaultValue={model.modelId} required />
            </Field>

            <Field label="Label" htmlFor="m-label" hint="Nama ramah yang tampil di antarmuka.">
              <Input id="m-label" name="label" defaultValue={model.label} required />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Jenis" htmlFor="m-kind">
                <select id="m-kind" name="kind" defaultValue={model.kind} className={selectCls}>
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
                  defaultValue={model.contextWindow ?? ""}
                  placeholder="64000"
                  inputMode="numeric"
                />
              </Field>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button type="submit">
                <Save className="h-4 w-4" /> Simpan Perubahan
              </Button>
              <Button href="/admin/ai/models" variant="ghost">
                Batal
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
