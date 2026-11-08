import { useState } from 'react';
import { Plus, Printer, PackageCheck, Download, CheckSquare } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorState, EmptyState } from '../components/States';
import { inr } from '../utils/format';

const itemsToText = (items = []) => items.map((i) => `${i.name} | ${i.quantity || '1'}`).join('\n');
const textToItems = (t) =>
  t
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, quantity] = l.split('|').map((s) => s.trim());
      return { name, quantity: quantity || '1' };
    });

function PackingSlipModal({ kit, onClose }) {
  if (!kit) return null;

  const downloadCsv = () => {
    const rows = [
      ['Kit Name', 'Item #', 'Samagri Item', 'Quantity', 'QA Packed'],
      ...(kit.items || []).map((item, idx) => [
        `"${kit.name}"`,
        idx + 1,
        `"${item.name}"`,
        `"${item.quantity || '1'}"`,
        'YES',
      ]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kit.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-packing-slip.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal title={`Warehouse Packing Slip — ${kit.name}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-saffron-700">
                VedaPujas Hyderabad · Fulfillment Warehouse Slip
              </span>
              <h3 className="font-serif text-xl font-bold text-maroon-900">{kit.name}</h3>
              {kit.description && <p className="text-xs text-stone-600">{kit.description}</p>}
            </div>
            <div className="text-right">
              <div className="font-serif text-xl font-bold text-maroon-900">{inr(kit.price)}</div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                {kit.items?.length || 0} Sacred Items
              </span>
            </div>
          </div>

          <div className="mt-3 overflow-hidden rounded-xl border border-amber-200 bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 bg-stone-100 font-bold uppercase text-maroon-800">
                <tr>
                  <th className="p-2.5 w-10">#</th>
                  <th className="p-2.5">Sacred Samagri Item</th>
                  <th className="p-2.5">Std. Quantity</th>
                  <th className="p-2.5 text-right">QA Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/70">
                {(kit.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-mono text-stone-500">{idx + 1}</td>
                    <td className="p-2.5 font-semibold text-maroon-900">{item.name}</td>
                    <td className="p-2.5 font-mono text-stone-700">{item.quantity}</td>
                    <td className="p-2.5 text-right text-emerald-700 font-bold">☑ Verified</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-xs text-stone-500">
            Sealed in tamper-evident VedaPujas Kalash dispatch box for Hyderabad doorstep delivery.
          </span>
          <div className="flex items-center gap-2">
            <button type="button" onClick={downloadCsv} className="btn-outline !px-3.5 !py-2 text-xs">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button type="button" onClick={() => window.print()} className="btn-primary !px-3.5 !py-2 text-xs">
              <Printer className="h-3.5 w-3.5" /> Print Packing Slip
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function KitForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    price: initial?.price ?? 0,
    itemsText: itemsToText(initial?.items),
    isActive: initial?.isActive ?? true,
  });
  const act = useAction();
  const submit = async (e) => {
    e.preventDefault();
    const body = {
      name: f.name,
      description: f.description,
      price: Number(f.price),
      items: textToItems(f.itemsText),
      isActive: f.isActive,
    };
    const ok = await act.run(() =>
      initial ? api.patch(`/samagri/${initial._id}`, body) : api.post('/samagri', body)
    );
    if (ok) onSaved();
  };
  return (
    <Modal title={initial ? 'Edit Samagri Kit' : 'New Samagri Kit'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{act.error}</p>}
        <div>
          <label className="label">Name</label>
          <input
            required
            className="input"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Description</label>
          <input
            className="input"
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Price (₹)</label>
          <input
            required
            type="number"
            min="0"
            className="input"
            value={f.price}
            onChange={(e) => setF({ ...f, price: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Items (one per line: name | quantity)</label>
          <textarea
            rows={6}
            className="input font-mono"
            value={f.itemsText}
            onChange={(e) => setF({ ...f, itemsText: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.isActive}
            onChange={(e) => setF({ ...f, isActive: e.target.checked })}
          />
          Active
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={act.busy}>
            {act.busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Samagri() {
  const { isAdmin } = useAuth();
  const { data, loading, error, reload } = useFetch('/samagri');
  const [editing, setEditing] = useState(null);
  const [slipKit, setSlipKit] = useState(null);
  const act = useAction();

  const remove = async (k) => {
    if (!window.confirm(`Deactivate "${k.name}"?`)) return;
    if (await act.run(() => api.delete(`/samagri/${k._id}`))) reload();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-maroon-900">
            <PackageCheck className="h-3 w-3 text-saffron-600" /> Hyderabad Fulfillment &amp; Inventory
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900">Samagri Kits &amp; Packing Slips</h1>
          <p className="text-sm text-stone-600">
            Standardized Vedic ritual kits with itemized quantities, doorstep pricing, and 1-click warehouse packing slips.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> New Samagri Kit
        </button>
      </div>
      {act.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{act.error}</p>}
      {loading && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <EmptyState title="No kits yet" message="Create a samagri kit and attach it to a puja." />
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {(data || []).map((k) => (
          <div
            key={k._id}
            className={`card flex flex-col justify-between border border-stone-200/90 bg-white p-5 transition hover:border-amber-400/80 hover:shadow-md ${
              k.isActive ? '' : 'opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 border-b border-stone-200/80 pb-3">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200">
                    <CheckSquare className="h-3 w-3 text-emerald-600" /> {k.items?.length || 0} Sacred Items
                  </span>
                  <h3 className="mt-1.5 font-serif text-xl font-bold text-maroon-900">{k.name}</h3>
                </div>
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-500">Kit Price</span>
                  <b className="font-serif text-lg font-bold text-maroon-900">{inr(k.price)}</b>
                </div>
              </div>

              {k.description && <p className="mt-2.5 text-xs leading-relaxed text-stone-600">{k.description}</p>}

              <ul className="mt-3.5 max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 text-xs">
                {k.items.map((i, idx) => (
                  <li key={idx} className="flex items-center justify-between border-b border-stone-200/50 pb-1 last:border-b-0 last:pb-0">
                    <span className="font-medium text-maroon-900">{i.name}</span>
                    <span className="rounded bg-white px-2 py-0.5 font-mono text-[11px] font-semibold text-stone-600 border border-stone-200">
                      × {i.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 pt-3.5">
              <button
                type="button"
                onClick={() => setSlipKit(k)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-maroon-900 transition hover:border-saffron-500 hover:bg-amber-100"
              >
                <Printer className="h-3.5 w-3.5 text-saffron-600" />
                Export / Print Packing Slip
              </button>

              <div className="flex items-center gap-1.5">
                <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setEditing(k)}>
                  Edit
                </button>
                {isAdmin && k.isActive && (
                  <button
                    className="btn-outline !px-3 !py-1.5 text-xs"
                    disabled={act.busy}
                    onClick={() => remove(k)}
                  >
                    Deactivate
                  </button>
                )}
                {!k.isActive && <span className="self-center text-xs font-semibold text-red-700">Inactive</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <KitForm
          initial={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      {slipKit && <PackingSlipModal kit={slipKit} onClose={() => setSlipKit(null)} />}
    </div>
  );
}
