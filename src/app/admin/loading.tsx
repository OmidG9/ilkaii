export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="در حال بارگذاری">
      <div className="skeleton h-9 w-56" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="skeleton h-28" />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="skeleton h-72" />
        <div className="skeleton h-72" />
      </div>
    </div>
  );
}
