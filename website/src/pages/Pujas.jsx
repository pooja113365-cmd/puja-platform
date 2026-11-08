import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import PujaCard from '../components/PujaCard';
import { PujaGridSkeleton } from '../components/PujaCardSkeleton';
import { ErrorState, EmptyState, Pagination } from '../components/States';
import { LOCATION_LABEL } from '../utils/format';

const CATEGORY_PILLS = [
  { value: '', label: 'All Pujas' },
  { value: 'Griha Pravesh', label: '🏠 Griha Pravesh' },
  { value: 'Satyanarayan', label: '🪔 Satyanarayan' },
  { value: 'Rudrabhishek', label: '🔱 Rudrabhishek' },
  { value: 'Navagraha', label: '🔥 Homams' },
  { value: 'Vivah', label: '💍 Vivah' },
  { value: 'Shradh', label: '🙏 Shradh' },
];

export default function Pujas() {
  const [sp, setSp] = useSearchParams();
  const [text, setText] = useState(sp.get('search') || '');
  const params = {
    category: sp.get('category') || undefined,
    location: sp.get('location') || undefined,
    language: sp.get('language') || undefined,
    hasSamagri: sp.get('hasSamagri') || undefined,
    search: sp.get('search') || undefined,
    page: sp.get('page') || 1,
    limit: 9,
  };
  const { data, meta, loading, error, reload } = useFetch('/pujas', params);

  const update = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.delete('page');
    setSp(next);
  };

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-maroon-900 sm:text-4xl">
            Book Pujas &amp; Homams Online
          </h1>
          <p className="mt-0.5 text-xs text-maroon-700/80">
            Choose a Puja, pick your auspicious date &amp; get Samagri delivered to your doorstep.
          </p>
        </div>

        {/* Clean Compact Search + Venue Filter */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            update('search', text.trim());
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-maroon-700/60" />
            <input
              className="input w-56 pl-9 text-xs"
              placeholder="Search Pujas or Homams..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <select
            className="input w-40 text-xs"
            value={params.location || ''}
            onChange={(e) => update('location', e.target.value)}
          >
            <option value="">All Venues</option>
            {Object.entries(LOCATION_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </form>
      </div>

      {/* Category Pill Tabs */}
      <div
        role="tablist"
        aria-label="Puja category tabs"
        className="mt-5 flex items-center gap-2 overflow-x-auto pb-2"
      >
        {CATEGORY_PILLS.map((pill) => {
          const active = (params.category || '') === pill.value;
          return (
            <button
              key={pill.label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => update('category', pill.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] ${
                active
                  ? 'bg-maroon-800 text-gold-300 shadow-md ring-1 ring-gold-400'
                  : 'border border-gold-300/80 bg-white text-maroon-800 hover:border-saffron-400 hover:bg-cream-100'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {loading && <PujaGridSkeleton count={6} />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && data.length === 0 && (
          <EmptyState
            title="No Pujas Found"
            message="Try selecting another category above."
            action={
              <button
                className="btn-primary"
                onClick={() => {
                  setText('');
                  setSp({});
                }}
              >
                Show All Pujas
              </button>
            }
          />
        )}
        {data && data.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((p) => (
                <PujaCard key={p._id} puja={p} />
              ))}
            </div>
            <Pagination meta={meta} onPage={(p) => update('page', String(p))} />
          </>
        )}
      </div>
    </div>
  );
}
