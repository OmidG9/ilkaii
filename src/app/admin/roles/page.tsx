import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listRoles } from "@/services/rbac";
import { RoleEditor } from "@/components/admin/role-editor";
import { AdminPageHeader } from "@/components/admin/admin-widgets";

export const metadata: Metadata = { title: "نقش‌ها و دسترسی‌ها" };
export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requirePagePermission("users.manage");
  const roles = await listRoles();
  return (
    <div>
      <AdminPageHeader
        title="نقش‌ها و دسترسی‌ها"
        description="دسترسی‌ها در سرور و برای هر درخواست بررسی می‌شوند. پنهان‌کردن دکمه در رابط کاربری هرگز جایگزین کنترل سرور نیست."
      />
      <RoleEditor roles={roles.map((role) => ({ ...role, permissions: role.permissions }))} />
    </div>
  );
}
