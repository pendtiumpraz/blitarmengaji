"use client";

import { useEffect } from "react";
import { Crest } from "@/components/Crest";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Catat ke console untuk diagnosa; jangan tampilkan stack ke pengguna.
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-[70vh] flex-1 items-center overflow-hidden bg-cream text-ink">
      <div className="pat-girih-dark absolute inset-0 opacity-70" aria-hidden />
      <Container className="relative z-10 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <Crest className="h-16 w-16" />

          <div className="mt-6 grid h-24 w-24 place-items-center rounded-full bg-brand-50">
            <svg
              viewBox="0 0 24 24"
              className="h-11 w-11 text-brand-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 9v4" />
              <path d="M10.36 3.6 2.2 17.8A2 2 0 0 0 3.94 21h16.12a2 2 0 0 0 1.74-3.2L13.64 3.6a2 2 0 0 0-3.28 0z" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <h1 className="display mt-5 text-2xl font-semibold">Terjadi kesalahan</h1>
          <p className="mt-2 leading-relaxed text-muted">
            Maaf, ini bukan salahmu. Ada gangguan saat memuat halaman ini.
            Silakan coba lagi beberapa saat.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => reset()}>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Coba lagi
            </Button>
            <Button href="/" variant="outline">
              Ke Beranda
            </Button>
          </div>

          {error.digest ? (
            <p className="mt-4 text-xs text-muted">Kode galat: {error.digest}</p>
          ) : null}
        </div>
      </Container>
    </main>
  );
}
