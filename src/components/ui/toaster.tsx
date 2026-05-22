"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import "sweetalert2/dist/sweetalert2.min.css";
import { showToast } from "@/lib/swal";

/**
 * Pemicu toast global dari query-param hasil server action.
 * Action cukup redirect dgn `?ok=...`, `?err=...`, `?warn=...`, atau `?info=...`.
 * Param dibersihkan dari URL setelah toast tampil.
 */
export function Toaster() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const map: [string, "success" | "error" | "warning" | "info"][] = [
      ["ok", "success"],
      ["err", "error"],
      ["warn", "warning"],
      ["info", "info"],
    ];
    let fired = false;
    for (const [key, icon] of map) {
      const msg = sp.get(key);
      if (msg) {
        showToast(icon, msg);
        fired = true;
      }
    }
    if (fired) {
      const params = new URLSearchParams(Array.from(sp.entries()));
      ["ok", "err", "warn", "info"].forEach((k) => params.delete(k));
      const qs = params.toString();
      router.replace(pathname + (qs ? `?${qs}` : ""), { scroll: false });
    }
  }, [sp, pathname, router]);

  return null;
}
