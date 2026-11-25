import type { Metadata } from "next";
import { listAdminReviews } from "@/services/admin";
import { EntityManager, toEntityRows, type EntityField } from "@/components/admin/entity-manager";
import { formatJalali } from "@/lib/persian";

export const metadata: Metadata = { title: "نظرات — مدیریت" };
export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await listAdminReviews();
  const rows = toEntityRows(reviews.map((item) => ({
    ...item,
    customer: [item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || item.user.phone || "—",
    dateLabel: formatJalali(item.createdAt.toISOString()),
    stars: "★".repeat(item.rating) + "☆".repeat(5 - item.rating),
  })));
  const fields: EntityField[] = [
    { key: "isApproved", label: "نمایش نظر", type: "checkbox" },
  ];
  return (
    <div>
      <h1 className="mb-2 text-3xl font-semibold">نظرات مشتریان</h1>
      <p className="mb-8 text-sm text-ink/60">نظرات تنها پس از تأیید در صفحه محصول نمایش داده میشوند. میانگین امتیاز به صورت خودکار بهروز میشود.</p>
      <EntityManager
        endpoint="/api/admin/reviews"
        fields={fields}
        columns={[
          { key: "product.name", label: "محصول" },
          { key: "customer", label: "مشتری" },
          { key: "stars", label: "امتیاز" },
          { key: "comment", label: "نظر" },
          { key: "isApproved", label: "وضعیت" },
          { key: "dateLabel", label: "تاریخ" },
        ]}
        items={rows}
        canCreate={false}
        canDelete
        createLabel="ویرایش نظر"
      />
    </div>
  );
}
