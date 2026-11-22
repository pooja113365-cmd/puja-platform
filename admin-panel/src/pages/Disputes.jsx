import { useMemo, useState } from 'react';
import { Eye, Search, RotateCcw, Smartphone, Globe } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { Loader, ErrorState, EmptyState, StatusBadge, Pagination } from '../components/States';
import { inr, fmtDateTime, STATUS_META } from '../utils/format';

const CATEGORY_LABELS = {
  booking_issue: 'Booking Issue',
  payment_refund: 'Payment & Refund',
  pandit_feedback: 'Pandit / Ritual',
  referral_wallet: 'Referral & Wallet',
  general_support: 'General Support',
};

const PRIORITY_STYLES = {
  low: 'bg-stone-100 text-stone-700',
  medium: 'bg-amber-50 text-amber-800 border border-amber-200',
  high: 'bg-orange-100 text-orange-800 border border-orange-200',
  urgent: 'bg-red-100 text-red-800 border border-red-200',
};

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
    <Modal title={`Support Ticket ${dispute.ticketNumber ? `#${dispute.ticketNumber}` : ''} — ${dispute.subject}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-maroon-900">{dispute.subject}</h3>
              <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700">
                {CATEGORY_LABELS[dispute.category] || 'Support Ticket'}
              </span>
              {dispute.priority && (
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLES[dispute.priority] || PRIORITY_STYLES.medium}`}>
                  {dispute.priority}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {dispute.booking?.bookingNumber ? `Booking #${dispute.booking.bookingNumber} · ` : 'General Support Ticket · '}
              Raised by <span className="font-semibold text-stone-700">{dispute.raisedBy?.name || 'Customer'}</span>
              {dispute.raisedBy?.phone ? ` (${dispute.raisedBy.phone})` : ''}
              {dispute.raisedBy?.email ? ` · ${dispute.raisedBy.email}` : ''}
            </p>
          </div>
          <StatusBadge status={dispute.status} meta={STATUS_META} />
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Customer Message / Issue Description</span>
          <p className="mt-1 whitespace-pre-wrap text-stone-800">{dispute.description}</p>
        </div>

        {!canEdit && dispute.resolution && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Admin Response &amp; Resolution</span>
            <p className="mt-1 whitespace-pre-wrap text-emerald-900">{dispute.resolution}</p>
          </div>
        )}

        {canEdit ? (
          <form onSubmit={submit} className="space-y-3">
            {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{act.error}</p>}
            <div>
              <label className="label">Ticket Status</label>
              <select
                className="input"
                value={f.status}
                onChange={(e) => setF({ ...f, status: e.target.value })}
              >
                <option value="in_review">Mark In Review</option>
                <option value="resolved">Resolve Ticket</option>
                <option value="rejected">Reject / Close Ticket</option>
              </select>
            </div>
            <div>
              <label className="label">Admin Reply / Resolution Notes (visible to customer in mobile app)</label>
              <textarea
                required={f.status !== 'in_review'}
                rows={3}
                placeholder="Write a helpful response or resolution note for the customer..."
                className="input"
                value={f.resolution}
                onChange={(e) => setF({ ...f, resolution: e.target.value })}
              />
            </div>
            {f.status === 'resolved' && paid > 0 && (
              <div>
                <label className="label">Optional Refund Amount via Razorpay (max {inr(paid)})</label>
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
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" disabled={act.busy}>
                {act.busy ? 'Saving…' : 'Send Reply & Save'}
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
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [active, setActive] = useState(null);

  const { data, meta, loading, error, reload } = useFetch('/disputes', {
    status: status || undefined,
    category: category || undefined,
    page,
    limit,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((d) => {
      const subj = d.subject?.toLowerCase() || '';
      const tkt = d.ticketNumber?.toLowerCase() || '';
      const num = d.booking?.bookingNumber?.toLowerCase() || '';
      const user = d.raisedBy?.name?.toLowerCase() || '';
      const phone = d.raisedBy?.phone?.toLowerCase() || '';
      return subj.includes(q) || tkt.includes(q) || num.includes(q) || user.includes(q) || phone.includes(q);
    });
  }, [data, search]);

  const hasFilters = Boolean(status || category || search);

  const clearFilters = () => {
    setStatus('');
    setCategory('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Support Tickets &amp; Disputes</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Manage customer support tickets raised from the Mobile App &amp; Website
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search ticket #, subject, customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="input max-w-[12rem]"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Category filter"
        >
          <option value="">All Categories</option>
          <option value="booking_issue">Booking Issue</option>
          <option value="payment_refund">Payment &amp; Refund</option>
          <option value="pandit_feedback">Pandit / Ritual</option>
          <option value="referral_wallet">Referral &amp; Wallet</option>
          <option value="general_support">General Support</option>
        </select>

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
        <EmptyState title="No support tickets found" message="Nothing matches the selected filters." />
      )}

      {data && filtered.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="w-14 px-4 py-3.5">S.No</th>
                <th className="px-4 py-3.5">Ticket #</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Subject</th>
                <th className="px-4 py-3.5">Booking</th>
                <th className="px-4 py-3.5">Customer</th>
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
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-maroon-900">
                    <div className="flex items-center gap-1.5">
                      {d.source === 'website' ? (
                        <Globe className="h-3.5 w-3.5 text-stone-400" title="Website" />
                      ) : (
                        <Smartphone className="h-3.5 w-3.5 text-saffron-600" title="Mobile App" />
                      )}
                      <span>{d.ticketNumber || `#${String(d._id).slice(-6).toUpperCase()}`}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs">
                    <span className="inline-block rounded-lg bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">
                      {CATEGORY_LABELS[d.category] || 'Booking Issue'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-maroon-900">
                    <div>{d.subject}</div>
                    {d.priority && d.priority !== 'medium' && (
                      <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLES[d.priority] || ''}`}>
                        {d.priority}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-stone-700">
                    {d.booking?.bookingNumber ? `#${d.booking.bookingNumber}` : 'General'}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-stone-700">
                    <div className="font-semibold text-stone-900">{d.raisedBy?.name || 'Customer'}</div>
                    {d.raisedBy?.phone && <div className="text-stone-500">{d.raisedBy.phone}</div>}
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
