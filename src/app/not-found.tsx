import { Crest } from "@/components/Crest";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <main className="relative flex min-h-[70vh] flex-1 items-center overflow-hidden bg-cream text-ink">
      <div className="pat-girih-dark absolute inset-0 opacity-70" aria-hidden />
      <Container className="relative z-10 py-16 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <Crest className="h-16 w-16" />

          <p className="display mt-6 text-7xl font-bold leading-none text-brand-200 sm:text-8xl">
            404
          </p>

          <div className="-mt-2 grid h-20 w-20 place-items-center rounded-full bg-brand-50">
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9 text-brand-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
            </svg>
          </div>

          <h1 className="display mt-5 text-2xl font-semibold">Halaman tidak ditemukan</h1>
          <p className="mt-2 leading-relaxed text-muted">
            Sepertinya kamu tersesat dari jalan. Mari kembali ke jalan utama dan
            lanjutkan menuntut ilmu.
          </p>

          <Button href="/" className="mt-7">
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
              <path d="M3 9.5 12 3l9 6.5" />
              <path d="M5 9v11h14V9" />
            </svg>
            Kembali ke Beranda
          </Button>
        </div>
      </Container>
    </main>
  );
}
