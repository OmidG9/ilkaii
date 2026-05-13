import { notFound } from "next/navigation";
import { sampleProducts } from "@/lib/sampleProducts";
import ProductDetailClient from "./ProductDetailClient";

export default function ProductPage({ params }: any) {
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const product = sampleProducts.find((item) => item.slug === slug);
  if (!product) return notFound();

  return <ProductDetailClient product={product} />;
}
