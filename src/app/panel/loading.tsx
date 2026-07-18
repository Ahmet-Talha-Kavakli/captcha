export default function PanelLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-6 pt-6 pb-10 lg:px-10">
      {/* başlık iskeleti */}
      <div className="space-y-2">
        <div className="skeleton h-8 w-64 rounded-lg" />
        <div className="skeleton h-4 w-96 rounded-md" />
      </div>
      {/* stat kartları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-line bg-white p-5 shadow-card">
            <div className="skeleton h-9 w-20 rounded-md" />
            <div className="skeleton mt-3 h-4 w-28 rounded" />
          </div>
        ))}
      </div>
      {/* büyük panel */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-card">
        <div className="skeleton h-5 w-40 rounded" />
        <div className="skeleton mt-4 h-[200px] w-full rounded-xl" />
      </div>
    </div>
  );
}
