export default function ProductLoading() {
  return (
    <div className="container-luxury py-10" aria-busy="true" aria-label="در حال بارگذاری محصول">
      <div className="skeleton h-4 w-52" />
      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="skeleton aspect-[3/4] w-full rounded-luxury" />
          <div className="mt-4 flex gap-3">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="skeleton h-20 w-16 rounded-xl" />)}
          </div>
        </div>
        <div className="space-y-5">
          <div className="flex gap-2">
            <div className="skeleton h-7 w-24 rounded-full" />
            <div className="skeleton h-7 w-20 rounded-full" />
          </div>
          <div className="skeleton h-10 w-4/5" />
          <div className="skeleton h-4 w-40" />
          <div className="skeleton h-12 w-36" />
          <div className="space-y-2 pt-4">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-11/12" />
            <div className="skeleton h-4 w-2/3" />
          </div>
          <div className="skeleton h-14 w-full rounded-2xl" />
          <div className="grid gap-2 pt-4">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-5 w-3/4" />)}
          </div>
        </div>
      </div>
      <div className="mt-20 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton aspect-[3/4] rounded-luxury" />)}
      </div>
    </div>
  );
}
