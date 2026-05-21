"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail, ArrowRight, Info } from "lucide-react";
import { requestReset } from "@/lib/actions/reset-request";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

const inputCls =
  "h-11 w-full rounded-sm border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const iconCls = "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestReset, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Email" htmlFor="email">
        <div className="relative">
          <Mail className={iconCls} />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="nama@email.com"
            className={inputCls}
          />
        </div>
      </Field>

      {/* Pesan hasil (netral — tidak membocorkan keberadaan email) */}
      {state?.message ? (
        <p
          className={
            state.ok
              ? "rounded-sm bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
              : "rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
          }
        >
          {state.message}
        </p>
      ) : null}

      {/* Kotak tautan reset (hanya muncul bila token dibuat) */}
      {state?.resetUrl ? (
        <div className="space-y-2 rounded-sm border border-line bg-cream/60 p-4">
          <p className="text-xs font-bold text-muted">Tautan atur ulang kata sandi</p>
          <Link
            href={state.resetUrl}
            className="inline-flex items-center gap-1.5 break-all text-sm font-bold text-brand-700 underline decoration-brand-600/40 underline-offset-4 hover:text-brand-600"
          >
            Lanjut atur ulang kata sandi
            <ArrowRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            <span>
              Mode pengembangan: tautan ditampilkan di layar. Di produksi, tautan ini dikirim
              melalui email.
            </span>
          </p>
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Kirim tautan reset"}
      </Button>
    </form>
  );
}
