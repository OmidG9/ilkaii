import { ProductCardSkeleton } from "@/components/ui/display";

export default function StoreLoading() {
  return (
    <div className="container-luxury py-10" aria-busy="true" aria-label="در حال بارگذاری صفحه">
      <div className="skeleton h-[360px] rounded-[36px] sm:h-[440px]" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-20 rounded-2xl" />)}
      </div>
      <div className="mt-14 flex items-end justify-between gap-4">
        <div className="space-y-3">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-8 w-52" />
        </div>
        <div className="skeleton h-4 w-20" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)}
      </div>
    </div>
  );
}
