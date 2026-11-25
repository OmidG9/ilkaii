import type { ProductCard as ProductCardType } from "@/services/catalog";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/ui/display";

export function ProductGrid({ products }: { products: ProductCardType[] }) {
  if (!products.length) {
    return <EmptyState title="محصولی یافت نشد" description="فیلترها را تغییر دهید یا جستجوی دیگری امتحان کنید." />;
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}
    </div>
  );
}
