"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Server action (MUTATION) untuk TEMA UI.
 * - Sumber kebenaran SSR = cookie 'theme' (dibaca di layout) agar tak ada flash.
 * - Bila user login, simpan juga preferensi ke users.theme_pref.
 * - Soft delete dihormati (WHERE deleted_at IS NULL, lihat AGENTS.md §4).
 *
 * Signature praktis untuk dipanggil dari client: setTheme(slug).
 * Tetap mendukung pemanggilan via <form action> (FormData berisi 'theme').
 */

const COOKIE_NAME = "theme";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setTheme(input: string | FormData): Promise<void> {
  const slug = typeof input === "string" ? input : String(input.get("theme") ?? "");
  if (!slug) {
    throw new Error("Slug tema kosong.");
  }

  // Validasi: hanya terima slug tema yang AKTIF & belum terhapus.
  const rows = await db
    .select({ slug: schema.uiThemes.slug })
    .from(schema.uiThemes)
    .where(
      and(
        eq(schema.uiThemes.slug, slug),
        eq(schema.uiThemes.isActive, true),
        isNull(schema.uiThemes.deletedAt),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    throw new Error("Tema tidak dikenal atau tidak aktif.");
  }

  // Sumber kebenaran SSR: cookie 'theme'.
  const store = await cookies();
  store.set(COOKIE_NAME, slug, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  // Bila login, simpan preferensi ke profil user.
  const session = await auth();
  const userId = session?.user?.id;
  if (userId) {
    await db
      .update(schema.users)
      .set({ themePref: slug, updatedAt: new Date() })
      .where(and(eq(schema.users.id, userId), isNull(schema.users.deletedAt)));
  }

  revalidatePath("/");
}
