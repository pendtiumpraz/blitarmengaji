"use client";

import { useActionState } from "react";
import { User, Mail, Lock } from "lucide-react";
import { registerUser } from "@/lib/actions/register";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/input";

const inputCls =
  "h-11 w-full rounded-sm border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const iconCls = "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted";

export function RegisterForm() {
  const [error, formAction, pending] = useActionState(registerUser, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nama lengkap" htmlFor="name">
        <div className="relative">
          <User className={iconCls} />
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Nama lengkapmu"
            className={inputCls}
          />
        </div>
      </Field>

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

      <Field label="Kata sandi" htmlFor="password">
        <div className="relative">
          <Lock className={iconCls} />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
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
            placeholder="Ulangi kata sandi"
            className={inputCls}
          />
        </div>
      </Field>

      {error ? (
        <p className="rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">{error}</p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Daftar"}
      </Button>
    </form>
  );
}
