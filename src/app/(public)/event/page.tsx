import Link from "next/link";
import { Presentation, UsersRound, Clock, MapPin, Video, Building2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { listEvents, type EventListItem } from "@/lib/queries/belajar";
import { registerEvent } from "@/lib/actions/belajar";

export const dynamic = "force-dynamic";

export const metadata = { title: "Event" };

const BULAN = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

function tanggalBadge(d: Date | null): { hari: string; bulan: string } {
  if (!d) return { hari: "—", bulan: "" };
  return { hari: String(d.getDate()).padStart(2, "0"), bulan: BULAN[d.getMonth()] };
}

function waktu(d: Date | null): string {
  if (!d) return "Waktu menyusul";
  const jam = String(d.getHours()).padStart(2, "0");
  const menit = String(d.getMinutes()).padStart(2, "0");
  return `${jam}.${menit} WIB`;
}

const KIND_LABEL: Record<EventListItem["kind"], string> = {
  webinar: "Webinar",
  offline: "Offline",
  hybrid: "Hybrid",
};

export default async function EventPage() {
  const acaraList = await listEvents();

  return (
    <Container className="py-10">
      <SectionHeading
        align="left"
        eyebrow="Agenda Umat"
        title="Event & Webinar"
        subtitle="Acara dakwah dari partner & komunitas Blitar Raya — daftar gratis, hadir online lewat Zoom maupun langsung di lokasi."
        className="mb-8"
      />

      {acaraList.length === 0 ? (
        <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gold/15 text-gold-dark">
            <CalendarDays className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h3 className="display mt-4 text-xl text-ink">Belum ada acara terjadwal</h3>
          <p className="mt-1.5 max-w-[44ch] text-sm text-muted">
            Saat ini belum ada event atau webinar yang dibuka. Pantau halaman ini, agenda dakwah
            dari komunitas Blitar Raya akan tampil di sini.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {acaraList.map((a) => {
            const online = a.kind === "webinar" || a.kind === "hybrid";
            const tgl = tanggalBadge(a.startAt);
            const lokasi = online ? a.onlineUrl ?? "Online" : a.location ?? "Lokasi menyusul";
            const Icon = online ? Presentation : UsersRound;
            return (
              <div
                key={a.id}
                className="flex flex-col overflow-hidden rounded-[3px] border border-line bg-surface transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl"
              >
                <Link
                  href={`/event/${a.slug}`}
                  className={`relative grid h-32 place-items-center ${online ? "bg-gold" : "bg-brand-700"}`}
                >
                  {a.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.coverImage} alt={a.title} className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-11 w-11 text-white/90" strokeWidth={1.4} />
                  )}
                  <div className="absolute left-2 top-2 rounded-[3px] bg-surface px-2 py-1 text-center leading-none shadow-sm">
                    <p className="text-base font-extrabold text-brand-700">{tgl.hari}</p>
                    <p className="text-[9px] font-bold tracking-wide text-muted">{tgl.bulan}</p>
                  </div>
                  <Badge
                    tone={online ? "brand" : "success"}
                    className={
                      online
                        ? "absolute right-2 top-2 bg-brand-700 text-white"
                        : "absolute right-2 top-2 bg-brand-600 text-white"
                    }
                  >
                    {KIND_LABEL[a.kind]}
                  </Badge>
                </Link>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-[15px] font-bold leading-snug text-ink">
                    <Link href={`/event/${a.slug}`} className="hover:text-brand-700">
                      {a.title}
                    </Link>
                  </h3>

                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{waktu(a.startAt)}</span>
                    <span aria-hidden>·</span>
                    {online ? (
                      <Video className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{lokasi}</span>
                  </p>

                  {a.organizerName ? (
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                      <Building2 className="h-3.5 w-3.5 shrink-0" /> {a.organizerName}
                    </p>
                  ) : null}

                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                    <UsersRound className="h-3.5 w-3.5 shrink-0" />
                    {a.capacity
                      ? `${a.registeredCount}/${a.capacity} terdaftar`
                      : `${a.registeredCount} terdaftar`}
                  </p>

                  <div className="mt-auto pt-4">
                    {a.needsRegistration ? (
                      <form action={registerEvent}>
                        <input type="hidden" name="eventId" value={a.id} />
                        <Button
                          type="submit"
                          variant={online ? "gold" : "primary"}
                          size="sm"
                          className="w-full"
                        >
                          Daftar
                        </Button>
                      </form>
                    ) : (
                      <p className="text-center text-[11px] text-muted">Tanpa pendaftaran · langsung hadir</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
