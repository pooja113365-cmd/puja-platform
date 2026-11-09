import { useMemo, useState } from 'react';
import { Plus, Printer, Download, CheckCircle2, Search, RotateCcw, Eye } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorState, EmptyState, Pagination } from '../components/States';

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
      ['Kit Name', 'Item #', 'Samagri Item', 'Quantity'],
      ...(kit.items || []).map((item, idx) => [
        `"${kit.name}"`,
        idx + 1,
        `"${item.name}"`,
        `"${item.quantity || '1'}"`,
      ]),
    ];
    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kit.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-items.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal title={`Samagri Kit — ${kit.name}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-maroon-900">{kit.name}</h3>
            {kit.description && <p className="text-xs text-stone-500">{kit.description}</p>}
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            {kit.items?.length || 0} Items
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 bg-stone-50 font-bold uppercase text-stone-600">
              <tr>
                <th className="p-2.5 w-10">#</th>
                <th className="p-2.5">Samagri Item</th>
                <th className="p-2.5 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(kit.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2.5 font-mono text-stone-500">{idx + 1}</td>
                  <td className="p-2.5 font-medium text-maroon-900">{item.name}</td>
                  <td className="p-2.5 text-right font-mono text-stone-700">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <button type="button" onClick={downloadCsv} className="btn-outline !px-3.5 !py-2 text-xs">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button type="button" onClick={() => window.print()} className="btn-primary !px-3.5 !py-2 text-xs">
            <Printer className="h-3.5 w-3.5" /> Print List
          </button>
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
      price: Number(f.price) || 0,
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const act = useAction();

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((k) => {
      if (statusFilter === 'active' && !k.isActive) return false;
      if (statusFilter === 'inactive' && k.isActive) return false;
      if (search) {
        const q = search.toLowerCase();
        const inName = k.name?.toLowerCase().includes(q);
        const inItems = (k.items || []).some((i) => i.name?.toLowerCase().includes(q));
        if (!inName && !inItems) return false;
      }
      return true;
    });
  }, [data, search, statusFilter]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  const remove = async (k) => {
    if (!window.confirm(`Deactivate "${k.name}"?`)) return;
    if (await act.run(() => api.delete(`/samagri/${k._id}`))) reload();
  };

  const hasFilters = Boolean(search || statusFilter);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Samagri Kits</h1>
          <p className="mt-0.5 text-sm text-stone-500">Manage ritual samagri kits and item checklists</p>
        </div>
        <button className="btn-primary !py-2 text-xs" onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> New Samagri Kit
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search kit or item name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

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
          <option value="inactive">Inactive</option>
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
        <EmptyState title="No samagri kits found" message="Try adjusting or clearing your filters." />
      )}

      {data && pagedRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="w-14 px-4 py-3.5">S.No</th>
                <th className="px-4 py-3.5">Kit Name</th>
                <th className="px-4 py-3.5">Description</th>
                <th className="px-4 py-3.5">Items</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pagedRows.map((k, idx) => (
                <tr key={k._id} className="align-middle transition hover:bg-stone-50/80">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-stone-500">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-maroon-900">{k.name}</td>
                  <td className="max-w-sm px-4 py-3.5 text-xs text-stone-600">
                    <span className="line-clamp-1">{k.description || '—'}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-stone-700">
                    {k.items?.length || 0} items
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {k.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="space-x-2 px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSlipKit(k)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-maroon-900 shadow-sm hover:border-saffron-500"
                    >
                      <Eye className="h-3.5 w-3.5 text-saffron-600" /> View Items
                    </button>
                    <button
                      className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-maroon-900 shadow-sm hover:border-saffron-500"
                      onClick={() => setEditing(k)}
                    >
                      Edit
                    </button>
                    {isAdmin && k.isActive && (
                      <button
                        className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        disabled={act.busy}
                        onClick={() => remove(k)}
                      >
                        Deactivate
                      </button>
                    )}
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
