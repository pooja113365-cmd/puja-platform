import { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Loader, ErrorState, EmptyState } from '../components/States';
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
    <Modal title={editing ? `Edit Puja — ${initial.name}` : 'Create New Vedic Puja'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {act.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{act.error}</p>}

        {/* Image URL & Live Thumbnail Preview Field */}
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/40 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-28 w-44 shrink-0 overflow-hidden rounded-xl border-2 border-amber-400/80 bg-maroon-900 shadow-sm">
              <img
                src={previewUrl}
                alt={f.name || 'Puja thumbnail preview'}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1.5 left-2 rounded bg-maroon-900/90 px-2 py-0.5 text-[10px] font-bold text-gold-300">
                {f.category || 'Live Preview'}
              </span>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <label className="label flex items-center gap-1.5 !mb-0" htmlFor="puja-image-url">
                <ImageIcon className="h-3.5 w-3.5 text-saffron-600" />
                Ritual Banner Image URL &amp; Thumbnail Preview
              </label>
              <input
                id="puja-image-url"
                className="input"
                placeholder="/images/griha-pravesh.jpg or https://..."
                value={f.image || ''}
                onChange={(e) => set({ image: e.target.value })}
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-semibold text-stone-500">Quick CDN Presets:</span>
                {IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => set({ image: preset.url })}
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                      f.image === preset.url
                        ? 'border-gold-400 bg-maroon-800 text-gold-300'
                        : 'border-amber-300 bg-white text-maroon-800 hover:border-saffron-500'
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
            <label className="label">Ritual Name</label>
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
              <option value="">None (Self-Arranged Checklist)</option>
              {(kits || []).map((k) => (
                <option key={k._id} value={k._id}>
                  {k.name} ({inr(k.price)})
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
            <span className="label !mb-0">Dakshina Price Tiers</span>
            <button
              type="button"
              className="text-xs font-semibold text-saffron-600"
              onClick={() =>
                set({ priceTiers: [...f.priceTiers, { name: '', price: 0, description: '' }] })
              }
            >
              <Plus className="inline h-3 w-3" /> Add tier
            </button>
          </div>
          {f.priceTiers.map((t, i) => (
            <div key={i} className="mt-2 grid grid-cols-12 gap-2">
              <input
                required
                placeholder="Name"
                className="input col-span-3"
                value={t.name}
                onChange={(e) =>
                  set({
                    priceTiers: f.priceTiers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                  })
                }
              />
              <input
                required
                type="number"
                min="0"
                placeholder="₹"
                className="input col-span-3"
                value={t.price}
                onChange={(e) =>
                  set({
                    priceTiers: f.priceTiers.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)),
                  })
                }
              />
              <input
                placeholder="Description"
                className="input col-span-5"
                value={t.description || ''}
                onChange={(e) =>
                  set({
                    priceTiers: f.priceTiers.map((x, j) =>
                      j === i ? { ...x, description: e.target.value } : x
                    ),
                  })
                }
              />
              <button
                type="button"
                disabled={f.priceTiers.length === 1}
                className="col-span-1 text-red-600 disabled:opacity-30"
                onClick={() => set({ priceTiers: f.priceTiers.filter((_, j) => j !== i) })}
                aria-label="Remove tier"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
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
            Featured on Hyderabad Home
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
  const act = useAction();

  const remove = async (p) => {
    if (!window.confirm(`Deactivate "${p.name}"? It will no longer be bookable.`)) return;
    if (await act.run(() => api.delete(`/pujas/${p._id}`))) reload();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-maroon-900">
            <Sparkles className="h-3 w-3 text-saffron-600" /> Sacred Rituals Catalog CRUD
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-maroon-900">Pujas &amp; Rituals</h1>
          <p className="text-sm text-stone-600">
            Manage ritual photography, Dakshina tiers, durations, and linked doorstep Samagri kits.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setEditing({})}>
          <Plus className="h-4 w-4" /> New Puja
        </button>
      </div>
      {act.error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{act.error}</p>}
      {loading && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && (
        <EmptyState title="No pujas yet" message="Create your first puja to start taking bookings." />
      )}
      {data && data.length > 0 && (
        <div className="card overflow-x-auto border border-stone-200/90 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-100/90 text-[11px] font-bold uppercase tracking-wider text-maroon-800">
              <tr>
                <th className="p-3.5">Puja &amp; Banner</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Dakshina Tiers</th>
                <th className="p-3.5">Locations</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70">
              {data.map((p) => (
                <tr key={p._id} className="align-middle transition hover:bg-amber-50/30">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolvePujaImage(p)}
                        alt={p.name}
                        className="h-12 w-16 shrink-0 rounded-lg border border-amber-300 object-cover shadow-sm"
                      />
                      <div>
                        <div className="font-serif font-bold text-maroon-900">
                          {p.name}
                          {p.isFeatured && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-sans text-[10px] font-bold text-amber-900 border border-amber-300">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500">{p.durationMinutes} mins · {p.samagriChecklist?.length || 0} checklist items</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-maroon-800">{p.category}</td>
                  <td className="p-3.5 text-xs text-stone-700">
                    {p.priceTiers.map((t) => `${t.name} ${inr(t.price)}`).join(' · ')}
                  </td>
                  <td className="p-3.5 text-xs text-stone-700">
                    {p.locationTypes.map((l) => LOCATION_LABEL[l]).join(', ')}
                  </td>
                  <td className="p-3.5">
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
                  <td className="space-x-2 p-3.5 text-right whitespace-nowrap">
                    <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    {isAdmin && p.isActive && (
                      <button
                        className="btn-outline !px-3 !py-1.5 text-xs"
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
