"use client";

import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { APK_DOWNLOAD_URL } from "@/lib/apk";

/**
 * Banner ajakan unduh APK.
 * Aturan tampil:
 *  - HANYA di web/browser — TIDAK muncul saat dibuka dari aplikasi
 *    (PWA standalone / TWA Android / iOS standalone).
 *  - Maksimal sekali per 24 jam (disimpan di localStorage).
 * Tautan unduh dari NEXT_PUBLIC_APK_URL; bila kosong → arahkan ke /unduh-apk.
 */
const KEY = "bm_apk_banner_at";
const DAY_MS = 24 * 60 * 60 * 1000;

export function ApkBanner() {
  const [show, setShow] = useState(false);
  const apkUrl = APK_DOWNLOAD_URL;
  const isFile = apkUrl.toLowerCase().endsWith(".apk");

  useEffect(() => {
    try {
      const nav = window.navigator as Navigator & { standalone?: boolean };
      const inApp =
        window.matchMedia("(display-mode: standalone)").matches ||
        nav.standalone === true ||
        document.referrer.startsWith("android-app://");
      if (inApp) return; // dibuka dari aplikasi → jangan tampilkan

      const last = Number(localStorage.getItem(KEY) || "0");
      if (Date.now() - last < DAY_MS) return; // sudah tampil < 24 jam lalu

      setShow(true);
    } catch {
      /* localStorage/matchMedia tak tersedia → abaikan */
    }
  }, []);

  function remember() {
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-16 z-50 px-3 lg:bottom-4"
      role="dialog"
      aria-label="Ajakan unduh aplikasi"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-sm border border-line bg-surface px-4 py-3 shadow-lg">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">Pasang aplikasi Blitar Mengaji</p>
          <p className="text-xs text-muted">Lebih cepat di HP — unduh APK Android.</p>
        </div>
        <a
          href={apkUrl}
          onClick={remember}
          download={isFile || undefined}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-brand-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-700"
        >
          <Download className="h-4 w-4" /> Unduh
        </a>
        <button
          type="button"
          onClick={() => {
            remember();
            setShow(false);
          }}
          aria-label="Tutup"
          className="shrink-0 text-muted transition-colors hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
