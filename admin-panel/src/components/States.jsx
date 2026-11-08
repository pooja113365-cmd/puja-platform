import { Loader2, AlertTriangle, Inbox, Star } from 'lucide-react';

export function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-maroon-700" role="status">
      <Loader2 className="h-5 w-5 animate-spin" /> <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto my-10 max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <AlertTriangle className="mx-auto mb-2 h-7 w-7 text-red-600" />
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline mt-4">Try again</button>}
    </div>
  );
}

export function EmptyState({ title, message, action }) {
  return (
    <div className="mx-auto my-10 max-w-md rounded-xl border border-dashed border-gold-400 bg-cream-100 p-8 text-center">
      <Inbox className="mx-auto mb-2 h-8 w-8 text-gold-500" />
      <h3 className="text-lg text-maroon-800">{title}</h3>
      {message && <p className="mt-1 text-sm text-maroon-700/80">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
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
      <button className="btn-outline" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</button>
      <span>Page {meta.page} of {meta.pages}</span>
      <button className="btn-outline" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next</button>
    </div>
  );
}
