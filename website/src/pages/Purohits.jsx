import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import useFetch from '../hooks/useFetch';
import PanditCard from '../components/PanditCard';
import { PanditGridSkeleton } from '../components/PanditCardSkeleton';
import { ErrorState, EmptyState, Pagination } from '../components/States';

const SPEC_PILLS = [
  { value: '', label: 'All Priests' },
  { value: 'Griha Pravesh', label: '🏠 Griha Pravesh' },
  { value: 'Satyanarayan', label: '🪔 Satyanarayan' },
  { value: 'Rudrabhishek', label: '🔱 Rudrabhishek' },
  { value: 'Navagraha', label: '🔥 Homams' },
  { value: 'Vivah', label: '💍 Vivah' },
];

export default function Purohits() {
  const [sp, setSp] = useSearchParams();
  const [text, setText] = useState(sp.get('search') || '');
  const params = {
    search: sp.get('search') || undefined,
    specialization: sp.get('specialization') || undefined,
    language: sp.get('language') || undefined,
    sort: sp.get('sort') || 'rating',
    page: sp.get('page') || 1,
    limit: 9,
  };
  const { data, meta, loading, error, reload } = useFetch('/pandits', params);
  const { data: opts } = useFetch('/pandits/options');

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
            Verified &amp; Experienced Priests
          </h1>
          <p className="mt-0.5 text-xs text-maroon-700/80">
            Book trusted Telugu, Hindi, Tamil, Kannada &amp; Sanskrit Vedic Priests.
          </p>
        </div>

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
              className="input w-52 pl-9 text-xs"
              placeholder="Search Priest..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <select
            className="input w-40 text-xs"
            value={params.language || ''}
            onChange={(e) => update('language', e.target.value)}
          >
            <option value="">All Languages</option>
            {(opts?.languages || []).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </form>
      </div>

      {/* Specialization Pill Tabs */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-2" role="tablist">
        {SPEC_PILLS.map((pill) => {
          const active = (params.specialization || '') === pill.value;
          return (
            <button
              key={pill.label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => update('specialization', pill.value)}
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
        {loading && <PanditGridSkeleton count={6} />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && data.length === 0 && (
          <EmptyState
            title="No Priests Found"
            message="Try clearing your filter above."
            action={
              <button
                className="btn-primary"
                onClick={() => {
                  setText('');
                  setSp({});
                }}
              >
                Show All Priests
              </button>
            }
          />
        )}
        {data && data.length > 0 && (
          <>
            <div className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((p) => (
                <div key={p._id} className="flex h-full flex-col">
                  <PanditCard pandit={p} />
                </div>
              ))}
            </div>
            <Pagination meta={meta} onPage={(p) => update('page', String(p))} />
          </>
        )}
      </div>
    </div>
  );
}
