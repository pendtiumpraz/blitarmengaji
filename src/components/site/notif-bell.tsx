import Link from "next/link";
import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { unreadCount } from "@/lib/queries/notifications";

/**
 * Lonceng notifikasi di header (server component kecil).
 * - Tampil hanya bila user login (sesi valid); kalau tidak → null.
 * - Menampilkan ikon Bell + badge jumlah notifikasi BELUM dibaca.
 * - Tidak ada dropdown realtime; cukup tautan ke /notifikasi.
 */
export async function NotifBell() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const n = await unreadCount(userId);
  const label =
    n > 0 ? `Notifikasi, ${n} belum dibaca` : "Notifikasi, tidak ada yang baru";
  const display = n > 99 ? "99+" : String(n);

  return (
    <Link
      href="/notifikasi"
      aria-label={label}
      title="Notifikasi"
      className="relative grid h-10 w-10 place-items-center rounded-sm text-ink/70 transition-colors hover:bg-brand-50 hover:text-brand-600"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {n > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gold px-1 text-[10px] font-bold leading-none text-[#241f10] ring-2 ring-cream">
          {display}
        </span>
      ) : null}
    </Link>
  );
}
