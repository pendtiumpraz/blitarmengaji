import { Bell, Search, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";

export function AdminTopbar({ userName = "Admin" }: { userName?: string }) {
  const initial = userName.trim().charAt(0).toUpperCase() || "A";
  return (
    <header className="flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <AdminMobileNav />
        <div className="hidden h-9 w-72 max-w-[50vw] items-center gap-2 rounded-sm bg-cream px-3 sm:flex">
          <Search className="h-4 w-4 text-muted" />
          <span className="text-sm text-muted">Cari…</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button type="button" aria-label="Notifikasi" className="text-muted hover:text-ink">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{initial}</div>
          <span className="hidden text-sm font-semibold sm:inline">{userName}</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            title="Keluar"
            className="flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-semibold text-muted hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </form>
      </div>
    </header>
  );
}
