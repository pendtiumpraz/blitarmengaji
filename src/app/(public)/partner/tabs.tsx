"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Handshake, MessageCircle, Globe, Radio, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  BusinessPartnerListItem,
  MediaPartnerListItem,
} from "@/lib/queries/lapak";

type TabKey = "media" | "usaha";

const tabs: { key: TabKey; label: string }[] = [
  { key: "media", label: "Media Partner" },
  { key: "usaha", label: "Partner Usaha" },
];

/** Logo dari DB bila ada; jika tidak, placeholder ornamen + ikon. */
function PartnerLogo({ logo, name, icon: Icon }: { logo: string | null; name: string; icon: typeof Radio }) {
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name}
        className="h-14 w-14 shrink-0 rounded-[3px] border border-line object-cover"
      />
    );
  }
  return (
    <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-[3px] bg-brand-600">
      <div className="pat-girih-light absolute inset-0 opacity-60" />
      <Icon className="relative z-10 h-6 w-6 text-cream" />
    </div>
  );
}

function MediaCard({ p }: { p: MediaPartnerListItem }) {
  return (
    <Card className="flex items-center gap-3 p-4 transition hover:border-gold/50 hover:shadow-md">
      <Link href={`/partner/${p.slug}`} aria-label={p.name} className="shrink-0">
        <PartnerLogo logo={p.logo} name={p.name} icon={Radio} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/partner/${p.slug}`}
            className="truncate text-sm font-bold text-ink hover:text-brand-600"
          >
            {p.name}
          </Link>
          <Badge tone="brand" className="shrink-0">Media</Badge>
        </div>
        <p className="line-clamp-2 text-xs text-muted">
          {p.description ?? "Media partner penyiaran dakwah."}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Link
            href={`/partner/${p.slug}`}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-600"
          >
            Lihat Detail <ChevronRight className="h-3 w-3" />
          </Link>
          {p.website ? (
            <a
              href={p.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-600"
            >
              <Globe className="h-3 w-3" /> Kunjungi
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function UsahaCard({ p }: { p: BusinessPartnerListItem }) {
  const wa = p.contactWa?.replace(/[^0-9]/g, "");
  const href = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(
        `Assalamu'alaikum, saya ingin bertanya tentang ${p.name} di Blitar Mengaji.`,
      )}`
    : null;
  return (
    <Card className="flex items-center gap-3 p-4 transition hover:border-gold/50 hover:shadow-md">
      <Link href={`/partner/${p.slug}`} aria-label={p.name} className="shrink-0">
        <PartnerLogo logo={p.logo} name={p.name} icon={Store} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/partner/${p.slug}`}
            className="truncate text-sm font-bold text-ink hover:text-brand-600"
          >
            {p.name}
          </Link>
          {p.category ? <Badge tone="gold" className="shrink-0">{p.category}</Badge> : null}
        </div>
        <p className="line-clamp-2 text-xs text-muted">
          {p.description ?? "Partner usaha jamaah."}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <Link
            href={`/partner/${p.slug}`}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:text-brand-600"
          >
            Lihat Detail <ChevronRight className="h-3 w-3" />
          </Link>
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 hover:text-green-800"
            >
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function CtaCard() {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-[3px] border border-line bg-brand-50 p-6 text-center">
      <Handshake className="h-9 w-9 text-brand-600" />
      <p className="display mt-2 text-lg text-ink">Jadi Partner Kami</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Daftarkan media atau usahamu untuk bersinergi menyebarkan dakwah.
      </p>
      <Button href="/partner/ajukan" variant="primary" size="md" className="mt-4">
        Ajukan Kemitraan
      </Button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50">
        <Handshake className="h-6 w-6 text-brand-600" />
      </div>
      <p className="display mt-3 text-base text-ink">Belum ada {label}</p>
      <p className="mt-1 max-w-[40ch] text-sm text-muted">
        Daftar {label.toLowerCase()} terverifikasi akan tampil di sini. Jadilah yang pertama
        bersinergi bersama kami.
      </p>
    </div>
  );
}

export function PartnerTabs({
  media,
  usaha,
}: {
  media: MediaPartnerListItem[];
  usaha: BusinessPartnerListItem[];
}) {
  const [active, setActive] = useState<TabKey>("media");

  return (
    <div>
      {/* TAB BAR */}
      <div className="mx-auto mb-6 flex max-w-md overflow-hidden rounded-full border border-line bg-surface p-1">
        {tabs.map((t) => {
          const on = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              aria-pressed={on}
              className={
                "flex-1 rounded-full py-2.5 text-sm font-bold transition-colors " +
                (on ? "bg-brand-600 text-white" : "text-muted hover:text-brand-600")
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* GRID KARTU */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active === "media" ? (
          media.length === 0 ? (
            <EmptyState label="Media Partner" />
          ) : (
            media.map((p) => <MediaCard key={p.id} p={p} />)
          )
        ) : usaha.length === 0 ? (
          <EmptyState label="Partner Usaha" />
        ) : (
          usaha.map((p) => <UsahaCard key={p.id} p={p} />)
        )}
        <CtaCard />
      </div>
    </div>
  );
}
