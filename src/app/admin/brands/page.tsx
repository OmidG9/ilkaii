import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { listBrands } from "@/services/admin";
import { EntityManager, type EntityField } from "@/components/admin/entity-manager";

export const metadata: Metadata = { title: "برندها — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
  await requirePagePermission("products.view");
  const brands = await listBrands();
  const fields: EntityField[] = [
    { key: "name", label: "نام برند", type: "text", required: true },
    { key: "slug", label: "اسلاگ", type: "text", required: true, placeholder: "ilkaii" },
    { key: "description", label: "توضیحات", type: "textarea" },
  ];
  return (
    <div>
      <h1 className="mb-2 text-3xl font-semibold">برندها</h1>
      <p className="mb-8 text-sm text-ink/60">برندهای قابل انتخاب برای محصولات را مدیریت کنید.</p>
      <EntityManager
        endpoint="/api/admin/brands"
        fields={fields}
        columns={[
          { key: "name", label: "نام" },
          { key: "slug", label: "اسلاگ", ltr: true },
          { key: "_count.products", label: "محصولات" },
          { key: "isActive", label: "وضعیت" },
        ]}
        items={brands as unknown as Array<Record<string, unknown>>}
        createLabel="افزودن برند"
      />
    </div>
  );
}
