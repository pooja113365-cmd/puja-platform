import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import { Loader, ErrorState, EmptyState } from '../components/States';
import { fmtDate, toYMD } from '../utils/format';

const blank = { date: '', label: '', startTime: '08:00', endTime: '10:00', notes: '' };

export default function Muhurthams() {
  const today = toYMD(new Date());
  const { data, loading, error, reload } = useFetch('/muhurthams', { from: today });
  const [f, setF] = useState(blank);
  const act = useAction();

  const add = async (e) => {
    e.preventDefault();
    if (await act.run(() => api.post('/muhurthams', f))) { setF(blank); reload(); }
  };
  const remove = async (m) => {
    if (!window.confirm('Delete this muhurtham?')) return;
    if (await act.run(() => api.delete(`/muhurthams/${m._id}`))) reload();
  };
  const toggle = async (m) => {
    if (await act.run(() => api.patch(`/muhurthams/${m._id}`, { isActive: !m.isActive }))) reload();
  };

  return (
    <div>
      <h1 className="text-3xl text-maroon-800">Muhurtham Schedule</h1>
      <p className="mt-1 text-sm text-maroon-700/80">Special auspicious windows are highlighted to customers alongside the standard daily slots.</p>

      <form onSubmit={add} className="card mt-5 grid gap-3 p-5 sm:grid-cols-6">
        <div className="sm:col-span-2"><label className="label">Date</label><input type="date" required min={today} className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div className="sm:col-span-2"><label className="label">Label</label><input required className="input" placeholder="e.g. Shubh Muhurtham" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></div>
        <div><label className="label">From</label><input type="time" required className="input" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} /></div>
        <div><label className="label">To</label><input type="time" required className="input" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} /></div>
        <div className="sm:col-span-5"><label className="label">Notes</label><input className="input" placeholder="Optional — e.g. nakshatra / suitable pujas" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
        <div className="flex items-end"><button className="btn-primary w-full" disabled={act.busy}>Add</button></div>
        {act.error && <p role="alert" className="text-sm text-red-700 sm:col-span-6">{act.error}</p>}
      </form>

      {loading && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState title="No upcoming muhurthams" message="Add special muhurtham windows using the form above." />}
      {data && data.length > 0 && (
        <div className="card mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream-100 text-xs uppercase text-maroon-700"><tr><th className="p-3">Date</th><th className="p-3">Label</th><th className="p-3">Time</th><th className="p-3">Notes</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>
              {data.map((m) => (
                <tr key={m._id} className={`border-t border-gold-300/30 ${m.isActive ? '' : 'opacity-50'}`}>
                  <td className="p-3">{fmtDate(m.date)}</td><td className="p-3 font-semibold">{m.label}</td><td className="p-3">{m.startTime} – {m.endTime}</td><td className="p-3">{m.notes}</td>
                  <td className="space-x-2 p-3 text-right whitespace-nowrap">
                    <button className="btn-outline !px-3 !py-1" disabled={act.busy} onClick={() => toggle(m)}>{m.isActive ? 'Disable' : 'Enable'}</button>
                    <button className="text-red-600" aria-label="Delete" disabled={act.busy} onClick={() => remove(m)}><Trash2 className="inline h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

