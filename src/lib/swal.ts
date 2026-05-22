"use client";
import Swal, { type SweetAlertIcon } from "sweetalert2";

/**
 * Helper SweetAlert2 terpusat — dipakai di komponen client.
 * Toast: success/error/warning/info (pojok kanan atas, auto-hilang).
 * Dialog: konfirmasi (mis. hapus) bergaya craft.
 */
export function showToast(icon: "success" | "error" | "warning" | "info", title: string) {
  return Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title,
    showConfirmButton: false,
    timer: icon === "error" ? 5000 : 3000,
    timerProgressBar: true,
  });
}

export const toastSuccess = (msg: string) => showToast("success", msg);
export const toastError = (msg: string) => showToast("error", msg);
export const toastWarning = (msg: string) => showToast("warning", msg);
export const toastInfo = (msg: string) => showToast("info", msg);

export async function confirmDialog(opts: {
  title?: string;
  text?: string;
  confirmText?: string;
  icon?: SweetAlertIcon;
  danger?: boolean;
} = {}): Promise<boolean> {
  const res = await Swal.fire({
    title: opts.title ?? "Yakin?",
    text: opts.text,
    icon: opts.icon ?? "warning",
    showCancelButton: true,
    confirmButtonText: opts.confirmText ?? "Ya, lanjut",
    cancelButtonText: "Batal",
    confirmButtonColor: opts.danger ? "#c0392b" : "#0E5C46",
    cancelButtonColor: "#9aa1ab",
    reverseButtons: true,
  });
  return res.isConfirmed;
}
