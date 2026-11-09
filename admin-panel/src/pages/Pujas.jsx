import { useMemo, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, CheckCircle2, Search, RotateCcw } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorState, EmptyState, Pagination } from '../components/States';
import { inr, LOCATION_LABEL } from '../utils/format';

const CATEGORY_IMAGE_MAP = {
  'Griha Pravesh': '/images/griha-pravesh.jpg',
  Satyanarayan: '/images/satyanarayan.jpg',
  Rudrabhishek: '/images/rudrabhishek.jpg',
  Navagraha: '/images/navagraha.jpg',
  Vivah: '/images/vivah.jpg',
  Shradh: '/images/shradh.jpg',
  Havan: '/images/navagraha.jpg',
  Namakaran: '/images/satyanarayan.jpg',
  'Ganapati Puja': '/images/griha-pravesh.jpg',
  'Lakshmi Puja': '/images/griha-pravesh.jpg',
};

const IMAGE_PRESETS = [
  { label: 'Griha Pravesh', url: '/images/griha-pravesh.jpg' },
  { label: 'Satyanarayan', url: '/images/satyanarayan.jpg' },
  { label: 'Rudrabhishek', url: '/images/rudrabhishek.jpg' },
  { label: 'Navagraha', url: '/images/navagraha.jpg' },
  { label: 'Vivah', url: '/images/vivah.jpg' },
  { label: 'Shradh', url: '/images/shradh.jpg' },
];

export function resolvePujaImage(puja) {
  if (!puja) return '/images/griha-pravesh.jpg';
  if (puja.image && (puja.image.startsWith('/images/') || puja.image.startsWith('http'))) {
    return puja.image;
  }
  return CATEGORY_IMAGE_MAP[puja.category] || '/images/griha-pravesh.jpg';
}

const blank = {
  name: '',
  category: '',
  image: '/images/griha-pravesh.jpg',
  description: '',
  significance: '',
  durationMinutes: 120,
  locationTypes: ['home'],
  samagriKit: '',
  priceTiers: [{ name: 'Standard', price: 0, description: '' }],
  samagriChecklist: [],
  isFeatured: false,
  isActive: true,
};

function PujaForm({ initial, onClose, onSaved }) {
  const [f, setF] = useState(
    initial
      ? {
          ...blank,
          ...initial,
          image: resolvePujaImage(initial),
          samagriKit: initial.samagriKit?._id || initial.samagriKit || '',
        }
      : blank
  );
  const { data: opts } = useFetch('/pujas/options');
  const { data: kits } = useFetch('/samagri');
  const act = useAction();
  const set = (p) => setF((s) => ({ ...s, ...p }));
  const editing = Boolean(initial?._id);

  const submit = async (e) => {
    e.preventDefault();
    const body = {
      ...f,
      image: f.image || resolvePujaImage(f),
      durationMinutes: Number(f.durationMinutes),
      samagriKit: f.samagriKit || null,
      priceTiers: f.priceTiers.map((t) => ({ ...t, price: Number(t.price) })),
      samagriChecklist: f.samagriChecklist.filter((c) => c.name.trim()),
    };
    delete body._id;
    delete body.slug;
    delete body.createdAt;
    delete body.updatedAt;
    delete body.__v;
    const ok = await act.run(() => (editing ? api.patch(`/pujas/${initial._id}`, body) : api.post('/pujas', body)));
    if (ok) onSaved();
  };

  const toggleLoc = (l) =>
    set({
      locationTypes: f.locationTypes.includes(l)
        ? f.locationTypes.filter((x) => x !== l)
        : [...f.locationTypes, l],
    });

  const previewUrl = f.image || resolvePujaImage(f);

  return (
    <Modal title={editing ? `Edit Puja — ${initial.name}` : 'New Puja'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{act.error}</p>}

        {/* Image URL & Thumbnail Preview */}
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-maroon-900 shadow-sm">
              <img
                src={previewUrl}
                alt={f.name || 'Puja thumbnail preview'}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <label className="label flex items-center gap-1.5 !mb-0" htmlFor="puja-image-url">
                <ImageIcon className="h-3.5 w-3.5 text-saffron-600" />
                Banner Image URL
              </label>
              <input
                id="puja-image-url"
                className="input"
                placeholder="/images/griha-pravesh.jpg or https://..."
                value={f.image || ''}
                onChange={(e) => set({ image: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-semibold text-stone-500">Presets:</span>
                {IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => set({ image: preset.url })}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                      f.image === preset.url
                        ? 'border-maroon-800 bg-maroon-800 text-white'
                        : 'border-stone-200 bg-white text-maroon-800 hover:border-saffron-500'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Puja Name</label>
            <input
              required
              className="input"
              value={f.name}
              onChange={(e) => set({ name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select
              required
              className="input"
              value={f.category}
              onChange={(e) => {
                const nextCat = e.target.value;
                set({
                  category: nextCat,
                  image: f.image || CATEGORY_IMAGE_MAP[nextCat] || '/images/griha-pravesh.jpg',
                });
              }}
            >
              <option value="">Select…</option>
              {(opts?.categories || []).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Duration (minutes)</label>
            <input
              type="number"
              min="15"
              required
              className="input"
              value={f.durationMinutes}
              onChange={(e) => set({ durationMinutes: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Attached Samagri Kit</label>
            <select
              className="input"
              value={f.samagriKit}
              onChange={(e) => set({ samagriKit: e.target.value })}
            >
              <option value="">None (Self-Arranged)</option>
              {(kits || []).map((k) => (
                <option key={k._id} value={k._id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            required
            rows={2}
            className="input"
            value={f.description}
            onChange={(e) => set({ description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Spiritual Significance</label>
          <textarea
            rows={2}
            className="input"
            value={f.significance || ''}
            onChange={(e) => set({ significance: e.target.value })}
          />
        </div>
        <div>
          <span className="label">Location Types</span>
          <div className="flex gap-4 text-sm">
            {Object.entries(LOCATION_LABEL).map(([k, v]) => (
              <label key={k} className="flex items-center gap-1.5 font-medium text-maroon-800">
                <input
                  type="checkbox"
                  checked={f.locationTypes.includes(k)}
                  onChange={() => toggleLoc(k)}
                />
                {v}
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="label !mb-0">Samagri Checklist</span>
            <button
              type="button"
              className="text-xs font-semibold text-saffron-600"
              onClick={() =>
                set({
                  samagriChecklist: [
                    ...f.samagriChecklist,
                    { name: '', quantity: '1', providedInKit: true },
                  ],
                })
              }
            >
              <Plus className="inline h-3 w-3" /> Add item
            </button>
          </div>
          {f.samagriChecklist.map((c, i) => (
            <div key={i} className="mt-2 grid grid-cols-12 items-center gap-2">
              <input
                placeholder="Item"
                className="input col-span-5"
                value={c.name}
                onChange={(e) =>
                  set({
                    samagriChecklist: f.samagriChecklist.map((x, j) =>
                      j === i ? { ...x, name: e.target.value } : x
                    ),
                  })
                }
              />
              <input
                placeholder="Qty"
                className="input col-span-3"
                value={c.quantity}
                onChange={(e) =>
                  set({
                    samagriChecklist: f.samagriChecklist.map((x, j) =>
                      j === i ? { ...x, quantity: e.target.value } : x
                    ),
                  })
                }
              />
              <label className="col-span-3 flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={c.providedInKit}
                  onChange={(e) =>
                    set({
                      samagriChecklist: f.samagriChecklist.map((x, j) =>
                        j === i ? { ...x, providedInKit: e.target.checked } : x
                      ),
                    })
                  }
                />
                In kit
              </label>
              <button
                type="button"
                className="col-span-1 text-red-600"
                onClick={() =>
                  set({ samagriChecklist: f.samagriChecklist.filter((_, j) => j !== i) })
                }
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2 font-medium text-maroon-900">
            <input
              type="checkbox"
              checked={f.isFeatured}
              onChange={(e) => set({ isFeatured: e.target.checked })}
            />
            Featured on Home
          </label>
          <label className="flex items-center gap-2 font-medium text-maroon-900">
            <input
              type="checkbox"
              checked={f.isActive}
              onChange={(e) => set({ isActive: e.target.checked })}
            />
            Active in Catalog
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-stone-200 pt-3">
          <button type="button" className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={act.busy || f.locationTypes.length === 0}>
            {act.busy ? 'Saving…' : 'Save Puja'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Pujas() {
  const { isAdmin } = useAuth();
  const { data, loading, error, reload } = useFetch('/pujas', { includeInactive: 'true', limit: 100 });
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const act = useAction();

  const categories = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.map((p) => p.category).filter(Boolean)));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && p.category !== catFilter) return false;
      if (statusFilter === 'active' && !p.isActive) return false;
      if (statusFilter === 'inactive' && p.isActive) return false;
      if (statusFilter === 'featured' && !p.isFeatured) return false;
      if (locFilter && !(p.locationTypes || []).includes(locFilter)) return false;
      return true;
    });
  }, [data, search, catFilter, statusFilter, locFilter]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  const remove = async (p) => {
    if (!window.confirm(`Deactivate "${p.name}"? It will no longer be bookable.`)) return;
    if (await act.run(() => api.delete(`/pujas/${p._id}`))) reload();
  };

  const hasFilters = Boolean(search || catFilter || statusFilter || locFilter);

  const clearFilters = () => {
    setSearch('');
    setCatFilter('');
    setStatusFilter('');
    setLocFilter('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Pujas Catalog</h1>
          <p className="mt-0.5 text-sm text-stone-500">Manage pujas, categories, durations, and checklists</p>
        </div>
        <button className="btn-primary !py-2 text-xs" onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> New Puja
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search puja name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="input max-w-[11rem]"
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Category filter"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

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
          <option value="featured">Featured</option>
        </select>

        <select
          className="input max-w-[10rem]"
          value={locFilter}
          onChange={(e) => {
            setLocFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Location filter"
        >
          <option value="">All Venues</option>
          {Object.entries(LOCATION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
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
        <EmptyState title="No pujas found" message="Try adjusting or clearing your filters." />
      )}

      {data && pagedRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="w-14 px-4 py-3.5">S.No</th>
                <th className="px-4 py-3.5">Puja</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Duration</th>
                <th className="px-4 py-3.5">Locations</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {pagedRows.map((p, idx) => (
                <tr key={p._id} className="align-middle transition hover:bg-stone-50/80">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-stone-500">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolvePujaImage(p)}
                        alt={p.name}
                        className="h-11 w-14 shrink-0 rounded-lg border border-stone-200 object-cover"
                      />
                      <div>
                        <div className="font-semibold text-maroon-900">
                          {p.name}
                          {p.isFeatured && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                              Featured
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500">
                          {p.samagriChecklist?.length || 0} checklist items
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-stone-800">{p.category}</td>
                  <td className="px-4 py-3.5 text-xs text-stone-600">{p.durationMinutes} mins</td>
                  <td className="px-4 py-3.5 text-xs text-stone-600">
                    {p.locationTypes.map((l) => LOCATION_LABEL[l]).join(', ')}
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {p.isActive ? (
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
                      className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-maroon-900 shadow-sm hover:border-saffron-500"
                      onClick={() => setEditing(p)}
                    >
                      Edit
                    </button>
                    {isAdmin && p.isActive && (
                      <button
                        className="inline-flex items-center rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        disabled={act.busy}
                        onClick={() => remove(p)}
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
        <PujaForm
          initial={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
