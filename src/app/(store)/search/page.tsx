import type { Metadata } from "next";
import { ProductListing } from "@/components/product-listing";
import type { RawSearchParams } from "@/lib/search-params";

export const metadata: Metadata = { title: "نتایج جستجو", robots: { index: false, follow: true } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  return (
    <ProductListing
      title={q ? `نتایج جستجو برای «${q}»` : "جستجو"}
      subtitle="جستجو روی نام، کد محصول، دستهبندی و رنگها"
      pathname="/search"
      searchParams={params}
      breadcrumb={{ label: "جستجو" }}
    />
  );
}
