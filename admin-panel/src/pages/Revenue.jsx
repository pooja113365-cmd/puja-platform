import { useMemo, useState } from 'react';
import { Search, RotateCcw } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import { Loader, ErrorState, EmptyState, Pagination } from '../components/States';
import { inr, fmtDate } from '../utils/format';

function Card({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</div>
      <div className="mt-1.5 font-serif text-2xl font-bold text-maroon-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-stone-500">{sub}</div>}
    </div>
  );
}

export default function Revenue() {
  const [range, setRange] = useState({ from: '', to: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const rev = useFetch('/admin/revenue', { from: range.from || undefined, to: range.to || undefined });
  const pending = useFetch('/bookings', { payout: 'pending', limit: 100 });
  const act = useAction();

  const refreshAll = () => {
    rev.reload();
    pending.reload();
  };

  const markPaid = async (b) => {
    const reference = window.prompt(
      `Enter payout reference (UTR / txn id) for ${b.pandit?.user?.name} — ${inr(b.pricing.panditEarning)}:`
    );
    if (!reference || reference.trim().length < 3) return;
    if (await act.run(() => api.post(`/admin/payouts/${b._id}/mark-paid`, { reference }))) refreshAll();
  };

  const filteredPending = useMemo(() => {
    const list = pending.data || [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((b) => {
      const num = b.bookingNumber?.toLowerCase() || '';
      const pandit = b.pandit?.user?.name?.toLowerCase() || '';
      return num.includes(q) || pandit.includes(q);
    });
  }, [pending.data, search]);

  const pagedPending = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredPending.slice(start, start + limit);
  }, [filteredPending, page, limit]);

  if (rev.loading && !rev.data) return <Loader />;
  if (rev.error) return <ErrorState message={rev.error} onRetry={rev.reload} />;
  const d = rev.data;

  const hasFilters = Boolean(range.from || range.to || search);

  const clearFilters = () => {
    setRange({ from: '', to: '' });
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Revenue &amp; Payouts</h1>
        <p className="mt-0.5 text-sm text-stone-500">Track completed bookings and pandit settlements</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search booking # or pandit..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">From:</span>
          <input
            type="date"
            className="input max-w-[10rem]"
            value={range.from}
            onChange={(e) => setRange({ ...range, from: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">To:</span>
          <input
            type="date"
            className="input max-w-[10rem]"
            value={range.to}
            onChange={(e) => setRange({ ...range, to: e.target.value })}
          />
        </div>

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

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Completed Bookings" value={d.completed.bookings} />
        <Card label="Gross Value" value={inr(d.completed.gross)} />
        <Card label="Platform Commission" value={inr(d.completed.commission)} />
        <Card
          label="Pending Payouts"
          value={inr(d.pendingPayouts.amount)}
          sub={`${d.pendingPayouts.count} booking(s)`}
        />
      </div>

      {/* Pending Payouts Table */}
      <div className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-maroon-900">Pending Settlements</h2>
        {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{act.error}</p>}

        {filteredPending.length === 0 ? (
          <EmptyState title="No pending payouts" message="All completed bookings are settled." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="w-14 px-4 py-3.5">S.No</th>
                  <th className="px-4 py-3.5">Booking</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Pandit</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Payout</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pagedPending.map((b, idx) => (
                  <tr key={b._id} className="align-middle transition hover:bg-stone-50/80">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-stone-500">
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-maroon-900">
                      #{b.bookingNumber}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-700">{fmtDate(b.date)}</td>
                    <td className="px-4 py-3.5 font-medium text-stone-800">
                      {b.pandit?.user?.name || 'Pandit'}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-stone-700">{inr(b.pricing?.total)}</td>
                    <td className="px-4 py-3.5 font-semibold text-emerald-700">
                      {inr(b.pricing?.panditEarning)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        className="btn-primary !px-3 !py-1.5 text-xs"
                        disabled={act.busy}
                        onClick={() => markPaid(b)}
                      >
                        Mark Paid
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          total={filteredPending.length}
          page={page}
          limit={limit}
          onPage={setPage}
          onLimit={setLimit}
        />
      </div>
    </div>
  );
}
