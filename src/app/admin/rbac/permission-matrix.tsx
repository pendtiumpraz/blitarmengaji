"use client";

import { useState } from "react";
import { Check, Save, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { saveRolePermissions } from "@/lib/actions/rbac";
import type { PermissionGroup } from "@/lib/queries/rbac";

/** Label grup yang lebih ramah (fallback ke key grup mentah). */
const GROUP_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  kajian: "Kajian",
  jadwal: "Jadwal",
  titik: "Titik Dakwah",
  media: "Media Partner",
  partner: "Partner Usaha",
  ustadz: "Ustadz",
  finance: "Keuangan",
  donation: "Donasi",
  gallery: "Galeri",
  video: "Video",
  blog: "Catatan / Blog",
  qa: "Tanya Ustadz",
  library: "Perpustakaan",
  course: "Kelas",
  event: "Event",
  lapak: "Lapak",
  user: "Pengguna",
  rbac: "RBAC",
  ai: "AI",
  settings: "Pengaturan",
  trash: "Sampah",
  storage: "Storage",
  payment: "Pembayaran",
};

export function PermissionMatrix({
  roleId,
  roleName,
  affectedUsers,
  groups,
  checkedKeys,
}: {
  roleId: string;
  roleName: string;
  affectedUsers: number;
  groups: PermissionGroup[];
  checkedKeys: string[];
}) {
  const initial = new Set(checkedKeys);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(initial));
  const [dirty, setDirty] = useState(false);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDirty(true);
  }

  function reset() {
    setChecked(new Set(initial));
    setDirty(false);
  }

  return (
    <Card className="overflow-hidden">
      {/* Form server action: submit semua checkbox name="perm" yang tercentang. */}
      <form action={saveRolePermissions}>
        <input type="hidden" name="roleId" value={roleId} />

        {/* Header panel edit */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-brand-50/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-brand-600" />
            <div>
              <h4 className="font-bold text-ink">
                Edit Permission — Role: <span className="text-brand-700">{roleName}</span>
              </h4>
              <p className="text-xs text-muted">
                Centang permission per grup modul. Perubahan memengaruhi {affectedUsers} user.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={reset} disabled={!dirty}>
              Batal
            </Button>
            <Button type="submit" size="sm">
              <Save className="h-4 w-4" /> Simpan
            </Button>
          </div>
        </div>

        {/* Matriks per grup */}
        {groups.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Belum ada permission terdaftar.</p>
        ) : (
          <div className="divide-y divide-line">
            {groups.map((g) => (
              <div key={g.group} className="px-5 py-4">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                  {GROUP_LABEL[g.group] ?? g.group}
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {g.permissions.map((p) => {
                    const on = checked.has(p.key);
                    return (
                      <label
                        key={p.key}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-sm border px-3 py-2 text-sm transition-colors",
                          on
                            ? "border-brand-600 bg-brand-50/60"
                            : "border-line bg-surface hover:border-brand-600/50",
                        )}
                      >
                        {/* checkbox asli (tersembunyi) → terkirim ke server action saat tercentang. */}
                        <input
                          type="checkbox"
                          name="perm"
                          value={p.key}
                          checked={on}
                          onChange={() => toggle(p.key)}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-[4px] border transition-colors",
                            on
                              ? "border-brand-600 bg-brand-600 text-white"
                              : "border-line bg-surface text-transparent",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-ink">{p.label}</span>
                          <code className="block truncate text-[11px] text-muted">{p.key}</code>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="border-t border-line px-5 py-3 text-[11px] text-muted">
          Disimpan ke tabel <code className="rounded bg-brand-50 px-1 py-0.5">role_permissions</code>{" "}
          (hapus mapping lama → insert yang dipilih). Centang di sini menentukan tombol &amp; menu
          yang dirender per role.
        </p>
      </form>
    </Card>
  );
}
