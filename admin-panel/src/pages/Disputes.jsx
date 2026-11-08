import { useState } from 'react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { Loader, ErrorState, EmptyState, StatusBadge, Pagination } from '../components/States';
import { inr, fmtDateTime, STATUS_META } from '../utils/format';

function ResolveModal({ dispute, onClose, onSaved }) {
  const [f, setF] = useState({ status: 'resolved', resolution: '', refundAmount: 0 });
  const act = useAction();
  const paid = dispute.booking?.payment?.amountPaid || 0;

  const submit = async (e) => {
    e.preventDefault();
    const body = { status: f.status, resolution: f.resolution, refundAmount: Number(f.refundAmount) || 0 };
    if (await act.run(() => api.patch(`/disputes/${dispute._id}`, body))) onSaved();
  };

  return (
    <Modal title={`Resolve: ${dispute.subject}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3 text-sm">
        {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{act.error}</p>}
        <p className="rounded-lg bg-cream-100 p-3">{dispute.description}</p>
        <div><label className="label">Outcome</label>
          <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="in_review">Mark in review</option><option value="resolved">Resolve (customer favoured)</option><option value="rejected">Reject</option>
          </select></div>
        {f.status !== 'in_review' && (
          <>
            <div><label className="label">Resolution notes</label><textarea required rows={3} className="input" value={f.resolution} onChange={(e) => setF({ ...f, resolution: e.target.value })} /></div>
            {f.status === 'resolved' && <div><label className="label">Refund amount (max {inr(paid)})</label><input type="number" min="0" max={paid} className="input" value={f.refundAmount} onChange={(e) => setF({ ...f, refundAmount: e.target.value })} /><p className="mt-1 text-xs text-maroon-700/70">Automatically triggers a Razorpay / sandbox refund and updates the booking ledger.</p></div>}
          </>
        )}
        <div className="flex justify-end gap-2"><button type="button" className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={act.busy}>{act.busy ? 'Saving…' : 'Save'}</button></div>
      </form>
    </Modal>
  );
}

export default function Disputes() {
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [active, setActive] = useState(null);
  const { data, meta, loading, error, reload } = useFetch('/disputes', { status: status || undefined, page, limit: 10 });

  return (
    <div>
      <h1 className="text-3xl text-maroon-800">Dispute Resolution</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {[['open', 'Open'], ['in_review', 'In review'], ['resolved', 'Resolved'], ['rejected', 'Rejected'], ['', 'All']].map(([v, l]) => (
          <button key={l} onClick={() => { setStatus(v); setPage(1); }} className={`rounded-full px-4 py-1.5 text-sm font-medium ${status === v ? 'bg-maroon-700 text-cream-100' : 'border border-gold-300 bg-white text-maroon-700'}`}>{l}</button>
        ))}
      </div>
      {loading && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No disputes" message="Nothing to review here." />}
      <ul className="mt-4 space-y-3">
        {(data || []).map((d) => (
          <li key={d._id} className="card p-5">
            <div className="flex flex-wrap items-center gap-2"><b className="text-lg text-maroon-800">{d.subject}</b><StatusBadge status={d.status} meta={STATUS_META} /><span className="ml-auto text-xs text-maroon-700/70">{fmtDateTime(d.createdAt)}</span></div>
            <p className="mt-1 text-sm text-maroon-700">#{d.booking?.bookingNumber} · {d.booking?.puja?.name} · Paid {inr(d.booking?.payment?.amountPaid)} · by {d.raisedBy?.name} ({d.raisedBy?.phone})</p>
            <p className="mt-2 text-sm">{d.description}</p>
            {d.resolution && <p className="mt-2 rounded-lg bg-cream-100 p-3 text-sm"><b>Resolution:</b> {d.resolution}{d.refundAmount > 0 && ` — Refund ${inr(d.refundAmount)}`}</p>}
            {['open', 'in_review'].includes(d.status) && <button className="btn-primary mt-3" onClick={() => setActive(d)}>Review & resolve</button>}
          </li>
        ))}
      </ul>
      <Pagination meta={meta} onPage={setPage} />
      {active && <ResolveModal dispute={active} onClose={() => setActive(null)} onSaved={() => { setActive(null); reload(); }} />}
    </div>
  );
}

