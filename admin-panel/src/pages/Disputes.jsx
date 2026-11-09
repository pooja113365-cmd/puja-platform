import { useMemo, useState } from 'react';
import { Eye, Search, RotateCcw } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { Loader, ErrorState, EmptyState, StatusBadge, Pagination } from '../components/States';
import { inr, fmtDateTime, STATUS_META } from '../utils/format';

function ResolveModal({ dispute, onClose, onSaved }) {
  const [f, setF] = useState({
    status: dispute.status === 'open' ? 'resolved' : dispute.status,
    resolution: dispute.resolution || '',
    refundAmount: dispute.refundAmount || 0,
  });
  const act = useAction();
  const paid = dispute.booking?.payment?.amountPaid || 0;
  const canEdit = ['open', 'in_review'].includes(dispute.status);

  const submit = async (e) => {
    e.preventDefault();
    const body = { status: f.status, resolution: f.resolution, refundAmount: Number(f.refundAmount) || 0 };
    if (await act.run(() => api.patch(`/disputes/${dispute._id}`, body))) onSaved();
  };

  return (
    <Modal title={`Dispute — ${dispute.subject}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <h3 className="font-serif text-lg font-bold text-maroon-900">{dispute.subject}</h3>
            <p className="text-xs text-stone-500">
              Booking #{dispute.booking?.bookingNumber} · Raised by {dispute.raisedBy?.name} ({dispute.raisedBy?.phone})
            </p>
          </div>
          <StatusBadge status={dispute.status} meta={STATUS_META} />
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Customer Issue Description</span>
          <p className="mt-1 text-stone-800">{dispute.description}</p>
        </div>

        {!canEdit && dispute.resolution && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Resolution</span>
            <p className="mt-1 text-emerald-900">{dispute.resolution}</p>
          </div>
        )}

        {canEdit ? (
          <form onSubmit={submit} className="space-y-3">
            {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{act.error}</p>}
            <div>
              <label className="label">Outcome</label>
              <select
                className="input"
                value={f.status}
                onChange={(e) => setF({ ...f, status: e.target.value })}
              >
                <option value="in_review">Mark in review</option>
                <option value="resolved">Resolve</option>
                <option value="rejected">Reject</option>
              </select>
            </div>
            {f.status !== 'in_review' && (
              <>
                <div>
                  <label className="label">Resolution notes</label>
                  <textarea
                    required
                    rows={3}
                    className="input"
                    value={f.resolution}
                    onChange={(e) => setF({ ...f, resolution: e.target.value })}
                  />
                </div>
                {f.status === 'resolved' && paid > 0 && (
                  <div>
                    <label className="label">Refund amount (max {inr(paid)})</label>
                    <input
                      type="number"
                      min="0"
                      max={paid}
                      className="input"
                      value={f.refundAmount}
                      onChange={(e) => setF({ ...f, refundAmount: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" disabled={act.busy}>
                {act.busy ? 'Saving…' : 'Save Resolution'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end">
            <button type="button" className="btn-outline" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function Disputes() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [active, setActive] = useState(null);

  const { data, meta, loading, error, reload } = useFetch('/disputes', {
    status: status || undefined,
    page,
    limit,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((d) => {
      const subj = d.subject?.toLowerCase() || '';
      const num = d.booking?.bookingNumber?.toLowerCase() || '';
      const user = d.raisedBy?.name?.toLowerCase() || '';
      return subj.includes(q) || num.includes(q) || user.includes(q);
    });
  }, [data, search]);

  const hasFilters = Boolean(status || search);

  const clearFilters = () => {
    setStatus('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Disputes</h1>
        <p className="mt-0.5 text-sm text-stone-500">Review customer issues and resolutions</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search subject, booking #, customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="input max-w-[11rem]"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Status filter"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Rejected</option>
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

      {loading && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && filtered.length === 0 && (
        <EmptyState title="No disputes found" message="Nothing matches the selected filters." />
      )}

      {data && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="w-14 px-4 py-3.5">S.No</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Booking</th>
                <th className="px-4 py-3.5">Raised By</th>
                <th className="px-4 py-3.5">Created</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((d, idx) => (
                <tr key={d._id} className="align-middle transition hover:bg-stone-50/80">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-stone-500">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-maroon-900">{d.subject}</td>
                  <td className="px-4 py-3.5 font-mono text-xs text-stone-700">
                    #{d.booking?.bookingNumber || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-stone-700">
                    {d.raisedBy?.name || 'Customer'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-stone-500">{fmtDateTime(d.createdAt)}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <StatusBadge status={d.status} meta={STATUS_META} />
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-maroon-900 shadow-sm hover:border-saffron-500"
                      onClick={() => setActive(d)}
                    >
                      <Eye className="h-3.5 w-3.5 text-saffron-600" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        meta={meta}
        total={meta?.total ?? filtered.length}
        page={page}
        limit={limit}
        onPage={setPage}
        onLimit={setLimit}
      />

      {active && (
        <ResolveModal
          dispute={active}
          onClose={() => setActive(null)}
          onSaved={() => {
            setActive(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
