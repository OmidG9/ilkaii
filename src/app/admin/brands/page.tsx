import type { Metadata } from "next";
import { listBrands } from "@/services/admin";
import { EntityManager, toEntityRows, type EntityField } from "@/components/admin/entity-manager";

export const metadata: Metadata = { title: "برندها — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminBrandsPage() {
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
        items={toEntityRows(brands)}
        createLabel="افزودن برند"
      />
    </div>
  );
}
