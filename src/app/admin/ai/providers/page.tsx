import {
  Boxes,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  Power,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { listAiProviders } from "@/lib/queries/ai-admin";
import {
  createProvider,
  softDeleteProvider,
  toggleProviderActive,
} from "@/lib/actions/ai-providers";

// Modul Provider AI (admin) — data NYATA dari tabel ai_providers (Neon).
// API key disimpan TERENKRIPSI (AES-256-GCM) & tidak pernah ditampilkan kembali.
export const dynamic = "force-dynamic";

export default async function AdminAiProvidersPage() {
  const providers = await listAiProviders();

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
        <div>
          {providers.length === 0 ? (
            <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Boxes className="h-7 w-7" />
              </span>
              <h2 className="display mt-4 text-lg text-ink">Belum ada provider AI</h2>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Tambahkan penyedia model AI pertama (mis. DeepSeek) lewat formulir di
                samping untuk mulai menautkan model & task.
              </p>
            </div>
          ) : (
            <>
              <Table className="min-w-[720px]">
                <THead>
                  <TR>
                    <TH>Provider</TH>
                    <TH>Base URL</TH>
                    <TH>API Key</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Aksi</TH>
                  </TR>
                </THead>
                <tbody>
                  {providers.map((p) => (
                    <TR key={p.id} className="hover:bg-brand-50/60">
                      <TD>
                        <div className="flex flex-col">
                          <span className="font-bold text-ink">{p.name}</span>
                          <span className="text-[11px] text-muted">{p.slug}</span>
                        </div>
                      </TD>
                      <TD className="font-mono text-xs text-ink/80">{p.baseUrl}</TD>
                      <TD>
                        {p.hasKey ? (
                          <Badge tone="success">
                            <KeyRound className="h-3 w-3" /> Key terisi
                          </Badge>
                        ) : (
                          <Badge tone="muted">Tanpa key</Badge>
                        )}
                      </TD>
                      <TD>
                        {p.isActive ? (
                          <Badge tone="success">Aktif</Badge>
                        ) : (
                          <Badge tone="muted">Nonaktif</Badge>
                        )}
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-3">
                          <Button href={`/admin/ai/providers/${p.id}`} variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" /> Edit
                          </Button>

                          <form action={toggleProviderActive} className="inline-flex">
                            <input type="hidden" name="id" value={p.id} />
                            <button
                              type="submit"
                              aria-label={`${p.isActive ? "Nonaktifkan" : "Aktifkan"} ${p.name}`}
                              title={p.isActive ? "Nonaktifkan" : "Aktifkan"}
                              className="text-muted hover:text-brand-700"
                            >
                              <Power className="h-4 w-4" />
                            </button>
                          </form>

                          <form action={softDeleteProvider} className="inline-flex">
                            <input type="hidden" name="id" value={p.id} />
                            <button
                              type="submit"
                              aria-label={`Hapus ${p.name}`}
                              title="Hapus"
                              className="text-muted hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>

              <p className="mt-3 text-[11px] text-muted">
                Menampilkan {providers.length} provider aktif. API key tersimpan
                terenkripsi — tidak ditampilkan.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
