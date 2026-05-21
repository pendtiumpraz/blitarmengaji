import Link from "next/link";
import { Globe } from "lucide-react";
import { Crest } from "@/components/Crest";
import { Button } from "@/components/ui/button";
import { googleEnabled } from "@/lib/auth";
import { googleSignIn } from "@/lib/actions/auth";
import { LoginForm } from "./login-form";

export default function MasukPage() {
  return (
    <div className="space-y-6">
      {/* Crest + judul */}
      <div className="text-center">
        <Crest className="mx-auto h-16 w-16" />
        <h1 className="display mt-4 text-3xl text-ink">Selamat Datang</h1>
        <p className="mt-1.5 text-sm text-muted">Masuk untuk bertanya, belajar &amp; menyimpan jadwal</p>
      </div>

      {/* Tab Masuk / Daftar */}
      <div className="flex rounded-full bg-black/5 p-1 text-sm font-bold">
        <span className="flex-1 rounded-full bg-surface py-2 text-center text-brand-700 shadow-sm">Masuk</span>
        <Link href="/daftar" className="flex-1 rounded-full py-2 text-center text-muted transition-colors hover:text-ink">
          Daftar
        </Link>
      </div>

      {/* Form login (NextAuth Credentials) */}
      <LoginForm />
      <div className="-mt-2 text-right">
        <Link href="/lupa-sandi" className="text-[11px] font-bold text-brand-600 hover:text-brand-700">
          Lupa sandi?
        </Link>
      </div>

      {/* Pemisah */}
      <div className="flex items-center gap-3 text-[11px] text-muted">
        <div className="h-px flex-1 bg-line" />
        atau
        <div className="h-px flex-1 bg-line" />
      </div>

      {/* OAuth Google — hanya aktif bila kredensial dikonfigurasi */}
      {googleEnabled ? (
        <form action={googleSignIn}>
          <Button type="submit" variant="outline" size="lg" className="w-full">
            <Globe className="h-4 w-4" />
            Lanjut dengan Google
          </Button>
        </form>
      ) : (
        <Button type="button" variant="outline" size="lg" className="w-full" disabled>
          <Globe className="h-4 w-4" />
          Google OAuth belum dikonfigurasi
        </Button>
      )}

      <p className="text-center text-[11px] text-muted">Auth via NextAuth (Credentials + secret). OAuth opsional nanti.</p>
    </div>
  );
}
