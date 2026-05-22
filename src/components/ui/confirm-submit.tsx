"use client";

import type { ReactNode } from "react";
import { confirmDialog } from "@/lib/swal";

/**
 * Tombol submit yang menampilkan dialog konfirmasi SweetAlert dulu.
 * Taruh di dalam <form action={serverAction}> untuk aksi destruktif (hapus/restore).
 */
export function ConfirmSubmit({
  children,
  title,
  text,
  confirmText,
  danger = true,
  className,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  title?: string;
  text?: string;
  confirmText?: string;
  danger?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      aria-label={ariaLabel}
      onClick={async (e) => {
        e.preventDefault();
        const form = e.currentTarget.form;
        const ok = await confirmDialog({
          title: title ?? "Hapus data ini?",
          text: text ?? "Tindakan ini dapat dipulihkan dari Recycle Bin.",
          confirmText: confirmText ?? "Ya, hapus",
          danger,
        });
        if (ok) form?.requestSubmit();
      }}
    >
      {children}
    </button>
  );
}
