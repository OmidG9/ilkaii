import { ProductCardSkeleton } from "@/components/ui/display";

export default function ShopLoading() {
  return (
    <div className="container-luxury py-10" aria-busy="true" aria-label="در حال بارگذاری محصولات">
      <div className="skeleton h-4 w-32" />
      <div className="mt-5 space-y-3">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-4 w-80 max-w-full" />
      </div>
      <div className="mt-8 flex flex-wrap gap-2">
        {Array.from({ length: 5 }, (_, index) => <div key={index} className="skeleton h-9 w-24 rounded-full" />)}
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="skeleton h-[420px] rounded-2xl" />
        <div>
          <div className="skeleton mb-6 h-4 w-28" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 9 }, (_, index) => <ProductCardSkeleton key={index} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
