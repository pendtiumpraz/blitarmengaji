import Link from "next/link";
import { CalendarClock, MapPin, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { listJadwal, type JadwalItem } from "@/lib/queries/kajian";

export const dynamic = "force-dynamic";

export const metadata = { title: "Jadwal" };

const TZ = "Asia/Jakarta";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TZ,
});
const dateKeyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }); // YYYY-MM-DD
const timeFmt = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ,
});

function ModeBadge({ item }: { item: JadwalItem }) {
  if (item.status === "ongoing") return <Badge tone="danger">● Berlangsung</Badge>;
  if (item.status === "cancelled") return <Badge tone="muted">Dibatalkan</Badge>;
  if (item.status === "done") return <Badge tone="muted">Selesai</Badge>;
  if (item.isOnline) return <Badge tone="brand">Online</Badge>;
  return <Badge tone="muted">Offline</Badge>;
}

export default async function JadwalPage() {
  const sesi = await listJadwal();

  // Kelompokkan per tanggal (timezone WIB), pertahankan urutan start_at menaik.
  const groups = new Map<string, JadwalItem[]>();
  for (const s of sesi) {
    const key = dateKeyFmt.format(s.startAt);
    const list = groups.get(key);
    if (list) list.push(s);
    else groups.set(key, [s]);
  }

  return (
    <Container className="py-10">
      <SectionHeading
        align="left"
        eyebrow="Agenda"
        title="Jadwal Kajian"
        subtitle="Agenda majelis ilmu se-Blitar Raya — online maupun offline — diurutkan dari sesi terdekat."
        className="mb-6"
      />

      {sesi.length === 0 ? (
        // Empty state ramah
        <div className="mx-auto max-w-md rounded-[3px] border border-line bg-surface p-10 text-center shadow-[0_2px_10px_rgba(15,23,42,.06)]">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <CalendarClock className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Belum ada jadwal kajian</h2>
          <p className="mt-1 text-sm text-muted">
            Jadwal sesi kajian dari titik dakwah se-Blitar Raya akan tampil di sini begitu ditambahkan.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groups.entries()).map(([key, list]) => (
            <div key={key}>
              <h2 className="display mb-3 text-sm uppercase tracking-wide text-brand-700">
                {dateFmt.format(list[0].startAt)}
              </h2>
              <div className="space-y-3">
                {list.map((s) => {
                  const judul = s.title ?? s.kajianTitle ?? "Kajian";
                  const lokasi = s.isOnline
                    ? "Online"
                    : [s.titikName, s.kecamatan].filter(Boolean).join(" · ");
                  const meta = [s.ustadzName, lokasi].filter(Boolean).join(" · ");
                  return (
                    <div
                      key={s.id}
                      className="flex flex-col gap-3 rounded-[3px] border border-line bg-surface p-4 sm:flex-row sm:items-center"
                    >
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-base font-extrabold leading-none text-brand-700">
                          {timeFmt.format(s.startAt)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">WIB</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          {s.kajianSlug ? (
                            <Link
                              href={`/kajian/${s.kajianSlug}`}
                              className="text-sm font-bold text-ink hover:text-brand-700"
                            >
                              {judul}
                            </Link>
                          ) : (
                            <p className="text-sm font-bold text-ink">{judul}</p>
                          )}
                          <ModeBadge item={s} />
                        </div>
                        {meta ? <p className="mt-0.5 text-xs text-muted">{meta}</p> : null}
                      </div>
                      {s.isOnline && s.streamUrl ? (
                        <a
                          href={s.streamUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border-2 border-brand-600 px-4 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-50 sm:h-9"
                        >
                          <Radio className="h-4 w-4" /> Tonton
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 flex items-center gap-1.5 text-xs text-muted">
        <MapPin className="h-3.5 w-3.5" /> Waktu ditampilkan dalam zona WIB (Asia/Jakarta).
      </p>
    </Container>
  );
}
