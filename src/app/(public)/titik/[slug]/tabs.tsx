"use client";

import { useState } from "react";
import { CalendarClock, HandHeart, Images, MapPin, Radio, Video as VideoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  TitikCampaignItem,
  TitikGalleryItem,
  TitikScheduleItem,
  TitikVideoItem,
} from "@/lib/queries/titik-media";

type TabKey = "jadwal" | "galeri" | "video" | "donasi";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const tglPanjang = (d: Date) =>
  d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const jam = (d: Date) =>
  d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");

/** URL embed iframe untuk YouTube / Facebook dari data video. */
function embedUrl(v: TitikVideoItem): string | null {
  if (v.platform === "youtube") {
    if (v.embedId) return `https://www.youtube.com/embed/${v.embedId}`;
    return null;
  }
  // Facebook: pakai plugin video.php dengan href = sourceUrl ter-encode.
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(v.sourceUrl)}`;
}

export function DetailTabs({
  galeri,
  video,
  jadwal,
  donasi,
  titikName,
}: {
  galeri: TitikGalleryItem[];
  video: TitikVideoItem[];
  jadwal: TitikScheduleItem[];
  donasi: TitikCampaignItem[];
  titikName: string;
}) {
  const [active, setActive] = useState<TabKey>("jadwal");

  const tabs: { key: TabKey; label: string; dot?: boolean }[] = [
    { key: "jadwal", label: "Jadwal" },
    { key: "galeri", label: "Galeri" },
    { key: "video", label: "Video" },
    { key: "donasi", label: "Donasi", dot: donasi.length > 0 },
  ];

  return (
    <div className="overflow-hidden rounded-[3px] border border-line bg-surface">
      {/* TAB BAR */}
      <div className="flex border-b border-line px-2 text-sm font-bold text-muted">
        {tabs.map((t) => {
          const on = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              aria-pressed={on}
              className={
                "flex items-center gap-1.5 px-4 py-3 transition-colors " +
                (on ? "border-b-2 border-brand-600 text-brand-700" : "hover:text-brand-600")
              }
            >
              {t.label}
              {t.dot ? <span className="h-1.5 w-1.5 rounded-full bg-gold" /> : null}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {/* JADWAL */}
        {active === "jadwal" && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <CalendarClock className="h-4 w-4 text-brand-600" /> Jadwal Kajian
            </h3>
            {jadwal.length === 0 ? (
              <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-cream py-10 text-center">
                <CalendarClock className="h-7 w-7 text-brand-600/50" />
                <p className="mt-2 text-sm font-semibold text-ink">Belum ada jadwal</p>
                <p className="text-xs text-muted">Jadwal kajian titik dakwah ini masih kosong.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jadwal.map((j) => {
                  const judul = j.title ?? j.kajianTitle ?? "Sesi Kajian";
                  const cancelled = j.status === "cancelled";
                  return (
                    <div
                      key={j.id}
                      className="flex items-center gap-3 rounded-[3px] bg-cream p-3"
                    >
                      <div className="w-14 shrink-0 text-center">
                        <p className="text-sm font-extrabold text-brand-700">{jam(j.startAt)}</p>
                        {j.endAt ? <p className="text-[10px] text-muted">s/d {jam(j.endAt)}</p> : null}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                          {tglPanjang(j.startAt)}
                        </p>
                        <p className="text-sm font-semibold text-ink">{judul}</p>
                        {j.ustadzName ? <p className="text-xs text-muted">{j.ustadzName}</p> : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {cancelled ? (
                          <Badge tone="danger">Batal</Badge>
                        ) : j.status === "ongoing" ? (
                          <Badge tone="warning">Berlangsung</Badge>
                        ) : j.status === "done" ? (
                          <Badge tone="muted">Selesai</Badge>
                        ) : null}
                        {j.isOnline ? (
                          j.streamUrl ? (
                            <a
                              href={j.streamUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                            >
                              <Radio className="h-4 w-4" /> Online
                            </a>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-muted">
                              <Radio className="h-4 w-4" /> Online
                            </span>
                          )
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* GALERI */}
        {active === "galeri" && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <Images className="h-4 w-4 text-brand-600" /> Galeri
            </h3>
            {galeri.length === 0 ? (
              <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-cream py-10 text-center">
                <Images className="h-7 w-7 text-brand-600/50" />
                <p className="mt-2 text-sm font-semibold text-ink">Belum ada foto</p>
                <p className="text-xs text-muted">Galeri titik dakwah ini masih kosong.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                {galeri.map((foto) => (
                  <figure
                    key={foto.id}
                    className="group relative aspect-square overflow-hidden rounded-[3px] bg-cream"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={foto.url}
                      alt={foto.caption ?? "Foto galeri"}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {foto.caption ? (
                      <figcaption className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-2 py-1 text-[10px] text-cream">
                        {foto.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIDEO */}
        {active === "video" && (
          <div>
            {video.length === 0 ? (
              <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-cream py-10 text-center">
                <VideoIcon className="h-7 w-7 text-brand-600/50" />
                <p className="mt-2 text-sm font-semibold text-ink">Belum ada video</p>
                <p className="text-xs text-muted">Video & siaran titik dakwah ini masih kosong.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {video.map((v) => {
                  const src = embedUrl(v);
                  return (
                    <div key={v.id} className="overflow-hidden rounded-[3px] border border-line">
                      <div className="relative aspect-video bg-brand-700">
                        {src ? (
                          <iframe
                            src={src}
                            title={v.title ?? "Video"}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="absolute inset-0 h-full w-full"
                          />
                        ) : (
                          <a
                            href={v.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 grid place-items-center text-xs font-bold text-cream"
                          >
                            Buka video
                          </a>
                        )}
                        {v.isLive ? (
                          <span className="absolute left-2 top-2 z-10 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                            ● LIVE
                          </span>
                        ) : null}
                      </div>
                      {v.title ? (
                        <div className="p-3">
                          <p className="text-sm font-semibold text-ink">{v.title}</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* DONASI */}
        {active === "donasi" && (
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
              <HandHeart className="h-4 w-4 text-brand-600" /> Campaign Donasi
            </h3>
            {donasi.length === 0 ? (
              <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-cream py-10 text-center">
                <HandHeart className="h-7 w-7 text-brand-600/50" />
                <p className="mt-2 text-sm font-semibold text-ink">Belum ada campaign</p>
                <p className="text-xs text-muted">Titik dakwah ini belum membuka penggalangan dana.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {donasi.map((c) => {
                  const collected = Number(c.collectedAmount ?? 0);
                  const target = Number(c.targetAmount ?? 0);
                  const persen = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
                  return (
                    <div key={c.id} className="overflow-hidden rounded-[3px] border border-line">
                      <div className="pat-girih-light relative grid h-32 place-items-center bg-brand-600">
                        {c.posterImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.posterImage}
                            alt={c.title}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <HandHeart className="relative z-10 h-12 w-12 text-gold-light" />
                        )}
                        <Badge tone="warning" className="absolute left-2 top-2 z-10">
                          ● Aktif
                        </Badge>
                      </div>
                      <div className="p-4">
                        <p className="flex items-center gap-1 text-[11px] text-muted">
                          <MapPin className="h-3 w-3" /> {titikName}
                        </p>
                        <h4 className="mt-1 text-base font-bold leading-tight text-ink">{c.title}</h4>

                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="font-bold text-brand-700">{rupiah(collected)}</span>
                            <span className="text-muted">
                              {target > 0 ? `dari ${rupiah(target)}` : "tanpa target"}
                            </span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-black/5">
                            <div className="h-full bg-gold" style={{ width: `${persen}%` }} />
                          </div>
                          <div className="mt-1 flex justify-between text-[11px] text-muted">
                            <span>{persen}% tercapai</span>
                            {c.endAt ? (
                              <span>
                                Sampai{" "}
                                {c.endAt.toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            ) : (
                              <span>Donasi terbuka</span>
                            )}
                          </div>
                        </div>

                        <Button href={`/donasi/${c.slug}`} variant="gold" size="md" className="mt-4 w-full">
                          <HandHeart className="h-4 w-4" /> Donasi Sekarang
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
