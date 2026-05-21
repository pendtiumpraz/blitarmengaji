import { Crest } from "@/components/Crest";
import { Container } from "@/components/ui/container";

/** Fallback Suspense root — splash craft + skeleton shimmer agar tenang & stabil. */
export default function Loading() {
  return (
    <main className="relative flex min-h-[70vh] flex-1 items-center overflow-hidden bg-cream text-ink">
      <style>{`
        @keyframes bm-shimmer { to { background-position: -200% 0 } }
        .bm-sk {
          background: linear-gradient(
            90deg,
            var(--c-line, #E3D9C4) 25%,
            var(--c-surface, #FBF7EE) 37%,
            var(--c-line, #E3D9C4) 63%
          );
          background-size: 200% 100%;
          animation: bm-shimmer 1.3s ease-in-out infinite;
        }
        @keyframes bm-breathe { 0%,100% { opacity:.55; transform:scale(.97) } 50% { opacity:1; transform:scale(1) } }
        .bm-breathe { animation: bm-breathe 1.8s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .bm-sk, .bm-breathe { animation: none }
        }
      `}</style>

      <div className="pat-girih-dark absolute inset-0 opacity-70" aria-hidden />

      <Container className="relative z-10 py-16">
        <div
          className="mx-auto flex max-w-md flex-col items-center text-center"
          role="status"
          aria-live="polite"
        >
          <Crest className="bm-breathe h-16 w-16" />
          <p className="display mt-5 text-xl font-semibold">Memuat…</p>
          <p className="mt-1 text-sm text-muted">Mohon tunggu sejenak.</p>

          <span className="sr-only">Sedang memuat halaman</span>

          {/* Skeleton kartu agar tata letak tetap stabil */}
          <div className="mt-8 w-full space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-[3px] border border-line bg-surface p-3"
              >
                <div className="bm-sk h-12 w-12 shrink-0 rounded-[3px]" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="bm-sk h-3.5 w-3/4 rounded" />
                  <div className="bm-sk h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
