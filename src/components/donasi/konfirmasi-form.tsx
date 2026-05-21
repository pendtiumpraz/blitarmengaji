"use client";

import { useState } from "react";
import { VenetianMask, ReceiptText, Send } from "lucide-react";
import { FileUpload } from "@/components/ui/file-upload";
import { createDonationConfirmation } from "@/lib/actions/pembayaran";

const formatRupiah = (n: number) => new Intl.NumberFormat("id-ID").format(Number.isFinite(n) ? n : 0);

/**
 * Form konfirmasi pembayaran sisi DONATUR ("Sudah transfer? Konfirmasi di sini").
 * Mengirim ke server action createDonationConfirmation (multipart, bukti → Blob).
 * Tidak wajib login. Toggle "sebagai Hamba Allah" → nama disembunyikan.
 */
export function KonfirmasiForm({ campaignId }: { campaignId: string }) {
  const [anonymous, setAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);

  const handleAmountInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setAmount(digits === "" ? 0 : Number(digits));
  };

  return (
    <div className="rounded-[3px] border border-line bg-surface p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <ReceiptText className="h-4 w-4 text-brand-600" /> Sudah transfer? Konfirmasi di sini
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">
        Bantu pengelola memverifikasi donasi Anda. Unggah bukti transfer bila ada.
      </p>

      <form action={createDonationConfirmation} className="mt-4 space-y-4">
        <input type="hidden" name="refId" value={campaignId} />

        <div>
          <label htmlFor="konf-name" className="text-xs font-bold text-muted">
            Nama donatur
          </label>
          <input
            id="konf-name"
            name="payerName"
            value={anonymous ? "Hamba Allah" : name}
            onChange={(e) => setName(e.target.value)}
            disabled={anonymous}
            placeholder="Nama Anda"
            className="mt-1 h-10 w-full rounded-sm border border-line bg-white px-3 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 disabled:opacity-70"
          />
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-ink">
            <VenetianMask className="h-4 w-4 text-brand-600" /> Sebagai{" "}
            <span className="font-bold">Hamba Allah</span>
          </span>
          {/* checkbox asli (name=isAnonymous) disembunyikan; toggle craft mengontrolnya */}
          <input
            type="checkbox"
            name="isAnonymous"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
          />
          <button
            type="button"
            role="switch"
            aria-checked={anonymous}
            aria-label="Sembunyikan nama (sebagai Hamba Allah)"
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

        <div>
          <label htmlFor="konf-amount" className="text-xs font-bold text-muted">
            Jumlah donasi
          </label>
          <div className="mt-1 flex h-11 items-center gap-2 rounded-sm border border-line bg-white px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
            <span className="text-sm font-bold text-muted">Rp</span>
            <input
              id="konf-amount"
              name="amount"
              inputMode="numeric"
              value={amount === 0 ? "" : formatRupiah(amount)}
              onChange={(e) => handleAmountInput(e.target.value)}
              placeholder="0"
              required
              className="flex-1 bg-transparent text-sm font-bold text-ink outline-none"
              aria-label="Jumlah donasi"
            />
          </div>
        </div>

        <div>
          <label htmlFor="konf-note" className="text-xs font-bold text-muted">
            Catatan <span className="font-normal text-muted">(opsional)</span>
          </label>
          <textarea
            id="konf-note"
            name="note"
            rows={2}
            placeholder="Mis. nama bank / waktu transfer / doa…"
            className="mt-1 w-full rounded-sm border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>

        <FileUpload
          name="proofFile"
          accept="image/*"
          label="Bukti transfer (opsional)"
        />

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-brand-600 text-sm font-bold tracking-[0.01em] text-white transition-colors hover:bg-brand-700"
        >
          <Send className="h-4 w-4" /> Kirim Konfirmasi
        </button>
      </form>
    </div>
  );
}
