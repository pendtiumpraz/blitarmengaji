import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/masuk");

  // RBAC: hanya yang punya akses admin (super admin '*' atau dashboard.view)
  const perms = await getUserPermissions(session.user.id);
  if (!perms.includes("*") && !perms.includes("dashboard.view")) redirect("/");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col bg-cream">
        <AdminTopbar userName={session.user.name ?? "Admin"} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
