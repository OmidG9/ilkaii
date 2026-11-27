export default function AccountLoading() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="در حال بارگذاری حساب">
      <div className="space-y-3">
        <div className="skeleton h-9 w-64" />
        <div className="skeleton h-4 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="skeleton h-24 rounded-luxury" />)}
      </div>
      <div className="skeleton h-72 rounded-luxury" />
      <div className="space-y-3">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    </div>
  );
}
