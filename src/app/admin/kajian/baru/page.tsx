import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { KajianForm } from "./form";
import { listUstadzOptions, listTitikOptions, listKajianCategoryOptions } from "@/lib/queries/kajian";

export const dynamic = "force-dynamic";

export default async function AdminKajianBaruPage() {
  const [ustadzOptions, titikOptions, categoryOptions] = await Promise.all([
    listUstadzOptions(),
    listTitikOptions(),
    listKajianCategoryOptions(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Tambah Kajian"
        subtitle="Daftarkan kajian baru beserta ustadz, titik dakwah, dan kategorinya."
        action={
          <Button href="/admin/kajian" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />
      <KajianForm
        ustadzOptions={ustadzOptions}
        titikOptions={titikOptions}
        categoryOptions={categoryOptions}
      />
    </div>
  );
}
