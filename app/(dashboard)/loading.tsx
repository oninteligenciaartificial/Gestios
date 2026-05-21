export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-10 w-48 rounded-xl bg-white/10" />
          <div className="h-4 w-64 rounded-lg bg-white/5" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-white/5" />
      </div>

      {/* KPI cards skeleton — 4 columns */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-panel p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-start">
              <div className="h-3 w-24 rounded bg-white/5" />
              <div className="h-7 w-7 rounded-lg bg-white/5" />
            </div>
            <div className="h-8 w-32 rounded-lg bg-white/10" />
          </div>
        ))}
      </section>

      {/* Chart skeleton */}
      <div className="glass-panel rounded-2xl p-5 space-y-3">
        <div className="h-5 w-40 rounded-lg bg-white/10" />
        <div className="h-64 rounded-xl bg-white/5" />
      </div>

      {/* Two-column content blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="h-5 w-36 rounded-lg bg-white/10" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-12 rounded-xl bg-white/5" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
