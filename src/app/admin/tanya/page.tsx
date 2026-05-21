import { CircleDot } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { listQuestions } from "@/lib/queries/tanya";
import { Moderasi } from "./moderasi";

export const dynamic = "force-dynamic";

export default async function AdminTanyaPage() {
  const [session, list] = await Promise.all([auth(), listQuestions("all")]);
  const ustadzName = session?.user?.name?.trim() || "Ustadz";
  const menungguCount = list.filter((q) => q.answers.length === 0).length;

  return (
    <div>
      <AdminPageHeader
        title="Tanya Ustadz"
        subtitle="Moderasi & jawab pertanyaan jamaah Blitar Raya. Penanya boleh anonim (Hamba Allah); jawaban ustadz wajib pakai nama."
        action={
          menungguCount > 0 ? (
            <Badge tone="gold">
              <CircleDot className="h-3 w-3" /> {menungguCount} menunggu jawaban
            </Badge>
          ) : undefined
        }
      />

      <Moderasi questions={list} ustadzName={ustadzName} />
    </div>
  );
}
