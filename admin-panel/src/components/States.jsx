import { Loader2, AlertTriangle, Inbox, Star, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="mx-auto my-8 max-w-md rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
      <Inbox className="mx-auto mb-2 h-8 w-8 text-saffron-500" />
      <h3 className="font-serif text-lg font-bold text-maroon-900">{title}</h3>
      {message && <p className="mt-1 text-sm text-stone-500">{message}</p>}
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
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.cls}`}>{m.label}</span>;
}

export function Pagination({ meta, total: propTotal, page: propPage, limit: propLimit, onPage, onLimit }) {
  const page = meta?.page ?? propPage ?? 1;
  const limit = meta?.limit ?? propLimit ?? 10;
  const total = meta?.total ?? propTotal ?? 0;
  const pages = Math.max(1, meta?.pages ?? (Math.ceil(total / limit) || 1));

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  const pageNumbers = [];
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(pages, startPage + 4);
  for (let i = startPage; i <= endPage; i += 1) {
    pageNumbers.push(i);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white px-4 py-3 text-xs text-stone-600 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing <b className="text-maroon-900">{start}</b>–<b className="text-maroon-900">{end}</b> of{' '}
          <b className="text-maroon-900">{total}</b>
        </span>
        {onLimit && (
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400">|</span>
            <span>Rows:</span>
            <select
              aria-label="Rows per page"
              value={limit}
              onChange={(e) => {
                onLimit(Number(e.target.value));
                if (onPage) onPage(1);
              }}
              className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-semibold text-maroon-900 focus:border-saffron-500 focus:outline-none"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-maroon-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPage && onPage(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Prev
        </button>

        {pageNumbers.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onPage && onPage(num)}
            className={`h-7 min-w-[28px] rounded-lg px-2 text-xs font-bold transition ${
              num === page
                ? 'bg-maroon-800 text-white shadow-sm'
                : 'border border-stone-200 bg-white text-maroon-900 hover:bg-stone-50'
            }`}
          >
            {num}
          </button>
        ))}

        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-maroon-900 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page >= pages}
          onClick={() => onPage && onPage(page + 1)}
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
