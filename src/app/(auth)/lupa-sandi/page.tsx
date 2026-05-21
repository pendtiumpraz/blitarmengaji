import Link from "next/link";
import { Crest } from "@/components/Crest";
import { ForgotPasswordForm } from "./form";

export default function LupaSandiPage() {
  return (
    <div className="space-y-6">
      {/* Crest + judul */}
      <div className="text-center">
        <Crest className="mx-auto h-16 w-16" />
        <h1 className="display mt-4 text-3xl text-ink">Lupa Kata Sandi</h1>
        <p className="mt-1.5 text-sm text-muted">
          Masukkan emailmu, kami akan membuatkan tautan untuk mengatur ulang kata sandi
        </p>
      </div>

      {/* Form permintaan reset */}
      <ForgotPasswordForm />

      <p className="text-center text-[11px] text-muted">
        Ingat kata sandimu?{" "}
        <Link href="/masuk" className="font-bold text-brand-600 hover:text-brand-700">
          Kembali masuk
        </Link>
      </p>
    </div>
  );
}
