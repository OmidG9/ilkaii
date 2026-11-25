import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requirePageAdmin, permissionKeysForRole } from "@/lib/auth/session";
import { getSiteConfig } from "@/config/site";
import { roleLabel } from "@/lib/permissions";
import { visibleNav } from "@/lib/admin-navigation";
import { getAdminBadges, getAdminNotifications } from "@/services/notifications";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مدیریت", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [user, site] = await Promise.all([requirePageAdmin(), getSiteConfig()]);
  const permissions = await permissionKeysForRole(user.role);
  const [notifications, badges] = await Promise.all([
    getAdminNotifications(permissions),
    getAdminBadges(permissions),
  ]);
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.phone;

  return (
    <AdminShell
      user={{ name, phone: user.phone, roleLabel: roleLabel(user.role) }}
      siteName={site.name}
      permissions={permissions}
      nav={visibleNav(permissions)}
      notifications={notifications}
      badges={badges}
    >
      {children}
    </AdminShell>
  );
}
