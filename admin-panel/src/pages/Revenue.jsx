import { useState } from 'react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import { Loader, ErrorState, EmptyState } from '../components/States';
import { inr, fmtDate } from '../utils/format';

function Card({ label, value, sub }) {
  return <div className="card p-5"><div className="text-xs uppercase tracking-wide text-maroon-700">{label}</div><div className="mt-1 text-2xl font-bold text-maroon-800">{value}</div>{sub && <div className="text-xs text-maroon-700/70">{sub}</div>}</div>;
}

export default function Revenue() {
  const [range, setRange] = useState({ from: '', to: '' });
  const rev = useFetch('/admin/revenue', { from: range.from || undefined, to: range.to || undefined });
  const summary = useFetch('/admin/payouts', { status: 'pending' });
  const pending = useFetch('/bookings', { payout: 'pending', limit: 100 });
  const act = useAction();

  const refreshAll = () => { rev.reload(); summary.reload(); pending.reload(); };
  const markPaid = async (b) => {
    const reference = window.prompt(`Enter payout reference (UTR / txn id) for ${b.pandit?.user?.name} — ${inr(b.pricing.panditEarning)}:`);
    if (!reference || reference.trim().length < 3) return;
    if (await act.run(() => api.post(`/admin/payouts/${b._id}/mark-paid`, { reference }))) refreshAll();
  };

  if (rev.loading && !rev.data) return <Loader />;
  if (rev.error) return <ErrorState message={rev.error} onRetry={rev.reload} />;
  const d = rev.data;

  return (
    <div>
      <h1 className="text-3xl text-maroon-800">Revenue & Payouts</h1>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div><label className="label">From</label><input type="date" className="input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></div>
        <div><label className="label">To</label><input type="date" className="input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></div>
        {(range.from || range.to) && <button className="btn-outline" onClick={() => setRange({ from: '', to: '' })}>Clear</button>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Gross (completed)" value={inr(d.completed.gross)} sub={`${d.completed.bookings} bookings`} />
        <Card label="Platform commission" value={inr(d.completed.commission)} />
        <Card label="Purohit earnings" value={inr(d.completed.panditEarnings)} />
        <Card label="Pending payouts" value={inr(d.pendingPayouts.amount)} sub={`${d.pendingPayouts.count} bookings`} />
      </div>
      <p className="mt-2 text-xs text-maroon-700/70">Total cash collected from customers (all time): <b>{inr(d.collected)}</b></p>

      <h2 className="mt-8 text-xl text-maroon-800">Monthly breakdown</h2>
      {d.monthly.length === 0 ? <EmptyState title="No completed bookings" message="Revenue appears once pujas are completed." /> : (
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs uppercase text-maroon-700"><tr><th className="p-3">Month</th><th className="p-3">Bookings</th><th className="p-3">Gross</th><th className="p-3">Commission</th></tr></thead>
            <tbody>{d.monthly.map((m) => <tr key={m.month} className="border-t border-gold-300/30"><td className="p-3">{m.month}</td><td className="p-3">{m.bookings}</td><td className="p-3">{inr(m.gross)}</td><td className="p-3">{inr(m.commission)}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-xl text-maroon-800">Pending payouts by purohit</h2>
      {summary.loading && <Loader />}
      {summary.error && <ErrorState message={summary.error} onRetry={summary.reload} />}
      {summary.data && summary.data.length === 0 && <p className="mt-2 text-sm text-maroon-700">No pending payouts 🎉</p>}
      {summary.data && summary.data.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {summary.data.map((s) => <div key={s.pandit._id} className="card p-4"><b>{s.pandit.name || 'Purohit'}</b><div className="text-sm text-maroon-700">{s.pandit.phone}</div><div className="mt-1 text-xl font-bold text-maroon-800">{inr(s.amount)}</div><div className="text-xs text-maroon-700/70">{s.bookings} completed puja(s)</div></div>)}
        </div>
      )}

      <h2 className="mt-8 text-xl text-maroon-800">Settle payouts</h2>
      {act.error && <p role="alert" className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">{act.error}</p>}
      {pending.data && pending.data.length > 0 && (
        <div className="card mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs uppercase text-maroon-700"><tr><th className="p-3">Booking</th><th className="p-3">Date</th><th className="p-3">Purohit</th><th className="p-3">Total</th><th className="p-3">Commission</th><th className="p-3">Payout</th><th className="p-3" /></tr></thead>
            <tbody>
              {pending.data.map((b) => (
                <tr key={b._id} className="border-t border-gold-300/30">
                  <td className="p-3">#{b.bookingNumber}</td><td className="p-3">{fmtDate(b.date)}</td><td className="p-3">{b.pandit?.user?.name}</td>
                  <td className="p-3">{inr(b.pricing.total)}</td><td className="p-3">{inr(b.pricing.commissionAmount)}</td><td className="p-3 font-semibold">{inr(b.pricing.panditEarning)}</td>
                  <td className="p-3 text-right"><button className="btn-primary !px-3 !py-1" disabled={act.busy} onClick={() => markPaid(b)}>Mark paid</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pending.data && pending.data.length === 0 && <p className="mt-2 text-sm text-maroon-700">Nothing to settle.</p>}
    </div>
  );
}

