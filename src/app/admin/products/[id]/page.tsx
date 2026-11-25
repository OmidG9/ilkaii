import type { Metadata } from "next";
import { requirePagePermission } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAdminProduct, listBrands } from "@/services/admin";
import { ProductForm } from "@/components/admin/product-form";
import { EntityManager, type EntityField } from "@/components/admin/entity-manager";
import { ImageManager } from "@/components/admin/image-manager";
import { DeleteButton } from "@/components/admin/delete-button";
import { DuplicateProductButton } from "@/components/admin/duplicate-product-button";
import { Card, SectionTitle } from "@/components/ui/display";
import { formatToman } from "@/lib/money";
import { formatJalali, formatNumber } from "@/lib/persian";
import { inventoryReasonLabels } from "@/lib/labels";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "ویرایش محصول — مدیریت" };
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<RawSearchParams>;
};

export default async function AdminProductDetailPage({ params, searchParams }: Props) {
  await requirePagePermission("products.view");
  const { id } = await params;
  await searchParams;
  let product;
  try {
    product = await getAdminProduct(id);
  } catch {
    notFound();
  }
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    listBrands(),
  ]);

  const variantFields: EntityField[] = [
    { key: "size", label: "سایز", type: "text", required: true },
    { key: "color", label: "رنگ", type: "text" },
    { key: "sku", label: "SKU", type: "text", required: true },
    { key: "price", label: "قیمت جداگانه (تومان)", type: "number" },
    { key: "stock", label: "موجودی", type: "number", required: true },
    { key: "lowStockThreshold", label: "آستانه هشدار", type: "number" },
    { key: "isAvailable", label: "قابل فروش", type: "checkbox" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <p dir="ltr" className="mt-2 text-xs text-ink/50">{product.sku}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DuplicateProductButton productId={product.id} />
          <DeleteButton endpoint={`/api/admin/products/${product.id}`} label="بایگانی محصول" redirectTo="/admin/products" />
        </div>
      </div>

      <ProductForm
        categories={categories}
        brands={brands.map((brand) => ({ id: brand.id, name: brand.name }))}
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          categoryId: product.category.id,
          brandId: product.brand?.id ?? null,
          basePrice: product.basePrice,
          salePrice: product.salePrice,
          status: product.status,
          gender: product.gender,
          season: product.season,
          shortDescription: product.shortDescription,
          description: product.description,
          isFeatured: product.isFeatured,
          isNewArrival: product.isNewArrival,
          reorderLevel: product.reorderLevel,
        }}
      />

      <section>
        <SectionTitle title="تنوعها" subtitle="برای هر سایز/رنگ یک تنوع تعریف کنید. موجودی توسط تنوعها کنترل میشود." />
        <EntityManager
          endpoint={`/api/admin/products/${product.id}/variants`}
          fields={variantFields}
          columns={[
            { key: "size", label: "سایز" },
            { key: "color", label: "رنگ" },
            { key: "sku", label: "SKU", ltr: true },
            { key: "price", label: "قیمت", ltr: true },
            { key: "stock", label: "موجودی" },
            { key: "isAvailable", label: "وضعیت" },
          ]}
          items={product.variants as unknown as Array<Record<string, unknown>>}
          createLabel="افزودن تنوع"
        />
      </section>

      <section>
        <SectionTitle title="گالری تصاویر" />
        <ImageManager productId={product.id} images={product.images.map((image) => ({
          id: image.id, url: image.url, altText: image.altText, color: image.color,
          isPrimary: image.isPrimary, displayOrder: image.displayOrder,
        }))} />
      </section>

      <section>
        <SectionTitle title="تاریخچه موجودی" subtitle="آخرین ۲۰ تغییر موجودی این محصول" />
        <Card className="overflow-hidden">
          <div className="table-wrap">
            <table className="table-luxury">
              <thead><tr><th>تاریخ</th><th>تنوع</th><th>تغییر</th><th>دلیل</th><th>توضیح</th></tr></thead>
              <tbody>
                {product.movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{formatJalali(movement.createdAt)}</td>
                    <td dir="ltr" className="text-xs">{product.variants.find((variant) => variant.id === movement.variantId)?.sku ?? "—"}</td>
                    <td dir="ltr" className={movement.quantity > 0 ? "text-emerald-700" : "text-red-600"}>
                      {movement.quantity > 0 ? "+" : ""}{formatNumber(movement.quantity)}
                    </td>
                    <td>{inventoryReasonLabels[movement.reason]}</td>
                    <td className="text-xs text-ink/60">{movement.note ?? "—"}</td>
                  </tr>
                ))}
                {!product.movements.length ? <tr><td colSpan={5} className="py-8 text-center text-ink/50">تغییری ثبت نشده است.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="mt-3 text-xs text-ink/45">قیمت فعلی: <span dir="ltr">{formatToman(product.salePrice ?? product.basePrice)}</span></p>
      </section>
    </div>
  );
}
