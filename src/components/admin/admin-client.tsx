"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, Check, Loader2, X } from "lucide-react";
import { RANGE_LABELS, RANGE_KEYS, type RangeKey } from "@/lib/date-range";
import { buttonStyles } from "@/components/ui/button";

export function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    const timer = window.setTimeout(() => closeRef.current?.focus(), 20);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      window.clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 shadow-soft sm:rounded-3xl sm:p-6 ${wide ? "max-w-4xl" : "max-w-lg"}`}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-xs leading-5 text-ink/50">{description}</p> : null}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="بستن" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl hover:bg-line/60"><X className="h-5 w-5" /></button>
        </div>
        {children}
        {footer ? <div className="mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AdminDrawer({
  open,
  onClose,
  title,
  description,
  children,
  side = "left",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: "left" | "right";
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] bg-black/45" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label={title} className={`absolute inset-y-0 w-full max-w-md overflow-y-auto border-line bg-surface p-5 shadow-soft ${side === "left" ? "left-0 border-r" : "right-0 border-l"}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-xs leading-5 text-ink/50">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label="بستن" className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-line/60"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </aside>
    </div>
  );
}

function PersianNumberInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <label className="space-y-1.5 text-xs text-ink/60">
      <span>{label}</span>
      <input type="date" dir="ltr" value={value} onChange={(event) => onChange(event.target.value)} className="field min-h-10 text-sm" />
    </label>
  );
}

export function AdminDateRangePicker({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const active = (params.get("range") ?? "30d") as RangeKey;
  const [customFrom, setCustomFrom] = useState(params.get("from") ?? "");
  const [customTo, setCustomTo] = useState(params.get("to") ?? "");
  const [customOpen, setCustomOpen] = useState(active === "custom");

  const apply = (next: URLSearchParams) => {
    next.delete("page");
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const select = (key: RangeKey) => {
    if (key === "custom") { setCustomOpen(true); return; }
    setCustomOpen(false);
    const next = new URLSearchParams(params.toString());
    next.set("range", key);
    next.delete("from");
    next.delete("to");
    apply(next);
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    const next = new URLSearchParams(params.toString());
    next.set("range", "custom");
    next.set("from", customFrom);
    next.set("to", customTo);
    setCustomOpen(false);
    apply(next);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] text-ink/45"><CalendarDays className="h-3.5 w-3.5" />بازه:</span>
        {RANGE_KEYS.map((key) => (
          <button key={key} type="button" onClick={() => select(key)} aria-pressed={active === key} data-active={active === key}
            className={`min-h-9 rounded-xl border px-3 text-[11px] transition-colors ${active === key ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink/60 hover:border-primary"}`}>
            {RANGE_LABELS[key]}
          </button>
        ))}
      </div>
      {customOpen ? (
        <div className="absolute left-0 top-12 z-40 w-72 rounded-2xl border border-line bg-surface p-4 shadow-soft">
          <div className="grid grid-cols-2 gap-2">
            <PersianNumberInput label="از تاریخ" value={customFrom} onChange={setCustomFrom} />
            <PersianNumberInput label="تا تاریخ" value={customTo} onChange={setCustomTo} />
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={applyCustom} className={buttonStyles("primary", "sm")} disabled={!customFrom || !customTo}><Check className="h-4 w-4" />اعمال</button>
            <button type="button" onClick={() => setCustomOpen(false)} className={buttonStyles("ghost", "sm")}>بستن</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ConfirmButton({
  endpoint,
  method = "POST",
  body,
  label,
  confirmText,
  variant = "danger",
  size = "sm",
  className = "",
  onDone,
}: {
  endpoint: string;
  method?: "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  label: ReactNode;
  confirmText: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async () => {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message ?? "عملیات ناموفق بود");
      onDone?.();
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطای ارتباطی");
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={run} disabled={busy} className={`${buttonStyles(variant, size)} ${className}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{label}
      </button>
      {error ? <span role="alert" className="text-[10px] text-red-600">{error}</span> : null}
    </span>
  );
}

export function AdminToggle({ endpoint, checked, label }: { endpoint: string; checked: boolean; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={busy} onClick={async () => {
      setBusy(true);
      try {
        await fetch(endpoint, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: !checked }) });
        router.refresh();
      } finally {
        setBusy(false);
      }
    }} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] ${checked ? "bg-emerald-500/15 text-emerald-700" : "bg-line text-ink/55"}`}>
      <span className={`h-2 w-2 rounded-full ${checked ? "bg-emerald-600" : "bg-ink/30"}`} />
      {label}
    </button>
  );
}
