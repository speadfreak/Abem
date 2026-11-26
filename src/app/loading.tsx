export default function Loading() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col justify-center py-24" aria-busy="true" aria-label="Loading page">
      <div className="skeleton-shimmer mb-8 h-8 w-44 rounded-lg" />
      <div className="skeleton-shimmer mb-4 h-16 w-full max-w-2xl rounded-2xl" />
      <div className="skeleton-shimmer mb-10 h-4 w-72 rounded-lg" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer rounded-2xl border border-gold/10">
            <div className="aspect-[4/3] w-full rounded-t-2xl" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-2/3 rounded bg-cream/10" />
              <div className="h-3 w-full rounded bg-cream/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
