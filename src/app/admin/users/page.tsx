import type { Metadata } from "next";
import Link from "next/link";
import { requirePagePermission } from "@/lib/auth/session";
import { listAdminUsers, listRoles } from "@/services/rbac";
import { AdminDataTable, AdminFilters, AdminPageHeader, AdminSearch } from "@/components/admin/admin-widgets";
import { UserRoleControls } from "@/components/admin/user-role-controls";
import { roleLabel } from "@/lib/permissions";
import { formatJalali } from "@/lib/persian";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "مدیران" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const actor = await requirePagePermission("users.manage");
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const [users, roles] = await Promise.all([listAdminUsers(q), listRoles()]);
  const options = roles.filter((role) => role.code !== "CUSTOMER").map((role) => ({ code: role.code, name: role.name }));

  return (
    <div>
      <AdminPageHeader
        title="مدیران و کارکنان"
        description="نقش‌ها و وضعیت حساب کارکنان را مدیریت کنید. تغییر نقش مدیرکل فقط توسط مدیرکل مجاز است و تغییر نقش خودتان امکان‌پذیر نیست."
        actions={<Link href="/admin/roles" className="inline-flex min-h-10 items-center rounded-xl border border-line px-4 text-sm hover:border-primary">مدیریت دسترسی نقش‌ها</Link>}
      />
      <AdminFilters resetHref="/admin/users"><AdminSearch defaultValue={q} placeholder="نام یا موبایل مدیر…" /></AdminFilters>
      <AdminDataTable
        rows={users}
        rowKey={(user) => user.id}
        caption="فهرست مدیران"
        emptyText="مدیری یافت نشد."
        columns={[
          { key: "name", header: "کاربر", render: (user) => (
            <div>
              <Link href={`/admin/customers/${user.id}`} className="text-xs font-medium text-primary hover:underline">{[user.firstName, user.lastName].filter(Boolean).join(" ") || "بدون نام"}</Link>
              <p dir="ltr" className="mt-0.5 text-[10px] text-ink/45">{user.phone}</p>
            </div>
          ) },
          { key: "role", header: "نقش", render: (user) => <span className="text-xs">{roleLabel(user.role)}</span> },
          { key: "sessions", header: "نشست فعال", render: (user) => <span className="text-xs">{user._count.sessions}</span> },
          { key: "lastLogin", header: "آخرین ورود", render: (user) => <span className="text-[11px] text-ink/55">{user.lastLogin ? formatJalali(user.lastLogin, true) : "—"}</span> },
          { key: "createdAt", header: "عضویت", render: (user) => <span className="text-[11px] text-ink/55">{formatJalali(user.createdAt)}</span> },
          { key: "actions", header: "مدیریت", render: (user) => (
            <UserRoleControls userId={user.id} role={user.role} isActive={user.isActive} roleOptions={options} canManageSuper={actor.role === "SUPER_ADMIN"} isSelf={actor.id === user.id} />
          ) },
        ]}
      />
      <p className="mt-3 text-[10px] text-ink/35">برای بستن نشست‌های فعال به صفحه <Link href="/admin/security" className="text-primary hover:underline">امنیت و نشست‌ها</Link> بروید. تعلیق حساب، همه نشست‌های آن کاربر را باطل می‌کند.</p>
    </div>
  );
}
