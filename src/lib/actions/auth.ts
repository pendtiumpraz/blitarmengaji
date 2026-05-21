"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

/** Server action login (dipakai dengan useActionState di form). */
export async function loginAction(
  _prev: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return "Email dan kata sandi wajib diisi.";

  try {
    await signIn("credentials", { email, password, redirectTo: "/admin" });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Email atau kata sandi salah.";
    }
    throw error; // penting: lempar ulang NEXT_REDIRECT (sukses login)
  }
  return undefined;
}

/** Server action login via Google OAuth. */
export async function googleSignIn(): Promise<void> {
  await signIn("google", { redirectTo: "/" });
}

/** Server action logout. */
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
