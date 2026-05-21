import { ImageIcon, MessageCircle, Store } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { listProducts, type ProductListItem } from "@/lib/queries/lapak";

export const dynamic = "force-dynamic";

export const metadata = { title: "Lapak" };

function rupiah(price: string | null): string {
  if (price === null) return "Hubungi penjual";
  const n = Number(price);
  if (!Number.isFinite(n)) return "Hubungi penjual";
  return "Rp " + n.toLocaleString("id-ID");
}

/**
 * Bangun URL WhatsApp dari kontak produk.
 * Prioritas: contactLink (boleh wa.me / http lain) -> nomor WA partner.
 * Return null bila tidak ada kontak sama sekali.
 */
function waHref(p: ProductListItem): string | null {
  const pesan = encodeURIComponent(
    `Assalamu'alaikum, saya tertarik dengan produk "${p.title}" (${rupiah(
      p.price,
    )}) dari ${p.partnerName} di Lapak Blitar Mengaji.`,
  );

  const link = p.contactLink?.trim();
  if (link) {
    // Link sudah lengkap (wa.me / https / tel) — pakai apa adanya.
    if (/^https?:\/\//i.test(link) || link.startsWith("tel:")) return link;
    // Anggap berupa nomor telepon -> normalkan ke wa.me.
    const digits = link.replace(/[^0-9]/g, "");
    if (digits) return `https://wa.me/${digits}?text=${pesan}`;
  }

  const wa = p.partnerWa?.replace(/[^0-9]/g, "");
  if (wa) return `https://wa.me/${wa}?text=${pesan}`;

  return null;
}

export default async function LapakPage() {
  const produk = await listProducts();

  return (
    <Container className="py-10">
      <SectionHeading
        align="left"
        eyebrow="Dukung Usaha Jamaah"
        title="Lapak UMKM"
        subtitle="Belanja sekaligus menyokong usaha jamaah Blitar Raya — hubungi penjual langsung lewat WhatsApp."
        className="mb-4"
      />

      {/* catatan kebijakan */}
      <div className="mb-6 flex items-center gap-2 rounded-[3px] border border-line bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
        <Store className="h-4 w-4 shrink-0" />
        <span>Setiap partner boleh menampilkan maksimal 3 produk aktif.</span>
      </div>

      {produk.length === 0 ? (
        /* EMPTY STATE ramah */
        <div className="flex flex-col items-center justify-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50">
            <Store className="h-7 w-7 text-brand-600" />
          </div>
          <p className="display mt-4 text-lg text-ink">Belum ada produk di lapak</p>
          <p className="mt-1 max-w-[42ch] text-sm text-muted">
            Lapak UMKM jamaah masih kosong untuk saat ini. Produk dari partner usaha akan tampil di
            sini setelah dipublikasikan, insyaAllah.
          </p>
        </div>
      ) : (
        /* grid kartu produk: 2-4 kolom responsif */
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {produk.map((p) => {
            const href = waHref(p);
            return (
              <div key={p.id} className="overflow-hidden rounded-[3px] border border-line bg-surface">
                {/* poster: gambar dari DB bila ada, jika tidak placeholder ornamen */}
                {p.posterImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.posterImage}
                    alt={p.title}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="relative grid h-28 place-items-center overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500">
                    <div className="pat-girih-light absolute inset-0" />
                    <ImageIcon className="relative z-10 h-8 w-8 text-white/80" />
                  </div>
                )}
                <div className="p-2.5">
                  <p className="line-clamp-2 text-xs font-bold leading-tight text-ink">{p.title}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-brand-700">{rupiah(p.price)}</p>
                  <p className="truncate text-[11px] text-muted">
                    {p.partnerName}
                    {p.partnerCategory ? ` · ${p.partnerCategory}` : ""}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex h-8 w-full items-center justify-center gap-1 rounded-full bg-green-600 text-[11px] font-bold text-white transition-colors hover:bg-green-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  ) : (
                    <span className="mt-2 flex h-8 w-full items-center justify-center rounded-full bg-black/5 text-[11px] font-bold text-muted">
                      Kontak belum tersedia
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
