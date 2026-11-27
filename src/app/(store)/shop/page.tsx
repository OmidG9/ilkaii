import type { Metadata } from "next";
import { ProductListing } from "@/components/product-listing";
import { ShopMasthead } from "@/components/store-headers";
import { getCategories } from "@/services/catalog";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "فروشگاه",
  description: "همه محصولات پوشاک ilkaii با فیلتر سایز، رنگ، قیمت و دسته‌بندی.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const [params, categories] = await Promise.all([searchParams, getCategories()]);
  return (
    <ProductListing
      title="همه محصولات"
      subtitle="با فیلترها، استایلی را که می‌خواهید پیدا کنید"
      pathname="/shop"
      searchParams={params}
      header={<ShopMasthead categories={categories} />}
    />
  );
}
