import { Loader2, AlertTriangle, Inbox, Star } from 'lucide-react';
import PujaCardSkeleton from './PujaCardSkeleton';

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-maroon-700" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-saffron-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function CatalogGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading catalog">
      {Array.from({ length: count }).map((_, i) => (
        <PujaCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SlotGridSkeleton({ count = 4 }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2" role="status" aria-label="Loading muhurtham slots">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-gold-300/60 bg-white p-3.5">
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 animate-pulse rounded bg-amber-900/10" />
            <div className="h-4 w-14 animate-pulse rounded-full bg-amber-900/10" />
          </div>
          <div className="mt-2 h-3 w-48 animate-pulse rounded bg-amber-900/10" />
        </div>
      ))}
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="container-x py-10" role="status" aria-label="Loading profile">
      <div className="h-4 w-32 animate-pulse rounded bg-amber-900/10" />
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="h-64 w-full animate-pulse rounded-2xl bg-amber-900/10" />
          <div className="mt-5 space-y-3">
            <div className="h-7 w-2/3 animate-pulse rounded-lg bg-amber-900/10" />
            <div className="h-4 w-full animate-pulse rounded bg-amber-900/10" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-amber-900/10" />
          </div>
          <div className="mt-6 h-24 animate-pulse rounded-xl bg-amber-900/10" />
        </div>
        <div className="card space-y-3 p-5">
          <div className="h-6 w-48 animate-pulse rounded bg-amber-900/10" />
          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-amber-900/10" />
            ))}
          </div>
          <div className="h-11 w-full animate-pulse rounded-xl bg-amber-900/10" />
        </div>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto my-10 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <AlertTriangle className="mx-auto mb-2 h-7 w-7 text-red-600" />
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline mt-4 active:scale-[0.98]">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message, action, illustration }) {
  return (
    <div className="mx-auto my-10 max-w-lg rounded-2xl border border-gold-400/60 bg-gradient-to-b from-white to-cream-100 p-10 text-center shadow-sm">
      {illustration || <Inbox className="mx-auto mb-3 h-10 w-10 text-gold-500" />}
      <h3 className="text-2xl font-bold text-maroon-800">{title}</h3>
      {message && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-maroon-700/80">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Stars({ value = 0, count }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-maroon-800">
      <Star className="h-4 w-4 fill-gold-500 text-gold-500" />
      <b>{value ? value.toFixed(1) : 'New'}</b>
      {count > 0 && <span className="text-maroon-700/70">({count})</span>}
    </span>
  );
}

export function StatusBadge({ status, meta }) {
  const m = meta[status] || { label: status, cls: 'bg-gray-100 text-gray-700' };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-3 text-sm">
      <button
        className="btn-outline active:scale-[0.98]"
        disabled={meta.page <= 1}
        onClick={() => onPage(meta.page - 1)}
      >
        Previous
      </button>
      <span>
        Page {meta.page} of {meta.pages}
      </span>
      <button
        className="btn-outline active:scale-[0.98]"
        disabled={meta.page >= meta.pages}
        onClick={() => onPage(meta.page + 1)}
      >
        Next
      </button>
    </div>
  );
}
