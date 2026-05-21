"use client";

import { useState, type ChangeEvent } from "react";
import { UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Input file craft + preview. File ASLI dikirim lewat <input name> (multipart) ke
 * Server Action, lalu di-upload ke Vercel Blob via uploadToBlob. Tidak ada fetch di sini.
 */
export function FileUpload({
  name,
  accept = "image/*",
  label,
  defaultUrl,
  className,
}: {
  name: string;
  accept?: string;
  label?: string;
  defaultUrl?: string | null;
  className?: string;
}) {
  const isImage = accept.includes("image");
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(defaultUrl ?? null);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
  }

  return (
    <div className={className}>
      {label ? <p className="mb-1 text-xs font-bold text-muted">{label}</p> : null}
      <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-dashed border-line bg-cream px-3 py-3 transition-colors hover:border-brand-600">
        {preview && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-12 w-12 rounded object-cover" />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded bg-brand-50 text-brand-600">
            {isImage ? <UploadCloud className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </span>
        )}
        <span className={cn("flex-1 text-sm", fileName ? "text-ink" : "text-muted")}>
          {fileName ?? (defaultUrl ? "Ganti berkas…" : "Pilih berkas / seret ke sini")}
        </span>
        <input type="file" name={name} accept={accept} onChange={onChange} className="hidden" />
      </label>
    </div>
  );
}
