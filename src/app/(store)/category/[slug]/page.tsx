import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing } from "@/components/product-listing";
import { getCategories, getCategoryBySlug } from "@/services/catalog";
import type { RawSearchParams } from "@/lib/search-params";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const category = await getCategoryBySlug(slug);
    return {
      title: category.name,
      description: category.description ?? `محصولات دسته ${category.name}`,
      alternates: { canonical: `/category/${category.slug}` },
    };
  } catch {
    return { title: "دستهبندی یافت نشد", robots: { index: false } };
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  let category;
  try {
    category = await getCategoryBySlug(slug);
  } catch {
    notFound();
  }
  const categories = await getCategories();
  void categories;
  return (
    <ProductListing
      title={category.name}
      subtitle={category.description ?? undefined}
      pathname={`/category/${category.slug}`}
      searchParams={await searchParams}
      fixedCategory={category.slug}
      breadcrumb={{ label: category.name }}
    />
  );
}
