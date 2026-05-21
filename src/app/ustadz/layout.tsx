import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { logoutAction } from "@/lib/actions/auth";
import { UstadzSidebar, UstadzMobileNav } from "./ustadz-nav";

/**
 * Layout DASHBOARD USTADZ (/ustadz) — ruang khusus role Ustadz.
 * Role Ustadz tidak punya 'dashboard.view' (tak bisa /admin), jadi guard di sini
 * memberi akses ke siapa pun yang punya salah satu kapabilitas kontributor.
 */
export default async function UstadzLayout({ children }: { children: ReactNode }) {
  const s = await auth();
  if (!s?.user?.id) redirect("/masuk");

  const perms = await getUserPermissions(s.user.id);
  if (
    !perms.includes("*") &&
    !perms.includes("qa.answer") &&
    !perms.includes("blog.create") &&
    !perms.includes("library.upload") &&
    !perms.includes("course.create")
  ) {
    redirect("/");
  }

  const userName = s.user.name?.trim() || "Ustadz";
  const initial = userName.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex min-h-screen">
      <UstadzSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-cream">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
          <p className="font-kufi text-sm text-brand-700 md:hidden">Ruang Ustadz</p>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {initial}
              </div>
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

        <UstadzMobileNav />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
