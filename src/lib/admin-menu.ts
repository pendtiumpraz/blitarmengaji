import {
  LayoutDashboard,
  BookOpenText,
  GraduationCap,
  MapPin,
  Wallet,
  HandHeart,
  BadgeDollarSign,
  MessageCircleQuestion,
  ShieldCheck,
  Users,
  Settings,
  Library,
  FileText,
  CalendarPlus,
  Store,
  HardDrive,
  Bot,
  Trash2,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export type AdminMenuItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** permission key yang dibutuhkan agar item tampil (dicek via RBAC). */
  permission?: string;
  section?: string;
};

/**
 * Fallback statis untuk sidebar admin. Nanti diganti/di-merge dengan tabel
 * `menu_items` dari DB + filter berdasarkan permission user (RBAC dinamis).
 */
export const adminMenu: AdminMenuItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, permission: "dashboard.view", section: "Menu" },
  { label: "Kajian & Jadwal", href: "/admin/kajian", icon: BookOpenText, permission: "kajian.view", section: "Menu" },
  { label: "Kelas Online", href: "/admin/kelas", icon: GraduationCap, permission: "course.create", section: "Menu" },
  { label: "Titik Dakwah", href: "/admin/titik", icon: MapPin, permission: "titik.view", section: "Menu" },
  { label: "Keuangan", href: "/admin/keuangan", icon: Wallet, permission: "finance.view", section: "Menu" },
  { label: "Donasi", href: "/admin/donasi", icon: HandHeart, permission: "donation.view", section: "Menu" },
  { label: "Konfirmasi Bayar", href: "/admin/pembayaran", icon: BadgeDollarSign, permission: "donation.manage", section: "Menu" },
  { label: "Tanya Ustadz", href: "/admin/tanya", icon: MessageCircleQuestion, permission: "qa.view", section: "Menu" },
  { label: "Catatan", href: "/admin/catatan", icon: FileText, permission: "blog.create", section: "Konten" },
  { label: "Perpustakaan", href: "/admin/pustaka", icon: Library, permission: "library.upload", section: "Konten" },
  { label: "Event", href: "/admin/event", icon: CalendarPlus, permission: "event.create", section: "Konten" },
  { label: "Lapak", href: "/admin/lapak", icon: Store, permission: "lapak.manage_own", section: "Konten" },
  { label: "RBAC & Role", href: "/admin/rbac", icon: ShieldCheck, permission: "role.manage", section: "Sistem" },
  { label: "Pengguna", href: "/admin/users", icon: Users, permission: "user.view", section: "Sistem" },
  { label: "Storage", href: "/admin/storage", icon: HardDrive, permission: "storage.manage", section: "Sistem" },
  { label: "AI Provider & Model", href: "/admin/ai", icon: Bot, permission: "settings.manage", section: "Sistem" },
  { label: "Pengaturan", href: "/admin/settings", icon: Settings, permission: "settings.manage", section: "Sistem" },
  { label: "Recycle Bin", href: "/admin/sampah", icon: Trash2, permission: "trash.manage", section: "Sistem" },
  { label: "Audit Log", href: "/admin/audit", icon: ScrollText, permission: "audit.view", section: "Sistem" },
];
