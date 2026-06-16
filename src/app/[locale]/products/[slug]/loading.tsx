// Skeleton for the product detail page: a large image plate next to the spec /
// price column, matching the two-column desktop layout.
export default function Loading() {
  return (
    <div className="px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="h-80 bg-card border-card rounded-lg animate-pulse" />
        <div className="space-y-5">
          <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
          <div className="h-9 w-3/4 bg-white/5 rounded animate-pulse" />
          <div className="h-6 w-32 bg-white/5 rounded animate-pulse" />
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-4 w-full bg-white/5 rounded animate-pulse" />
            ))}
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-14 w-44 bg-white/5 rounded animate-pulse" />
            <div className="h-14 w-44 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
