// Skeleton shown while the catalog server component streams in. Mirrors the
// 3-column card grid so the layout doesn't jump when real data arrives.
export default function Loading() {
  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-12">
      <div className="h-8 w-56 bg-card rounded animate-pulse mb-10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-card border-card rounded-lg overflow-hidden">
            <div className="h-44 bg-white/5 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
              <div className="h-6 w-24 bg-white/5 rounded animate-pulse mt-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
