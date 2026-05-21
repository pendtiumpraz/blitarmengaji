"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock } from "lucide-react";
import { resetPassword, type ResetState } from "@/lib/actions/reset-confirm";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

const inputCls =
  "h-11 w-full rounded-sm border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const iconCls = "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted";

export function ResetForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetState | undefined, FormData>(
    resetPassword,
    undefined,
  );

  // Sukses: tampilkan pesan + tautan ke /masuk (sembunyikan form).
  if (state?.ok) {
    return (
      <div className="space-y-4">
        <p className="rounded-sm bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {state.message}
        </p>
        <Button href="/masuk?reset=1" size="lg" className="w-full">
          Lanjut Masuk
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />

      <Field label="Kata sandi baru" htmlFor="password">
        <div className="relative">
          <Lock className={iconCls} />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Minimal 8 karakter"
            className={inputCls}
          />
        </div>
      </Field>

      <Field label="Konfirmasi kata sandi" htmlFor="confirmPassword">
        <div className="relative">
          <Lock className={iconCls} />
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Ulangi kata sandi baru"
            className={inputCls}
          />
        </div>
      </Field>

      {state && !state.ok ? (
        <p className="rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan Kata Sandi"}
      </Button>

      <p className="text-center text-[11px] text-muted">
        Ingat kata sandimu?{" "}
        <Link href="/masuk" className="font-bold text-brand-600 hover:text-brand-700">
          Kembali masuk
        </Link>
      </p>
    </form>
  );
}
