import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, BellOff, Check, CheckCheck, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { auth } from "@/lib/auth";
import { listMyNotifications, type MyNotification } from "@/lib/queries/notifications";
import { markRead, markAllRead } from "@/lib/actions/notifications";

// Notifikasi in-app user (data NYATA dari DB). Wajib login.
export const dynamic = "force-dynamic";

// Format waktu relatif singkat dalam Bahasa Indonesia.
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function waktuRelatif(d: Date): string {
  const diff = Date.now() - d.getTime();
  const menit = Math.floor(diff / 60000);
  if (menit < 1) return "Baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return dateFmt.format(d);
}

// Ambil { title, body, link } dari payloadJson (tersimpan apa adanya via lib/notify.ts).
type NotifContent = { title: string; body?: string; link?: string };

function bacaPayload(n: MyNotification): NotifContent {
  const p = (n.payloadJson ?? {}) as Record<string, unknown>;
  const title = typeof p.title === "string" && p.title.trim() ? p.title : "Notifikasi";
  const body = typeof p.body === "string" && p.body.trim() ? p.body : undefined;
  const link = typeof p.link === "string" && p.link.trim() ? p.link : undefined;
  return { title, body, link };
}

export default async function NotifikasiPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const items = await listMyNotifications(userId);
  const adaBelumDibaca = items.some((n) => n.readAt === null);

  return (
    <Container className="max-w-2xl space-y-5 py-8 pb-12">
      {/* Judul + tombol tandai semua dibaca */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-sm bg-brand-50 text-brand-600">
          <Bell className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="display text-2xl text-brand-600">Notifikasi</h1>
          <p className="text-sm text-muted">Kabar terbaru untukmu dari Blitar Mengaji.</p>
        </div>
      </div>

      {adaBelumDibaca ? (
        <form action={markAllRead} className="flex justify-end">
          <Button type="submit" variant="outline" size="sm">
            <CheckCheck className="h-4 w-4" aria-hidden="true" />
            Tandai semua dibaca
          </Button>
        </form>
      ) : null}

      {/* Daftar / empty state */}
      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center shadow-sm">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <BellOff className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="display text-lg text-ink">Belum ada notifikasi</p>
          <p className="max-w-[40ch] text-sm text-muted">
            Kabar tentang pertanyaan, kajian, kelas, dan kegiatanmu akan muncul di sini.
          </p>
          <Button href="/" variant="outline" size="sm" className="mt-1">
            Kembali ke Beranda
          </Button>
        </Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden shadow-sm">
          {items.map((n) => {
            const { title, body, link } = bacaPayload(n);
            const belumDibaca = n.readAt === null;

            const inner = (
              <>
                {/* Penanda belum dibaca (dot) */}
                <span
                  className={cn(
                    "mt-1.5 h-2 w-2 flex-none rounded-full",
                    belumDibaca ? "bg-gold" : "bg-transparent",
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm text-ink",
                      belumDibaca ? "font-bold" : "font-semibold",
                    )}
                  >
                    {title}
                  </p>
                  {body ? (
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{body}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted">{waktuRelatif(n.createdAt)}</p>
                </div>
                {link ? <ChevronRight className="mt-1 h-4 w-4 flex-none text-muted" /> : null}
              </>
            );

            return (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3.5 transition-colors",
                  belumDibaca ? "bg-brand-50/40" : "bg-transparent",
                )}
              >
                {link ? (
                  <Link
                    href={link}
                    className="flex flex-1 items-start gap-3 hover:opacity-90"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div className="flex flex-1 items-start gap-3">{inner}</div>
                )}

                {/* Tandai satu notifikasi sebagai dibaca */}
                {belumDibaca ? (
                  <form action={markRead} className="flex-none self-center">
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      aria-label="Tandai dibaca"
                      title="Tandai dibaca"
                      className="grid h-8 w-8 place-items-center rounded-sm text-muted transition-colors hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                ) : null}
              </div>
            );
          })}
        </Card>
      )}
    </Container>
  );
}
