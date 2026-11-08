export default function PanditCardSkeleton() {
  return (
    <div
      className="card flex h-full min-h-[348px] flex-col justify-between border-gold-300/60 bg-white p-5"
      role="status"
      aria-label="Loading purohit profile card"
    >
      <div className="flex flex-1 flex-col">
        {/* Avatar & Header Shimmer */}
        <div className="flex items-start gap-4">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-2xl bg-amber-900/10 ring-2 ring-amber-400/40 ring-offset-2" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-40 animate-pulse rounded-full bg-amber-900/10" />
            <div className="h-6 w-3/4 animate-pulse rounded-lg bg-amber-900/10" />
            <div className="h-4 w-32 animate-pulse rounded bg-amber-900/10" />
          </div>
        </div>

        {/* Temple Affiliation Bar */}
        <div className="mt-3.5 h-8 w-full animate-pulse rounded-lg bg-amber-900/10" />

        {/* Languages & Cities Bars */}
        <div className="mt-3 space-y-2">
          <div className="h-4 w-5/6 animate-pulse rounded bg-amber-900/10" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-amber-900/10" />
        </div>

        {/* Specialization Pills */}
        <div className="mt-3 flex flex-wrap gap-1.5 pb-4">
          <div className="h-5 w-20 animate-pulse rounded-full bg-amber-900/10" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-amber-900/10" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-amber-900/10" />
        </div>
      </div>

      {/* Footer Dakshina & CTA Button Placeholder */}
      <div className="mt-auto flex items-center justify-between border-t border-gold-300/40 pt-4">
        <div className="space-y-1.5">
          <div className="h-3 w-20 animate-pulse rounded bg-amber-900/10" />
          <div className="h-5 w-24 animate-pulse rounded bg-amber-900/10" />
        </div>
        <div className="h-8 w-32 animate-pulse rounded-lg bg-amber-900/10" />
      </div>
    </div>
  );
}

export function PanditGridSkeleton({ count = 6 }) {
  return (
    <div
      className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading vedic purohits"
    >
      {Array.from({ length: count }).map((_, i) => (
        <PanditCardSkeleton key={i} />
      ))}
    </div>
  );
}

