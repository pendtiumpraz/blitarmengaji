import { notFound } from "next/navigation";
import { ArrowLeft, FilePlus2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getTransactionById,
  listCategories,
  listScopes,
} from "@/lib/queries/keuangan";
import { FinanceEditForm } from "./edit-form";

// Membaca data langsung dari Neon → jangan di-cache statik.
export const dynamic = "force-dynamic";

export default async function EditTransaksiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const trx = await getTransactionById(id);
  if (!trx) notFound();

  const [scopes, categories] = await Promise.all([listScopes(), listCategories()]);

  return (
    <div>
      <AdminPageHeader
        title="Ubah Transaksi"
        subtitle="Perbarui detail transaksi. Bukti lama dipertahankan jika tidak mengunggah berkas baru."
        action={
          <Button href="/admin/keuangan" variant="outline">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <div className="max-w-xl">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <FilePlus2 className="h-4 w-4 text-brand-600" /> Detail Transaksi
          </h2>

          <FinanceEditForm
            id={trx.id}
            scopes={scopes.map((s) => ({ value: s.id, label: s.name }))}
            categories={categories}
            initial={{
              scope: trx.titikDakwahId ?? "",
              trxDate: trx.trxDate.toISOString().slice(0, 10),
              categoryId: trx.categoryId,
              type: trx.type,
              amount: Math.round(trx.amount).toLocaleString("id-ID"),
              description: trx.description,
              proofUrl: trx.proofUrl,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
