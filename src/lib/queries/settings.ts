import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Query layer PENGATURAN — sumber data NYATA dari Neon (Drizzle).
 * - settings: key/value JSON (1 row per key) -> map key->value_json.
 * - payment_methods & storage_configs & ui_themes: default WHERE deleted_at IS NULL
 *   (soft delete, lihat AGENTS.md §4).
 */

/* ------------------------------------------------------------------ */
/* settings (key/value)                                               */
/* ------------------------------------------------------------------ */

export type SettingsMap = Record<string, unknown>;

/** Ambil semua row settings -> map key => value_json. */
export async function getSettings(): Promise<SettingsMap> {
  const rows = await db
    .select({ key: schema.settings.key, valueJson: schema.settings.valueJson })
    .from(schema.settings);

  const map: SettingsMap = {};
  for (const r of rows) map[r.key] = r.valueJson;
  return map;
}

/** Helper baca 1 nilai settings sebagai string (null bila kosong). */
export function settingString(map: SettingsMap, key: string): string {
  const v = map[key];
  return typeof v === "string" ? v : "";
}

/* ------------------------------------------------------------------ */
/* payment_methods                                                    */
/* ------------------------------------------------------------------ */

export type PaymentMethodRow = {
  id: string;
  ownerType: "global" | "user" | "titik" | "media" | "partner" | "ustadz";
  type: "qris" | "bank" | "ewallet";
  qrisImage: string | null;
  bankName: string | null;
  accountNo: string | null;
  accountName: string | null;
  waNumber: string | null;
  isActive: boolean;
};

/** Daftar metode pembayaran global aktif (terbaru dulu). */
export async function listPaymentMethods(): Promise<PaymentMethodRow[]> {
  const rows = await db
    .select({
      id: schema.paymentMethods.id,
      ownerType: schema.paymentMethods.ownerType,
      type: schema.paymentMethods.type,
      qrisImage: schema.paymentMethods.qrisImage,
      bankName: schema.paymentMethods.bankName,
      accountNo: schema.paymentMethods.accountNo,
      accountName: schema.paymentMethods.accountName,
      waNumber: schema.paymentMethods.waNumber,
      isActive: schema.paymentMethods.isActive,
    })
    .from(schema.paymentMethods)
    .where(
      and(
        eq(schema.paymentMethods.ownerType, "global"),
        isNull(schema.paymentMethods.deletedAt),
      ),
    )
    .orderBy(desc(schema.paymentMethods.createdAt));

  return rows;
}

/* ------------------------------------------------------------------ */
/* storage_configs                                                    */
/* ------------------------------------------------------------------ */

// Sumber kebenaran tunggal di src/lib/queries/storage.ts (re-export agar
// import lama tetap jalan; token tidak pernah di-select / ke client).
export { listStorageConfigs } from "@/lib/queries/storage";
export type { StorageConfigRow } from "@/lib/queries/storage";

/* ------------------------------------------------------------------ */
/* ui_themes                                                          */
/* ------------------------------------------------------------------ */

export type ThemeRow = {
  id: string;
  name: string;
  slug: string;
  tokensJson: unknown;
  isActive: boolean;
  isSystem: boolean;
};

/** Daftar tema UI aktif (untuk pilihan tema default). */
export async function listThemes(): Promise<ThemeRow[]> {
  const rows = await db
    .select({
      id: schema.uiThemes.id,
      name: schema.uiThemes.name,
      slug: schema.uiThemes.slug,
      tokensJson: schema.uiThemes.tokensJson,
      isActive: schema.uiThemes.isActive,
      isSystem: schema.uiThemes.isSystem,
    })
    .from(schema.uiThemes)
    .where(and(eq(schema.uiThemes.isActive, true), isNull(schema.uiThemes.deletedAt)))
    .orderBy(asc(schema.uiThemes.name));

  return rows;
}
