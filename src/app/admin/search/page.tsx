import type { Metadata } from "next";
import Link from "next/link";
import { requirePageAdmin, permissionKeysForRole } from "@/lib/auth/session";
import { adminGlobalSearch } from "@/services/admin-search";
import { AdminPageHeader, AdminEmptyState, AdminSectionLink } from "@/components/admin/admin-widgets";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "جستجوی مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const user = await requirePageAdmin();
  const permissions = await permissionKeysForRole(user.role);
  const groups = await adminGlobalSearch(q, permissions);

  return (
    <div>
      <AdminPageHeader title="جستجوی سراسری" description="در محصولات، سفارش‌ها، مشتریان، صفحات و وبلاگ جستجو کنید. نتایج بر اساس دسترسی نقش شما فیلتر می‌شوند." />
      <form method="get" className="admin-panel mb-6 flex flex-wrap gap-3 p-4">
        <input name="q" defaultValue={q} autoFocus placeholder="حداقل ۲ حرف…" className="field max-w-xl flex-1" aria-label="عبارت جستجو" />
        <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-6 text-sm text-white">جستجو</button>
      </form>

      {!q ? (
        <AdminEmptyState title="عبارت جستجو را وارد کنید" description="می‌توانید نام محصول، SKU، شماره سفارش، موبایل مشتری یا عنوان صفحه را وارد کنید." />
      ) : !groups.length ? (
        <AdminEmptyState title="نتیجه‌ای یافت نشد" description={`برای «${q}» موردی در دسترس نقش شما پیدا نشد.`} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {groups.map((group) => (
            <section key={group.title} className="admin-panel p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">{group.title}</h2>
                <AdminSectionLink href={group.href}>مشاهده همه</AdminSectionLink>
              </div>
              <ul className="divide-y divide-line/70">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{item.title}</span>
                        {item.subtitle ? <span className="mt-0.5 block truncate text-[11px] text-ink/45">{item.subtitle}</span> : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
