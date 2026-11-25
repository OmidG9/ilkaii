"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function UserRoleControls({
  userId,
  role,
  isActive,
  roleOptions,
  canManageSuper,
  isSelf,
}: {
  userId: string;
  role: string;
  isActive: boolean;
  roleOptions: Array<{ code: string; name: string }>;
  canManageSuper: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message ?? "عملیات ناموفق بود");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطای ارتباطی");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <select
          aria-label="نقش کاربر"
          className="field min-h-9 min-w-36 px-2 py-1 text-xs"
          value={role}
          disabled={busy || isSelf}
          onChange={(event) => {
            if (!window.confirm("نقش این کاربر تغییر کند؟")) return;
            void patch({ role: event.target.value });
          }}
        >
          {roleOptions.map((option) => (
            <option key={option.code} value={option.code} disabled={option.code === "SUPER_ADMIN" && !canManageSuper}>{option.name}</option>
          ))}
          {!roleOptions.some((option) => option.code === role) ? <option value={role}>{role}</option> : null}
        </select>
        <button
          type="button"
          disabled={busy || isSelf}
          onClick={() => {
            if (!window.confirm(isActive ? "این حساب غیرفعال و همه نشست‌های آن بسته شود؟" : "این حساب فعال شود؟")) return;
            void patch({ isActive: !isActive });
          }}
          className={`inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-[11px] ${isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-600"}`}
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-600" : "bg-red-500"}`} />}
          {isActive ? "فعال" : "غیرفعال"}
        </button>
      </div>
      {error ? <span role="alert" className="text-[10px] text-red-600">{error}</span> : null}
    </div>
  );
}
