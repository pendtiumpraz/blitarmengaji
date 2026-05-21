import { AdminPageHeader } from "@/components/admin/page-header";
import {
  getSettings,
  listPaymentMethods,
  listStorageConfigs,
  listThemes,
  settingString,
} from "@/lib/queries/settings";
import { SettingsForm } from "./form";

// Modul Pengaturan (admin) — data NYATA dari tabel settings, ui_themes,
// payment_methods, storage_configs. Simpan via server action saveSettings/savePaymentMethod.
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [settings, themes, paymentMethods, storageConfigs] = await Promise.all([
    getSettings(),
    listThemes(),
    listPaymentMethods(),
    listStorageConfigs(),
  ]);

  const initial = {
    siteName: settingString(settings, "site_name"),
    siteDescription: settingString(settings, "site_description"),
    contactEmail: settingString(settings, "contact_email"),
    contactWhatsapp: settingString(settings, "contact_whatsapp"),
    defaultTheme: settingString(settings, "default_theme"),
    instagram: settingString(settings, "social_instagram"),
    youtube: settingString(settings, "social_youtube"),
    facebook: settingString(settings, "social_facebook"),
    siteLogo: settingString(settings, "site_logo"),
  };

  return (
    <div>
      <AdminPageHeader
        title="Pengaturan"
        subtitle="Atur branding, tema default, metode pembayaran, dan penyimpanan platform Blitar Mengaji. Data langsung dari Neon."
      />
      <SettingsForm
        initial={initial}
        themes={themes}
        paymentMethods={paymentMethods}
        storageConfigs={storageConfigs}
      />
    </div>
  );
}
