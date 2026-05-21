import Link from "next/link";

/** Pagination berbasis query-param (?page=N). Dipakai di list admin/dashboard. */
export function Pagination({
  page,
  pageSize,
  total,
  baseHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  baseHref: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const href = (p: number) => `${baseHref}${baseHref.includes("?") ? "&" : "?"}page=${p}`;

  const linkCls = "rounded-sm border border-line px-3 py-1.5 text-xs font-semibold hover:bg-brand-50";
  const disabledCls = "rounded-sm border border-line px-3 py-1.5 text-xs font-semibold text-muted opacity-50";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted">
        Menampilkan {from}–{to} dari {total}
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} className={linkCls}>‹ Sebelumnya</Link>
        ) : (
          <span className={disabledCls}>‹ Sebelumnya</span>
        )}
        <span className="px-2 text-xs text-muted">Hal {page}/{totalPages}</span>
        {page < totalPages ? (
          <Link href={href(page + 1)} className={linkCls}>Berikutnya ›</Link>
        ) : (
          <span className={disabledCls}>Berikutnya ›</span>
        )}
      </div>
    </div>
  );
}
