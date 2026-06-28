export default function ProductLoading() {
  return (
    <div className="bg-white min-h-screen animate-pulse">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 bg-ink-100 rounded" />
          <div className="h-3 w-3 bg-ink-100 rounded" />
          <div className="h-3 w-16 bg-ink-100 rounded" />
          <div className="h-3 w-3 bg-ink-100 rounded" />
          <div className="h-3 w-32 bg-ink-100 rounded" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-12 lg:pb-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-ink-100 rounded-sm" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-20 bg-ink-100 rounded-sm" />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-5 lg:py-2">
            <div className="h-3 w-28 bg-ink-100 rounded" />
            <div className="space-y-2.5">
              <div className="h-7 w-4/5 bg-ink-100 rounded" />
              <div className="h-7 w-3/5 bg-ink-100 rounded" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-4 w-24 bg-ink-100 rounded" />
              <div className="h-4 w-16 bg-ink-100 rounded" />
            </div>
            <div className="h-8 w-40 bg-ink-100 rounded" />

            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-ink-100 rounded" />
              <div className="h-3 w-full bg-ink-100 rounded" />
              <div className="h-3 w-2/3 bg-ink-100 rounded" />
            </div>

            {/* Qty + CTA */}
            <div className="flex items-center gap-3 pt-4">
              <div className="h-12 w-28 bg-ink-100 rounded-sm" />
              <div className="h-12 flex-1 bg-ink-100 rounded-sm" />
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-ink-100 rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
