import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, count, eq, isNull } from "drizzle-orm";
import {
  MessageCircleQuestion,
  GraduationCap,
  Download,
  CalendarCheck,
  Settings,
  Shield,
  LogOut,
  ChevronRight,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Palette,
  Check,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";
import { updateAvatar } from "@/lib/actions/profile";
import { setTheme } from "@/lib/actions/theme";
import { myEntities, type MyEntity, type MyEntityType } from "@/lib/queries/akun";
import { listActiveThemes } from "@/lib/queries/themes";

// Halaman Akun — data NYATA user dari sesi + DB. Wajib login.
export const dynamic = "force-dynamic";

type MenuItem = {
  label: string;
  href: string;
  icon: typeof MessageCircleQuestion;
  badge?: string;
  iconClass: string;
};

function MenuRow({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-brand-50/50"
    >
      <Icon className={`h-5 w-5 ${item.iconClass}`} />
      <span className="flex-1 text-sm font-semibold">{item.label}</span>
      {item.badge ? <Badge tone="brand">{item.badge}</Badge> : null}
      <ChevronRight className="h-4 w-4 text-muted" />
    </Link>
  );
}

// Label jenis pengajuan untuk section "Pengajuan Lembaga".
const entityTypeLabel: Record<MyEntityType, string> = {
  titik: "Titik Dakwah",
  ustadz: "Ustadz",
  media: "Media Partner",
  usaha: "Partner Usaha",
};

// Badge status pengajuan (pending/active/rejected).
const entityStatusBadge: Record<
  MyEntity["status"],
  { tone: "success" | "warning" | "danger"; label: string; icon: typeof CheckCircle2 }
> = {
  active: { tone: "success", label: "Aktif", icon: CheckCircle2 },
  pending: { tone: "warning", label: "Menunggu", icon: Clock },
  rejected: { tone: "danger", label: "Ditolak", icon: XCircle },
};

// Swatch warna tiap tema (primary + emas) — selaras docs/ui/theme-tokens.css.
const themeSwatch: Record<string, [string, string]> = {
  teduh: ["#0E5C46", "#C9A227"],
  modern: ["#0F766E", "#F59E0B"],
  earthy: ["#14532D", "#B45309"],
  elegan: ["#1E3A5F", "#C9A227"],
  minimalis: ["#111827", "#10B981"],
  samudra: ["#2563EB", "#06B6D4"],
  klasik: ["#7B2D24", "#B8860B"],
  senja: ["#0E6E55", "#FBBF24"],
};

export default async function AkunPage({
  searchParams,
}: {
  searchParams: Promise<{ diajukan?: string }>;
}) {
  const { diajukan } = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  // Ambil data user NYATA + hitung pertanyaan & kelas + pengajuan lembaga + tema (paralel).
  const [userRows, qCount, eCount, entities, themes, cookieStore] = await Promise.all([
    db
      .select({
        name: schema.users.name,
        email: schema.users.email,
        image: schema.users.image,
        themePref: schema.users.themePref,
      })
      .from(schema.users)
      .where(and(eq(schema.users.id, userId), isNull(schema.users.deletedAt)))
      .limit(1),
    db
      .select({ c: count() })
      .from(schema.questions)
      .where(and(eq(schema.questions.userId, userId), isNull(schema.questions.deletedAt))),
    db
      .select({ c: count() })
      .from(schema.enrollments)
      .where(and(eq(schema.enrollments.userId, userId), isNull(schema.enrollments.deletedAt))),
    myEntities(userId),
    listActiveThemes(),
    cookies(),
  ]);

  const user = userRows[0];
  if (!user) redirect("/masuk");

  // Tema aktif: preferensi user > cookie 'theme' > default 'teduh'.
  const currentTheme = user.themePref ?? cookieStore.get("theme")?.value ?? "teduh";

  // Notice sukses bila baru mengajukan (?diajukan=<jenis>).
  const diajukanLabel =
    diajukan && diajukan in entityTypeLabel
      ? entityTypeLabel[diajukan as MyEntityType]
      : diajukan
        ? "lembaga"
        : null;

  const questionCount = qCount[0]?.c ?? 0;
  const enrollmentCount = eCount[0]?.c ?? 0;
  const initial = (user.name?.trim()?.[0] ?? "J").toUpperCase();

  const primaryMenu: MenuItem[] = [
    {
      label: "Pertanyaanku",
      href: "/tanya-ustadz",
      icon: MessageCircleQuestion,
      badge: questionCount > 0 ? String(questionCount) : undefined,
      iconClass: "text-brand-600",
    },
    {
      label: "Kelasku",
      href: "/kelas",
      icon: GraduationCap,
      badge: enrollmentCount > 0 ? String(enrollmentCount) : undefined,
      iconClass: "text-brand-600",
    },
    { label: "Unduhanku", href: "/perpustakaan", icon: Download, iconClass: "text-brand-600" },
    { label: "Jadwal Tersimpan", href: "/jadwal", icon: CalendarCheck, iconClass: "text-brand-600" },
  ];

  const secondaryMenu: MenuItem[] = [
    { label: "Pengaturan", href: "/akun", icon: Settings, iconClass: "text-muted" },
    {
      label: "Ajukan jadi Pengelola/Ustadz/Partner",
      href: "/gabung",
      icon: Shield,
      iconClass: "text-muted",
    },
  ];

  return (
    <>
      {/* Header profil — panel brand ber-ornamen */}
      <section className="relative overflow-hidden rounded-b-3xl bg-brand-600 text-cream">
        <div className="pat-girih-light absolute inset-0" />
        <div className="relative z-10 px-4 pb-10 pt-6 text-center">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={`Foto ${user.name}`}
              className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-white/30"
            />
          ) : (
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-700 ring-4 ring-white/30">
              <span className="display text-2xl text-[#FBF4E2]">{initial}</span>
            </div>
          )}
          <p className="display mt-3 text-xl text-[#FBF4E2]">{user.name}</p>
          <p className="mt-0.5 text-xs text-cream/75">{user.email} · Jamaah</p>
        </div>
      </section>

      {/* Daftar menu */}
      <Container className="-mt-4 max-w-md space-y-3 pb-10">
        {/* Notice sukses setelah mengajukan lembaga (?diajukan=...) */}
        {diajukanLabel ? (
          <div className="flex items-start gap-3 rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-green-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div className="text-sm">
              <p className="font-bold">Pengajuan terkirim</p>
              <p className="mt-0.5 text-green-700">
                Pengajuan {diajukanLabel} sedang menunggu verifikasi admin. Statusnya tampil di
                bawah.
              </p>
            </div>
          </div>
        ) : null}

        {/* Ubah foto profil — server action updateAvatar (upload ke Vercel Blob) */}
        <Card className="space-y-3 p-4 shadow-sm">
          <p className="display text-base text-ink">Foto Profil</p>
          <form action={updateAvatar} className="space-y-3">
            <FileUpload
              name="avatarFile"
              accept="image/*"
              label="Foto Profil"
              defaultUrl={user.image}
            />
            <Button type="submit" size="sm" className="w-full">
              Simpan Foto
            </Button>
          </form>
        </Card>

        {/* Pengajuan Lembaga — status verifikasi entitas milik user */}
        <Card className="space-y-3 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-600" />
            <p className="display text-base text-ink">Pengajuan Lembaga</p>
          </div>

          {entities.length === 0 ? (
            <p className="text-sm text-muted">
              Belum ada pengajuan. Daftarkan titik dakwah, profil ustadz, media, atau usahamu untuk
              mengelola dashboard sendiri.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {entities.map((e, i) => {
                const sb = entityStatusBadge[e.status];
                const StatusIcon = sb.icon;
                return (
                  <li
                    key={`${e.type}-${i}`}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{e.name}</p>
                      <p className="text-xs text-muted">{entityTypeLabel[e.type]}</p>
                    </div>
                    <Badge tone={sb.tone}>
                      <StatusIcon className="h-3 w-3" />
                      {sb.label}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}

          <Button href="/gabung" size="sm" variant="outline" className="w-full">
            Ajukan jadi Pengelola/Ustadz/Partner
          </Button>
        </Card>

        {/* Tema Tampilan — pilih tema favorit, disimpan di users.themePref + cookie. */}
        <Card className="space-y-3 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-brand-600" />
            <p className="display text-base text-ink">Tema Tampilan</p>
          </div>
          <p className="text-sm text-muted">
            Pilih tema favoritmu. Tema tersimpan dan dipakai di seluruh halaman.
          </p>

          {themes.length === 0 ? (
            <p className="text-sm text-muted">Belum ada tema aktif.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {themes.map((t) => {
                const [primary, accent] = themeSwatch[t.slug] ?? ["#0E5C46", "#C9A227"];
                const active = currentTheme === t.slug;
                return (
                  <form key={t.slug} action={setTheme}>
                    <input type="hidden" name="theme" value={t.slug} />
                    <button
                      type="submit"
                      aria-pressed={active}
                      aria-label={`Pakai tema ${t.name}`}
                      className={`relative flex w-full flex-col gap-2 rounded-sm border-2 p-3 text-left transition-colors ${
                        active
                          ? "border-brand-600 bg-brand-50/60"
                          : "border-line hover:border-brand-300 hover:bg-brand-50/30"
                      }`}
                    >
                      {active ? (
                        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                      <span className="flex">
                        <span
                          className="h-6 w-6 rounded-full ring-2 ring-surface"
                          style={{ backgroundColor: primary }}
                        />
                        <span
                          className="-ml-2 h-6 w-6 rounded-full ring-2 ring-surface"
                          style={{ backgroundColor: accent }}
                        />
                      </span>
                      <span className="text-sm font-bold text-ink">{t.name}</span>
                      <span className="text-xs font-semibold text-brand-600">
                        {active ? "Aktif" : "Pakai"}
                      </span>
                    </button>
                  </form>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="divide-y divide-line overflow-hidden shadow-sm">
          {primaryMenu.map((item) => (
            <MenuRow key={item.label} item={item} />
          ))}
        </Card>

        <Card className="divide-y divide-line overflow-hidden shadow-sm">
          {secondaryMenu.map((item) => (
            <MenuRow key={item.label} item={item} />
          ))}

          {/* Tombol Keluar — server action logoutAction */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5 text-red-600" />
              <span className="flex-1 text-sm font-semibold">Keluar</span>
            </button>
          </form>
        </Card>
      </Container>
    </>
  );
}
