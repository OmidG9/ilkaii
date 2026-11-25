import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, Inbox } from "lucide-react";
import { formatNumber } from "@/lib/persian";
import { Pagination } from "@/components/ui/display";

export interface AdminStatCardProps {
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  definition?: string;
  href?: string;
  icon?: ReactNode;
  tone?: "default" | "warning" | "danger" | "success";
}

const statTones = {
  default: "border-line",
  warning: "border-amber-400/50",
  danger: "border-red-400/50",
  success: "border-emerald-400/50",
};

export function AdminStatCard({ label, value, hint, delta, definition, href, icon, tone = "default" }: AdminStatCardProps) {
  const body = (
    <div className={`admin-panel h-full border p-5 transition-colors hover:border-primary/60 ${statTones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-ink/55">{label}</p>
        {icon ? <span className="text-primary/70">{icon}</span> : null}
      </div>
      <p dir="ltr" className="mt-3 truncate text-xl font-semibold tabular-nums text-ink">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
        {typeof delta === "number" ? (
          <span className={`inline-flex items-center gap-0.5 ${delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatNumber(Math.abs(delta))}٪
          </span>
        ) : null}
        {hint ? <span className="text-ink/45">{hint}</span> : null}
      </div>
      {definition ? <p className="mt-2 text-[10px] leading-4 text-ink/35">{definition}</p> : null}
    </div>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

export function AdminChart({
  title,
  subtitle,
  data,
  type = "bar",
  height = 220,
  valueLabel = "مقدار",
  secondaryLabel,
  formatValue = (value: number) => formatNumber(value),
  emptyText = "داده‌ای برای نمایش در این بازه وجود ندارد.",
  footer,
}: {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  type?: "bar" | "line" | "donut";
  height?: number;
  valueLabel?: string;
  secondaryLabel?: string;
  formatValue?: (value: number) => string;
  emptyText?: string;
  footer?: ReactNode;
}) {
  const max = Math.max(1, ...data.map((point) => Math.max(point.value, point.secondary ?? 0)));
  return (
    <section className="admin-panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle ? <p className="mt-1 text-[11px] text-ink/45">{subtitle}</p> : null}
        </div>
        <span className="admin-chip">{valueLabel}</span>
      </div>
      {data.length ? (
        type === "donut" ? (
          <Donut data={data} formatValue={formatValue} />
        ) : (
          <div dir="ltr" className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${Math.max(data.length * 42, 320)} ${height}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={title}>
              {[0.25, 0.5, 0.75, 1].map((ratio) => (
                <line key={ratio} x1="0" x2={Math.max(data.length * 42, 320)} y1={(height - 28) * (1 - ratio) + 8} y2={(height - 28) * (1 - ratio) + 8} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 4" />
              ))}
              {type === "bar"
                ? data.map((point, index) => {
                    const width = Math.max(10, 42 * 0.55);
                    const x = index * 42 + (42 - width) / 2;
                    const barHeight = Math.max(2, ((height - 36) * point.value) / max);
                    return (
                      <g key={`${point.label}-${index}`}>
                        <rect x={x} y={height - 28 - barHeight} width={width} height={barHeight} rx="4" className="fill-primary/75">
                          <title>{`${point.label}: ${formatValue(point.value)}`}</title>
                        </rect>
                        {point.secondary !== undefined ? (
                          <rect x={x + width / 2 - 2} y={height - 28 - Math.max(2, ((height - 36) * point.secondary) / max)} width="4" height={Math.max(2, ((height - 36) * point.secondary) / max)} rx="2" className="fill-secondary">
                            <title>{`${secondaryLabel ?? "مقایسه"}: ${formatValue(point.secondary)}`}</title>
                          </rect>
                        ) : null}
                        <text x={index * 42 + 21} y={height - 10} textAnchor="middle" fontSize="9" className="fill-current text-ink/45">{point.label.length > 7 ? point.label.slice(-7) : point.label}</text>
                      </g>
                    );
                  })
                : (() => {
                    const width = Math.max(data.length * 42, 320);
                    const points = data.map((point, index) => {
                      const x = index * 42 + 21;
                      const y = height - 28 - ((height - 36) * point.value) / max;
                      return { x, y, point };
                    });
                    return (
                      <>
                        <polyline fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" points={points.map((p) => `${p.x},${p.y}`).join(" ")} />
                        {points.map(({ x, y, point }, index) => (
                          <g key={`${point.label}-${index}`}>
                            <circle cx={x} cy={y} r="3.5" className="fill-primary"><title>{`${point.label}: ${formatValue(point.value)}`}</title></circle>
                            <text x={x} y={height - 10} textAnchor="middle" fontSize="9" className="fill-current text-ink/45">{point.label.length > 7 ? point.label.slice(-7) : point.label}</text>
                          </g>
                        ))}
                        <line x1="0" x2={width} y1={height - 28} y2={height - 28} stroke="currentColor" strokeOpacity="0.15" />
                      </>
                    );
                  })()}
            </svg>
          </div>
        )
      ) : (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink/45">{emptyText}</div>
      )}
      {footer ? <div className="mt-4 border-t border-line/70 pt-3">{footer}</div> : null}
    </section>
  );
}

function Donut({ data, formatValue }: { data: ChartPoint[]; formatValue: (value: number) => string }) {
  const total = data.reduce((sum, point) => sum + point.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const colors = ["text-primary", "text-secondary", "text-emerald-600", "text-amber-600", "text-sky-600", "text-rose-500", "text-violet-500"];
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <svg viewBox="0 0 140 140" className="h-44 w-44 -rotate-90" role="img" aria-label="نمودار دایره‌ای">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="18" />
        {data.map((point, index) => {
          const length = (point.value / total) * circumference;
          const circle = (
            <circle key={`${point.label}-${index}`} cx="70" cy="70" r={radius} fill="none" strokeWidth="18" strokeLinecap="butt"
              strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} className={colors[index % colors.length]} stroke="currentColor">
              <title>{`${point.label}: ${formatValue(point.value)}`}</title>
            </circle>
          );
          offset += length;
          return circle;
        })}
      </svg>
      <ul className="space-y-2 text-xs">
        {data.map((point, index) => (
          <li key={`${point.label}-legend-${index}`} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full bg-current ${colors[index % colors.length]}`} />
            <span className="max-w-40 truncate text-ink/70">{point.label}</span>
            <span dir="ltr" className="ms-auto tabular-nums text-ink/50">{formatValue(point.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface AdminColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  ltr?: boolean;
  className?: string;
  headerClassName?: string;
}

export function AdminDataTable<T>({
  columns,
  rows,
  rowKey,
  emptyText = "داده‌ای یافت نشد.",
  emptyAction,
  caption,
  footer,
  dense = false,
}: {
  columns: AdminColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  emptyText?: string;
  emptyAction?: ReactNode;
  caption?: string;
  footer?: ReactNode;
  dense?: boolean;
}) {
  return (
    <div className="admin-panel overflow-hidden">
      <div className="w-full overflow-x-auto">
        <table className="table-luxury">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((column) => <th key={column.key} className={column.headerClassName}>{column.header}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="hover:bg-primary/[0.03]">
                {columns.map((column) => (
                  <td key={column.key} dir={column.ltr ? "ltr" : undefined} className={`${dense ? "py-2" : ""} ${column.className ?? ""}`}>
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-ink/50">
                    <Inbox className="h-8 w-8 text-ink/25" />
                    <span className="text-sm">{emptyText}</span>
                    {emptyAction}
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {footer ? <div className="border-t border-line px-4 py-3 text-xs text-ink/55">{footer}</div> : null}
    </div>
  );
}

export function AdminPageHeader({ title, description, actions, badge }: { title: string; description?: string; actions?: ReactNode; badge?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
          {badge}
        </div>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/55">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function AdminFilters({ children, action, resetHref }: { children: ReactNode; action?: string; resetHref?: string }) {
  return (
    <form method="get" action={action} className="admin-panel mb-5 flex flex-wrap items-end gap-3 p-4">
      {children}
      <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm text-white hover:bg-hover">اعمال فیلتر</button>
      {resetHref ? <Link href={resetHref} className="inline-flex min-h-11 items-center rounded-xl border border-line px-4 text-sm text-ink/60 hover:border-primary">پاک‌سازی</Link> : null}
    </form>
  );
}

export function AdminSearch({ name = "q", defaultValue = "", placeholder = "جستجو…" }: { name?: string; defaultValue?: string; placeholder?: string }) {
  return (
    <input name={name} defaultValue={defaultValue} placeholder={placeholder} className="field max-w-sm flex-1" dir="auto" aria-label={placeholder} />
  );
}

export function AdminEmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface/60 p-8 text-center">
      <Inbox className="h-9 w-9 text-ink/25" aria-hidden />
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="max-w-md text-sm leading-6 text-ink/50">{description}</p> : null}
      {action}
    </div>
  );
}

export function AdminPagination(props: { page: number; pageCount: number; pathname: string; params?: Record<string, string | undefined> }) {
  return <Pagination {...props} />;
}

export function AdminSectionLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="inline-flex min-h-10 items-center gap-1 text-xs font-medium text-primary hover:text-hover">{children}<ChevronLeft className="h-3.5 w-3.5" /></Link>;
}
