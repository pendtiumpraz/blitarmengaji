"use client";

import { useMemo, useState } from "react";
import { QrCode, Copy, Check, VenetianMask, MessageCircle, HandHeart, ChevronDown, Link2 } from "lucide-react";

type Props = {
  campaignTitle: string;
  titik: string;
  /** URL gambar QRIS (Vercel Blob) — null bila belum diunggah pengelola. */
  qrisImage: string | null;
  /** Tautan kontak konfirmasi: wa.me/62… atau nomor WA polos. null bila tak ada. */
  contactLink: string | null;
};

/** Tombol "Donasi Sekarang" (gold) yang membuka bagian pembayaran. */
export function DonateReveal(props: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-gold px-7 text-sm font-bold tracking-[0.01em] text-[#241f10] transition-colors hover:bg-gold-light sm:w-auto"
      >
        <HandHeart className="h-5 w-5" /> Donasi Sekarang
        <ChevronDown className="h-4 w-4" />
      </button>
    );
  }

  return <PaymentBox {...props} />;
}

const PRESETS = [20_000, 50_000, 100_000, 250_000, 500_000];

const formatRupiah = (n: number) => new Intl.NumberFormat("id-ID").format(Number.isFinite(n) ? n : 0);

/** Bangun tautan wa.me dari contactLink (terima URL penuh atau nomor polos). */
function buildWaLink(contactLink: string | null, message: string): string | null {
  if (!contactLink) return null;
  const text = encodeURIComponent(message);
  const trimmed = contactLink.trim();
  // Sudah berupa URL wa.me / api.whatsapp.com → tambahkan/replace teks.
  if (/^https?:\/\//i.test(trimmed)) {
    const sep = trimmed.includes("?") ? "&" : "?";
    return trimmed.includes("text=") ? trimmed : `${trimmed}${sep}text=${text}`;
  }
  // Nomor polos (mis. 6281234567890 / 081234567890) → normalkan ke wa.me.
  const digits = trimmed.replace(/\D/g, "").replace(/^0/, "62");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${text}`;
}

export function PaymentBox({ campaignTitle, titik, qrisImage, contactLink }: Props) {
  const [amount, setAmount] = useState<number>(50_000);
  const [name, setName] = useState<string>("");
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const displayName = anonymous || name.trim() === "" ? "Hamba Allah" : name.trim();

  const message = useMemo(
    () =>
      `Assalamu'alaikum, saya telah donasi Rp${formatRupiah(amount)} ` +
      `untuk *${campaignTitle} — ${titik}* a.n. *${displayName}*. ` +
      `Mohon dikonfirmasi. Jazakumullah khairan.`,
    [amount, campaignTitle, titik, displayName],
  );

  const waLink = useMemo(() => buildWaLink(contactLink, message), [contactLink, message]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard tidak tersedia (mis. webview tanpa izin) — abaikan diam-diam.
    }
  };

  const handleAmountInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setAmount(digits === "" ? 0 : Number(digits));
  };

  return (
    <div className="space-y-5">
      {/* QRIS */}
      <div className="rounded-[3px] border border-line bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold text-ink">
            <QrCode className="h-4 w-4 text-brand-600" /> Scan QRIS
          </p>
          <span className="rounded bg-black/5 px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-muted">
            QRIS
          </span>
        </div>
        <div className="grid place-items-center rounded-sm border border-line bg-white p-4">
          {qrisImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrisImage} alt="Kode QRIS donasi" className="h-44 w-44 rounded-sm object-contain" />
          ) : (
            <div className="grid h-44 w-44 place-items-center rounded-sm bg-brand-50 text-brand-600">
              <QrCode className="h-24 w-24" strokeWidth={1} />
            </div>
          )}
          <p className="mt-2.5 text-center text-[11px] text-muted">
            {qrisImage
              ? "Buka m-banking / e-wallet → scan kode untuk membayar"
              : "QRIS belum tersedia — silakan konfirmasi langsung via WhatsApp"}
          </p>
        </div>
      </div>

      {/* Nominal + nama + anonim */}
      <div className="space-y-4 rounded-[3px] border border-line bg-surface p-5">
        <div>
          <p className="mb-2 text-xs font-bold text-muted">Pilih nominal donasi</p>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => {
              const active = amount === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`h-9 rounded-full text-xs font-bold transition-colors ${
                    active
                      ? "border-2 border-brand-600 bg-brand-50 text-brand-700"
                      : "border border-line bg-surface text-muted hover:border-brand-300"
                  }`}
                >
                  Rp {formatRupiah(p)}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex h-12 items-center gap-2 rounded-sm border-2 border-brand-600 bg-white px-3">
            <span className="text-sm font-bold text-muted">Rp</span>
            <input
              inputMode="numeric"
              value={amount === 0 ? "" : formatRupiah(amount)}
              onChange={(e) => handleAmountInput(e.target.value)}
              placeholder="0"
              className="flex-1 bg-transparent text-lg font-extrabold text-ink outline-none"
              aria-label="Nominal donasi"
            />
            <span className="text-[10px] font-semibold text-muted">nominal lain</span>
          </div>
        </div>

        <div>
          <label htmlFor="donor-name" className="text-xs font-bold text-muted">
            Nama donatur
          </label>
          <input
            id="donor-name"
            value={anonymous ? "Hamba Allah" : name}
            onChange={(e) => setName(e.target.value)}
            disabled={anonymous}
            placeholder="Nama Anda"
            className="mt-1 h-10 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:opacity-70"
          />
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-ink">
            <VenetianMask className="h-4 w-4 text-brand-600" /> Sembunyikan nama{" "}
            <span className="text-[11px] text-muted">(Hamba Allah)</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={anonymous}
            onClick={() => setAnonymous((v) => !v)}
            className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
              anonymous ? "bg-brand-600" : "bg-black/15"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                anonymous ? "right-0.5" : "left-0.5"
              }`}
            />
          </button>
        </label>
      </div>

      {/* Pratinjau pesan WA */}
      <div className="rounded-[3px] border border-green-200 bg-green-50 p-3">
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-green-800">
          <MessageCircle className="h-3.5 w-3.5" /> Pratinjau pesan WhatsApp
        </p>
        <p className="rounded-sm bg-white/70 p-2.5 text-[12px] italic leading-relaxed text-green-900">
          &ldquo;Assalamu&apos;alaikum, saya telah donasi <b>Rp{formatRupiah(amount)}</b> untuk{" "}
          <b>
            {campaignTitle} — {titik}
          </b>{" "}
          a.n. <b>{displayName}</b>. Mohon dikonfirmasi. Jazakumullah khairan.&rdquo;
        </p>
      </div>

      {/* CTA WhatsApp */}
      {waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-13 w-full items-center justify-center gap-2 rounded-[3px] bg-green-600 py-3.5 text-base font-extrabold text-white shadow-lg transition-colors hover:bg-green-700"
        >
          <MessageCircle className="h-5 w-5" /> Konfirmasi via WhatsApp
        </a>
      ) : (
        <button
          type="button"
          onClick={copyMessage}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-[3px] border-2 border-brand-600 py-3.5 text-base font-extrabold text-brand-700 transition-colors hover:bg-brand-50"
        >
          {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          {copied ? "Pesan disalin" : "Salin Pesan Konfirmasi"}
        </button>
      )}
      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted">
        {waLink ? <HandHeart className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {waLink
          ? "Membuka WhatsApp ke pengelola dengan pesan otomatis (wa.me)."
          : "Pengelola belum menautkan WhatsApp — salin pesan lalu kirim manual."}
      </p>
    </div>
  );
}
