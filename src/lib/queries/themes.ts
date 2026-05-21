import { and, asc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Query layer TEMA UI — sumber data NYATA dari Neon (Drizzle).
 * - ui_themes: default WHERE deleted_at IS NULL (soft delete, lihat AGENTS.md §4).
 * - Hanya tema aktif (is_active = true) yang ditawarkan ke switcher.
 */

export type ActiveTheme = {
  slug: string;
  name: string;
};

/** Daftar tema UI aktif untuk theme switcher (slug + name, urut nama). */
export async function listActiveThemes(): Promise<ActiveTheme[]> {
  const rows = await db
    .select({
      slug: schema.uiThemes.slug,
      name: schema.uiThemes.name,
    })
    .from(schema.uiThemes)
    .where(
      and(eq(schema.uiThemes.isActive, true), isNull(schema.uiThemes.deletedAt)),
    )
    .orderBy(asc(schema.uiThemes.name));

  return rows;
}
