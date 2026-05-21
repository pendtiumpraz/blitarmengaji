import type { Metadata } from "next";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  Presentation,
  UsersRound,
  Video,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { OrnDivider } from "@/components/ui/orn-divider";
import { auth } from "@/lib/auth";
import { registerEvent } from "@/lib/actions/belajar";
import { countRegistrations, getEventBySlug } from "@/lib/queries/event-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const acara = await getEventBySlug(slug);
  if (!acara) return { title: "Tidak ditemukan" };

  const description =
    acara.description ??
    `Event ${acara.title}${
      acara.organizerName ? ` oleh ${acara.organizerName}` : ""
    } di Blitar Raya.`;

  return {
    title: acara.title,
    description,
    openGraph: {
      title: acara.title,
      description,
      ...(acara.coverImage ? { images: [acara.coverImage] } : {}),
    },
  };
}

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const KIND_LABEL: Record<"webinar" | "offline" | "hybrid", string> = {
  webinar: "Webinar",
  offline: "Offline",
  hybrid: "Hybrid",
};

/** Format tanggal lengkap dalam Bahasa Indonesia (mis. "Sabtu, 21 Mei 2026"). */
function tanggalLengkap(d: Date | null): string {
  if (!d) return "Tanggal menyusul";
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

/** Format jam:menit WIB (mis. "19.30 WIB"). */
function jam(d: Date | null): string {
  if (!d) return "—";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}.${m}`;
}

/** Rentang waktu (start–end) WIB; bila end null tampilkan jam mulai saja. */
function rentangWaktu(start: Date | null, end: Date | null): string {
  if (!start) return "Waktu menyusul";
  const akhir = end ? `–${jam(end)}` : "";
  return `${jam(start)}${akhir} WIB`;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const acara = await getEventBySlug(slug);
  if (!acara) notFound();

  const [registeredCount, session] = await Promise.all([
    countRegistrations(acara.id),
    auth(),
  ]);
  const isLoggedIn = !!session?.user?.id;

  const online = acara.kind === "webinar" || acara.kind === "hybrid";
  const offline = acara.kind === "offline" || acara.kind === "hybrid";
  const Icon = online ? Presentation : UsersRound;

  const sisaKuota =
    acara.capacity != null ? Math.max(acara.capacity - registeredCount, 0) : null;
  const penuh = sisaKuota === 0;

  return (
    <Container className="py-6 lg:py-10">
      <Link
        href="/event"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Event
      </Link>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Kiri: cover + judul + deskripsi */}
        <div className="lg:col-span-2">
          <div
            className={`relative grid aspect-video place-items-center overflow-hidden rounded-[3px] ${
              online ? "bg-gold" : "bg-brand-700"
            }`}
          >
            {acara.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={acara.coverImage}
                alt={acara.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon className="h-14 w-14 text-white/90" strokeWidth={1.4} />
            )}
            <Badge
              tone={online ? "brand" : "success"}
              className={
                online
                  ? "absolute right-3 top-3 bg-brand-700 text-white"
                  : "absolute right-3 top-3 bg-brand-600 text-white"
              }
            >
              {KIND_LABEL[acara.kind]}
            </Badge>
          </div>

          <div className="mt-5">
            <h1 className="display text-2xl text-ink sm:text-3xl">{acara.title}</h1>

            {acara.organizerName ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <Building2 className="h-4 w-4 shrink-0 text-gold-dark" />
                Penyelenggara: <span className="font-bold text-ink">{acara.organizerName}</span>
              </p>
            ) : null}

            {acara.description ? (
              <>
                <OrnDivider className="my-6" />
                <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-gold-dark">
                  Tentang Acara
                </h2>
                <p className="whitespace-pre-line leading-relaxed text-ink/80">
                  {acara.description}
                </p>
              </>
            ) : null}
          </div>
        </div>

        {/* Kanan (desktop) / bawah (mobile): info & pendaftaran */}
        <aside className="lg:col-span-1">
          <div className="rounded-[3px] border border-line bg-surface p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-gold-dark">
              Detail Acara
            </h2>

            <ul className="space-y-3.5 text-sm text-ink">
              <li className="flex items-start gap-2.5">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>{tanggalLengkap(acara.startAt)}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>{rentangWaktu(acara.startAt, acara.endAt)}</span>
              </li>

              {offline ? (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>{acara.location ?? "Lokasi menyusul"}</span>
                </li>
              ) : null}

              {online ? (
                <li className="flex items-start gap-2.5">
                  <Video className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  {acara.onlineUrl ? (
                    <a
                      href={acara.onlineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all font-bold text-brand-700 hover:text-brand-600"
                    >
                      Tautan online
                    </a>
                  ) : (
                    <span>Tautan menyusul</span>
                  )}
                </li>
              ) : null}

              <li className="flex items-start gap-2.5">
                <UsersRound className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <span>
                  {acara.capacity != null
                    ? `${registeredCount}/${acara.capacity} terdaftar`
                    : `${registeredCount} terdaftar`}
                </span>
              </li>
            </ul>

            {acara.needsRegistration ? (
              <div className="mt-5 border-t border-line pt-5">
                {penuh ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="w-full"
                    disabled
                  >
                    Kuota Penuh
                  </Button>
                ) : isLoggedIn ? (
                  <form action={registerEvent}>
                    <input type="hidden" name="eventId" value={acara.id} />
                    <Button
                      type="submit"
                      variant={online ? "gold" : "primary"}
                      size="md"
                      className="w-full"
                    >
                      Daftar
                    </Button>
                  </form>
                ) : (
                  <Button
                    href="/masuk"
                    variant={online ? "gold" : "primary"}
                    size="md"
                    className="w-full"
                  >
                    Masuk untuk Daftar
                  </Button>
                )}
              </div>
            ) : (
              <p className="mt-5 border-t border-line pt-5 text-center text-xs text-muted">
                Tanpa pendaftaran · langsung hadir
              </p>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}
