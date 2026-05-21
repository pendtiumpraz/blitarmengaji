import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { KajianEditForm } from "./form";
import {
  getKajianById,
  listUstadzOptions,
  listTitikOptions,
  listKajianCategoryOptions,
} from "@/lib/queries/kajian";

export const dynamic = "force-dynamic";

export default async function AdminKajianEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [kajian, ustadzOptions, titikOptions, categoryOptions] = await Promise.all([
    getKajianById(id),
    listUstadzOptions(),
    listTitikOptions(),
    listKajianCategoryOptions(),
  ]);

  if (!kajian) notFound();

  return (
    <div>
      <AdminPageHeader
        title="Edit Kajian"
        subtitle="Ubah data kajian, ustadz, titik dakwah, kategori, atau covernya."
        action={
          <Button href="/admin/kajian" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />
      <KajianEditForm
        kajian={kajian}
        ustadzOptions={ustadzOptions}
        titikOptions={titikOptions}
        categoryOptions={categoryOptions}
      />
    </div>
  );
}
