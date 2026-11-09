import { useMemo, useState } from 'react';
import { Trash2, Plus, Search, RotateCcw, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { Loader, ErrorState, EmptyState, Pagination } from '../components/States';
import { fmtDate, toYMD } from '../utils/format';

const blank = { date: '', label: '', startTime: '08:00', endTime: '10:00', notes: '' };

function MuhurthamModal({ today, onClose, onSaved }) {
  const [f, setF] = useState(blank);
  const act = useAction();

  const submit = async (e) => {
    e.preventDefault();
    if (await act.run(() => api.post('/muhurthams', f))) {
      onSaved();
    }
  };

  return (
    <Modal title="Add Muhurtham Slot" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-sm">
        {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{act.error}</p>}
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            required
            min={today}
            className="input"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Label</label>
          <input
            required
            className="input"
            placeholder="e.g. Shubh Muhurtham"
            value={f.label}
            onChange={(e) => setF({ ...f, label: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">From</label>
            <input
              type="time"
              required
              className="input"
              value={f.startTime}
              onChange={(e) => setF({ ...f, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="time"
              required
              className="input"
              value={f.endTime}
              onChange={(e) => setF({ ...f, endTime: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">Notes</label>
          <input
            className="input"
            placeholder="Optional — nakshatra or suitable pujas"
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={act.busy}>
            {act.busy ? 'Saving…' : 'Save Slot'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Muhurthams() {
  const today = toYMD(new Date());
  const { data, loading, error, reload } = useFetch('/muhurthams', { from: today });
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const act = useAction();

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((m) => {
      if (statusFilter === 'active' && !m.isActive) return false;
      if (statusFilter === 'disabled' && m.isActive) return false;
      if (dateFilter && m.date?.slice(0, 10) !== dateFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchLabel = m.label?.toLowerCase().includes(q);
        const matchNotes = m.notes?.toLowerCase().includes(q);
        if (!matchLabel && !matchNotes) return false;
      }
      return true;
    });
  }, [data, search, dateFilter, statusFilter]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  const remove = async (m) => {
    if (!window.confirm('Delete this muhurtham?')) return;
    if (await act.run(() => api.delete(`/muhurthams/${m._id}`))) reload();
  };

  const toggle = async (m) => {
    if (await act.run(() => api.patch(`/muhurthams/${m._id}`, { isActive: !m.isActive }))) reload();
  };

  const hasFilters = Boolean(search || dateFilter || statusFilter);

  const clearFilters = () => {
    setSearch('');
    setDateFilter('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Muhurtham Slots</h1>
          <p className="mt-0.5 text-sm text-stone-500">Manage auspicious dates and time windows</p>
        </div>
        <button className="btn-primary !py-2 text-xs" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add Muhurtham
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search label or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <input
          type="date"
          className="input max-w-[10.5rem]"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Date filter"
        />

        <select
          className="input max-w-[10rem]"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Status filter"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-maroon-800 hover:bg-stone-100"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </div>

      {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{act.error}</p>}
      {loading && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && filtered.length === 0 && (
        <EmptyState title="No muhurtham slots found" message="Add a new slot or clear your filters." />
      )}

      {data && pagedRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="w-14 px-4 py-3.5">S.No</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Label</th>
                <th className="px-4 py-3.5">Time Window</th>
                <th className="px-4 py-3.5">Notes</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pagedRows.map((m, idx) => (
                <tr key={m._id} className="align-middle transition hover:bg-stone-50/80">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-stone-500">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-stone-900">{fmtDate(m.date)}</td>
                  <td className="px-4 py-3.5 font-semibold text-maroon-900">{m.label}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-stone-700">
                    {m.startTime} – {m.endTime}
                  </td>
                  <td className="max-w-xs px-4 py-3.5 text-xs text-stone-500">
                    <span className="line-clamp-1">{m.notes || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {m.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="space-x-2 px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-maroon-900 shadow-sm hover:border-saffron-500"
                      disabled={act.busy}
                      onClick={() => toggle(m)}
                    >
                      {m.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      aria-label="Delete"
                      disabled={act.busy}
                      onClick={() => remove(m)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        total={filtered.length}
        page={page}
        limit={limit}
        onPage={setPage}
        onLimit={setLimit}
      />

      {adding && (
        <MuhurthamModal
          today={today}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
