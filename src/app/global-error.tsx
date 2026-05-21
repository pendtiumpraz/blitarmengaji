"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Error boundary level-root. Menggantikan root layout saat error fatal,
 * jadi WAJIB merender <html> & <body> sendiri. Pakai inline style berbasis
 * token CSS agar tetap tampil rapi meski layout & font gagal dimuat.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id" data-theme="teduh">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "var(--c-cream, #F4EEE1)",
          color: "var(--c-ink, #23241E)",
          fontFamily:
            'var(--font-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "26rem" }}>
          <svg
            viewBox="0 0 56 56"
            width="64"
            height="64"
            role="img"
            aria-label="Blitar Mengaji"
          >
            <rect x="2" y="2" width="52" height="52" rx="13" fill="#0E5C46" />
            <rect
              x="7.5"
              y="7.5"
              width="41"
              height="41"
              rx="9"
              fill="none"
              stroke="#C9A227"
              strokeOpacity=".55"
            />
            <path
              d="M19 44 L19 27 C19 16 27 13 28 13 C29 13 37 16 37 27 L37 44"
              fill="none"
              stroke="#E6CC8A"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <g transform="translate(28 9.5)" fill="#C9A227">
              <rect x="-3.2" y="-3.2" width="6.4" height="6.4" />
              <rect
                x="-3.2"
                y="-3.2"
                width="6.4"
                height="6.4"
                transform="rotate(45)"
              />
            </g>
          </svg>

          <h1
            style={{
              fontFamily: 'var(--font-fraunces), Georgia, serif',
              fontWeight: 600,
              fontSize: "1.5rem",
              margin: "1.25rem 0 0",
            }}
          >
            Terjadi kesalahan
          </h1>
          <p
            style={{
              color: "var(--c-muted, #6F6A5C)",
              lineHeight: 1.6,
              margin: "0.5rem 0 0",
            }}
          >
            Maaf, aplikasi mengalami gangguan. Silakan muat ulang halaman ini.
          </p>

          <button
            onClick={() => reset()}
            style={{
              marginTop: "1.75rem",
              height: "2.75rem",
              padding: "0 1.5rem",
              borderRadius: "3px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.875rem",
              background: "var(--c-brand-600, #0E5C46)",
              color: "#ffffff",
            }}
          >
            Muat ulang
          </button>

          {error.digest ? (
            <p
              style={{
                marginTop: "1rem",
                fontSize: "0.75rem",
                color: "var(--c-muted, #6F6A5C)",
              }}
            >
              Kode galat: {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
