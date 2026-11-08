export default function PujaCardSkeleton() {
  return (
    <div
      className="card flex h-full flex-col overflow-hidden border-gold-300/60 bg-white"
      role="status"
      aria-label="Loading ritual card"
    >
      {/* Shimmering Image Block */}
      <div className="relative h-48 w-full animate-pulse bg-amber-900/10">
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          <div className="h-5 w-24 rounded-full bg-amber-900/15" />
          <div className="h-5 w-24 rounded-full bg-amber-900/15" />
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2">
          <div className="h-5 w-16 rounded-md bg-amber-900/15" />
          <div className="h-5 w-28 rounded-md bg-amber-900/15" />
        </div>
      </div>

      {/* Shimmering Card Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Badges */}
        <div className="mb-3 flex gap-2">
          <div className="h-5 w-32 animate-pulse rounded-full bg-amber-900/10" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-amber-900/10" />
        </div>

        {/* Title & Text Bars */}
        <div className="h-6 w-4/5 animate-pulse rounded-lg bg-amber-900/10" />
        <div className="mt-2.5 h-4 w-full animate-pulse rounded bg-amber-900/10" />
        <div className="mt-1.5 h-4 w-2/3 animate-pulse rounded bg-amber-900/10" />

        {/* Price Tag & CTA Button Placeholder */}
        <div className="mt-auto flex items-end justify-between border-t border-gold-300/40 pt-4 mt-4">
          <div className="space-y-1.5">
            <div className="h-3 w-20 animate-pulse rounded bg-amber-900/10" />
            <div className="h-6 w-24 animate-pulse rounded-lg bg-amber-900/10" />
          </div>
          <div className="h-8 w-28 animate-pulse rounded-xl bg-amber-900/10" />
        </div>
      </div>
    </div>
  );
}

export function PujaGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading puja catalog">
      {Array.from({ length: count }).map((_, i) => (
        <PujaCardSkeleton key={i} />
      ))}
    </div>
  );
}

