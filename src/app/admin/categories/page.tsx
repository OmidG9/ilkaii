import type { Metadata } from "next";
import { listAdminCategories } from "@/services/admin";
import { EntityManager, toEntityRows, type EntityField } from "@/components/admin/entity-manager";

export const metadata: Metadata = { title: "دستهبندیها — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listAdminCategories();
  const fields: EntityField[] = [
    { key: "name", label: "نام", type: "text", required: true },
    { key: "slug", label: "اسلاگ", type: "text", required: true, placeholder: "women-dresses" },
    { key: "parentId", label: "دسته والد", type: "select", options: categories.map((c) => ({ value: c.id, label: c.name })) },
    { key: "description", label: "توضیحات", type: "textarea" },
    { key: "displayOrder", label: "ترتیب نمایش", type: "number" },
    { key: "isActive", label: "فعال", type: "checkbox" },
  ];
  return (
    <div>
      <h1 className="mb-2 text-3xl font-semibold">دستهبندیها</h1>
      <p className="mb-8 text-sm text-ink/60">دستهبندیها را مرتب کنید. اسلاگ باید انگلیسی و یکتا باشد.</p>
      <EntityManager
        endpoint="/api/admin/categories"
        fields={fields}
        columns={[
          { key: "name", label: "نام" },
          { key: "slug", label: "اسلاگ", ltr: true },
          { key: "parent.name", label: "والد" },
          { key: "_count.products", label: "محصولات" },
          { key: "isActive", label: "وضعیت" },
        ]}
        items={toEntityRows(categories)}
        createLabel="افزودن دستهبندی"
      />
    </div>
  );
}
