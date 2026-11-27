export default function BlogLoading() {
  return (
    <div className="container-luxury py-12 sm:py-16" aria-busy="true" aria-label="در حال بارگذاری ژورنال">
      <div className="skeleton h-4 w-24" />
      <div className="mt-5 space-y-3">
        <div className="skeleton h-12 w-72 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="skeleton aspect-[16/10] w-full rounded-[32px]" />
          <div className="mt-5 space-y-3">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-8 w-4/5" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
        <div className="space-y-5">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="grid grid-cols-[110px_1fr] gap-4">
              <div className="skeleton aspect-square rounded-2xl" />
              <div className="space-y-2 py-2">
                <div className="skeleton h-3 w-20" />
                <div className="skeleton h-5 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
