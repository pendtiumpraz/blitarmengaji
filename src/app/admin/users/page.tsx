import {
  MapPin,
  Radio,
  ShieldQuestion,
  Store,
  UserCheck,
  UserRound,
  Users as UsersIcon,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column, type RowAction } from "@/components/ui/data-table";
import {
  listPendingEntities,
  listUsers,
  type PendingEntityType,
  type UserListItem,
} from "@/lib/queries/rbac";
import { rejectEntity, softDeleteUser, verifyEntity } from "@/lib/actions/rbac";

// Modul sensitif & data DB → render dinamis (jangan cache statis).
export const dynamic = "force-dynamic";

// ── Konfigurasi tampilan ─────────────────────────────────────────────────────

const STATUS_LABEL: Record<UserListItem["status"], string> = {
  active: "Aktif",
  pending: "Menunggu",
  banned: "Diblokir",
};

const entityMeta: Record<PendingEntityType, { label: string; Icon: typeof MapPin }> = {
  titik: { label: "Titik Dakwah", Icon: MapPin },
  media: { label: "Media Partner", Icon: Radio },
  usaha: { label: "Partner Usaha", Icon: Store },
  ustadz: { label: "Ustadz", Icon: UserRound },
};

// ── Kolom DataTable ──────────────────────────────────────────────────────────

const userColumns: Column[] = [
  { key: "name", label: "Nama", sortable: true },
  { key: "email", label: "Email", sortable: true },
  { key: "roleNames", label: "Role" },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
];

const pendingColumns: Column[] = [
  { key: "name", label: "Nama", sortable: true },
  { key: "typeLabel", label: "Jenis", sortable: true, filter: true },
  { key: "ownerName", label: "Pemohon" },
  { key: "status", label: "Status", type: "badge" },
];

// Aksi verifikasi / tolak per baris (rows wajib punya 'type' & 'id').
const pendingActions: RowAction[] = [
  { action: verifyEntity, label: "Verifikasi", idField: "id", fields: ["type"] },
  {
    action: rejectEntity,
    label: "Tolak",
    idField: "id",
    fields: ["type"],
    confirm: true,
    confirmTitle: "Tolak pengajuan ini?",
    confirmText: "Status entitas akan ditandai “Ditolak”.",
    danger: true,
  },
];

// ── Halaman ──────────────────────────────────────────────────────────────────

export default async function AdminUsersPage() {
  const [users, pending] = await Promise.all([listUsers(), listPendingEntities()]);

  const userRows = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    roleNames: u.roles.length ? u.roles.join(", ") : "— belum ada role",
    status: STATUS_LABEL[u.status] ?? u.status,
  }));

  const pendingRows = pending.map((s) => ({
    id: s.id,
    type: s.type, // wajib: dipakai hidden input rowAction (fields: ['type'])
    name: s.name,
    typeLabel: entityMeta[s.type].label,
    ownerName: s.ownerName ?? "—",
    status: "Menunggu",
  }));

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
          <Badge tone="muted">{users.length} pengguna</Badge>
        </div>

        <DataTable
          columns={userColumns}
          rows={userRows}
          viewBase="/admin/users"
          editBase="/admin/users"
          editSuffix="/edit"
          deleteAction={softDeleteUser}
          deleteConfirmText="Pengguna akan dihapus (soft delete) dan disembunyikan dari daftar."
          emptyText="Belum ada pengguna."
        />

        <p className="mt-3 text-[11px] text-muted">
          Total {users.length} pengguna aktif (yang dihapus disembunyikan otomatis).
        </p>
      </section>

      {/* ════════════ Bagian B — Verifikasi Akun Entitas ════════════ */}
      <section>
        <div className="mb-1 flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-brand-600" />
          <h2 className="display text-lg text-ink">Verifikasi Akun Entitas</h2>
          {pending.length > 0 ? <Badge tone="warning">{pending.length} baru</Badge> : null}
        </div>
        <p className="mb-4 text-sm text-muted">
          Pengajuan Titik Dakwah, Media Partner, Partner Usaha, dan Ustadz menunggu persetujuan
          admin sebelum tampil publik.
        </p>

        {pending.length === 0 ? (
          <div className="rounded-[3px] border border-dashed border-line bg-surface px-5 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-sm bg-brand-50 text-brand-600">
              <ShieldQuestion className="h-6 w-6" />
            </span>
            <p className="mt-3 font-bold text-ink">Tidak ada pengajuan</p>
            <p className="mt-1 text-sm text-muted">
              Semua entitas sudah diverifikasi. Pengajuan baru akan muncul di sini.
            </p>
          </div>
        ) : (
          <DataTable
            columns={pendingColumns}
            rows={pendingRows}
            rowActions={pendingActions}
            emptyText="Tidak ada pengajuan."
          />
        )}

        <p className="mt-3 text-[11px] text-muted">
          Verifikasi mengubah status entitas menjadi &quot;Aktif&quot; (titik dakwah juga ditandai
          waktu verifikasinya). Penolakan menandai status &quot;Ditolak&quot;.
        </p>
      </section>
    </div>
  );
}
