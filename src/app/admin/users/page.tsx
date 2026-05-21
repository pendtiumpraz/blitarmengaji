import {
  MapPin,
  Radio,
  ShieldQuestion,
  Store,
  Trash2,
  UserCheck,
  UserRound,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import {
  countUsers,
  listPendingEntities,
  listUsersPaged,
  type PendingEntityType,
  type UserListItem,
} from "@/lib/queries/rbac";
import { rejectEntity, softDeleteUser, verifyEntity } from "@/lib/actions/rbac";

// Modul sensitif & data DB → render dinamis (jangan cache statis).
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

// ── Konfigurasi tampilan ─────────────────────────────────────────────────────

const statusBadge: Record<
  UserListItem["status"],
  { tone: "success" | "warning" | "danger"; label: string }
> = {
  active: { tone: "success", label: "Aktif" },
  pending: { tone: "warning", label: "Menunggu" },
  banned: { tone: "danger", label: "Diblokir" },
};

const entityMeta: Record<PendingEntityType, { label: string; Icon: typeof MapPin }> = {
  titik: { label: "Titik Dakwah", Icon: MapPin },
  media: { label: "Media Partner", Icon: Radio },
  usaha: { label: "Partner Usaha", Icon: Store },
  ustadz: { label: "Ustadz", Icon: UserRound },
};

// ── Halaman ──────────────────────────────────────────────────────────────────

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [users, totalUsers, pending] = await Promise.all([
    listUsersPaged(page, PAGE_SIZE),
    countUsers(),
    listPendingEntities(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Pengguna"
        subtitle="Kelola akun, role, dan verifikasi pengajuan entitas di Blitar Raya."
      />

      {/* ════════════ Bagian A — Tabel Pengguna ════════════ */}
      <section className="mb-12">
        <div className="mb-3 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-brand-600" />
          <h2 className="display text-lg text-ink">Daftar Pengguna</h2>
          <Badge tone="muted">{totalUsers} pengguna</Badge>
        </div>

        {users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-6 w-6 text-brand-600" />}
            title="Belum ada pengguna"
            desc="Pengguna yang terdaftar akan tampil di sini setelah akun dibuat."
          />
        ) : (
          <Table className="min-w-[760px]">
            <THead>
              <TR>
                <TH>Nama</TH>
                <TH>Email</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <tbody>
              {users.map((u) => {
                const sb = statusBadge[u.status];
                return (
                  <TR key={u.id} className="hover:bg-brand-50/60">
                    <TD>
                      <span className="font-bold text-ink">{u.name}</span>
                    </TD>
                    <TD className="text-muted">{u.email}</TD>
                    <TD>
                      {u.roles.length ? (
                        <span className="flex flex-wrap gap-1.5">
                          {u.roles.map((role) => (
                            <Badge key={role} tone="brand">
                              {role}
                            </Badge>
                          ))}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">— belum ada role</span>
                      )}
                    </TD>
                    <TD>
                      <Badge tone={sb.tone}>{sb.label}</Badge>
                    </TD>
                    <TD className="text-right">
                      <form action={softDeleteUser} className="inline-flex justify-end">
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          aria-label={`Hapus ${u.name}`}
                          title="Hapus pengguna"
                          className="text-muted hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}

        {totalUsers > 0 ? (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={totalUsers}
            baseHref="/admin/users"
          />
        ) : null}

        <p className="mt-3 text-[11px] text-muted">
          Total {totalUsers} pengguna aktif (yang dihapus disembunyikan otomatis).
        </p>
      </section>

      {/* ════════════ Bagian B — Verifikasi Akun Entitas ════════════ */}
      <section>
        <div className="mb-1 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-brand-600" />
          <h2 className="display text-lg text-ink">Verifikasi Akun Entitas</h2>
        </div>
        <p className="mb-4 text-sm text-muted">
          Pengajuan Titik Dakwah, Media Partner, Partner Usaha, dan Ustadz menunggu persetujuan
          admin sebelum tampil publik.
        </p>

        <div className="overflow-hidden rounded-[3px] border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <ShieldQuestion className="h-4 w-4 text-brand-600" />
              Pengajuan Menunggu Verifikasi
              {pending.length > 0 ? <Badge tone="warning">{pending.length} baru</Badge> : null}
            </h3>
          </div>

          {pending.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-sm bg-brand-50 text-brand-600">
                <UserCheck className="h-6 w-6" />
              </span>
              <p className="mt-3 font-bold text-ink">Tidak ada pengajuan</p>
              <p className="mt-1 text-sm text-muted">
                Semua entitas sudah diverifikasi. Pengajuan baru akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {pending.map((s) => {
                const meta = entityMeta[s.type];
                const { Icon } = meta;
                return (
                  <div
                    key={`${s.type}-${s.id}`}
                    className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-brand-50/40"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-brand-600 text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-ink">{s.name}</p>
                        <Badge tone="brand">{meta.label}</Badge>
                        <Badge tone="warning">Menunggu</Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {s.ownerName ? (
                          <>
                            Pemohon: <b className="text-ink/80">{s.ownerName}</b>
                            {s.detail ? " · " : ""}
                          </>
                        ) : null}
                        {s.detail ?? (s.ownerName ? "" : "Tanpa keterangan")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <form action={verifyEntity}>
                        <input type="hidden" name="type" value={s.type} />
                        <input type="hidden" name="id" value={s.id} />
                        <Button type="submit" variant="primary" size="sm">
                          <UserCheck className="h-4 w-4" />
                          Verifikasi
                        </Button>
                      </form>
                      <form action={rejectEntity}>
                        <input type="hidden" name="type" value={s.type} />
                        <input type="hidden" name="id" value={s.id} />
                        <Button type="submit" variant="danger" size="sm">
                          <X className="h-4 w-4" />
                          Tolak
                        </Button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="mt-3 text-[11px] text-muted">
          Verifikasi mengubah status entitas menjadi &quot;Aktif&quot; (titik dakwah juga ditandai
          waktu verifikasinya). Penolakan menandai status &quot;Ditolak&quot;.
        </p>
      </section>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[3px] border border-dashed border-line bg-surface px-5 py-12 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-sm bg-brand-50">{icon}</span>
      <p className="mt-3 font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{desc}</p>
    </div>
  );
}
