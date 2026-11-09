import { useMemo, useState } from 'react';
import { ExternalLink, Eye, Search, RotateCcw } from 'lucide-react';
import api from '../services/api';
import useFetch from '../hooks/useFetch';
import useAction from '../hooks/useAction';
import Modal from '../components/Modal';
import { Loader, ErrorState, EmptyState, StatusBadge, Pagination } from '../components/States';
import { STATUS_META } from '../utils/format';

function PanditKycModal({ pandit: p, onClose, onReview, onToggleActive, busy, error }) {
  const [reason, setReason] = useState(p.kyc?.rejectionReason || '');
  return (
    <Modal title={`Pandit Details — ${p.user?.name || 'Pandit'}`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-maroon-900">{p.user?.name}</h3>
            <p className="text-xs text-stone-500">
              {p.user?.email} · +91 {p.user?.phone}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={p.kyc.status} meta={STATUS_META} />
            <button
              type="button"
              className="btn-outline !px-3 !py-1.5 text-xs"
              disabled={busy}
              onClick={() => onToggleActive(p)}
            >
              {p.isActive ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Temple &amp; Experience</span>
            <p className="mt-0.5 font-semibold text-maroon-900">
              {p.templeAffiliation || 'Independent Vedic Acharya'}
            </p>
            <p className="text-xs text-stone-600">{p.experienceYears} years experience</p>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Languages &amp; Cities</span>
            <p className="mt-0.5 font-semibold text-maroon-900">{p.languages.join(', ')}</p>
            {p.serviceCities?.length > 0 && (
              <p className="text-xs text-stone-600">Cities: {p.serviceCities.join(', ')}</p>
            )}
          </div>
          <div className="sm:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Specializations</span>
            <p className="mt-0.5 font-medium text-maroon-900">{p.specializations.join(', ')}</p>
          </div>
        </div>

        {p.bio && (
          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Bio</span>
            <p className="mt-1 leading-relaxed text-stone-700">{p.bio}</p>
          </div>
        )}

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            KYC Documents ({p.kyc.documents.length})
          </span>
          {p.kyc.documents.length === 0 ? (
            <p className="mt-1 text-xs text-red-700">No KYC documents uploaded yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {p.kyc.documents.map((d, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2"
                >
                  <span className="font-medium text-maroon-900">{d.type}</span>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-saffron-600 hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open document
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="label" htmlFor="kyc-reason">
            Rejection Reason (required if rejecting)
          </label>
          <input
            id="kyc-reason"
            className="input"
            placeholder="Reason for rejection..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-stone-200 pt-3">
          <button type="button" className="btn-outline" onClick={onClose}>
            Close
          </button>
          {p.kyc.status !== 'rejected' && (
            <button
              type="button"
              className="btn-outline !border-red-600 !text-red-700"
              disabled={busy || reason.trim().length < 3}
              onClick={() => onReview(p, 'rejected', reason.trim())}
            >
              Reject KYC
            </button>
          )}
          {p.kyc.status !== 'approved' && (
            <button
              type="button"
              className="btn-primary"
              disabled={busy || p.kyc.documents.length === 0}
              onClick={() => onReview(p, 'approved')}
            >
              Approve Pandit
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function Pandits() {
  const [kyc, setKyc] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState(null);

  const { data, meta, loading, error, reload } = useFetch('/admin/pandits', {
    kyc: kyc || undefined,
    search: search || undefined,
    page,
    limit,
  });
  const act = useAction();

  const filteredRows = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => {
      if (activeFilter === 'active' && !p.isActive) return false;
      if (activeFilter === 'inactive' && p.isActive) return false;
      if (langFilter && !(p.languages || []).includes(langFilter)) return false;
      return true;
    });
  }, [data, activeFilter, langFilter]);

  const review = async (p, status, providedReason) => {
    let reason = providedReason;
    if (status === 'rejected' && !reason) {
      reason = window.prompt('Reason for rejection:');
      if (!reason || reason.trim().length < 3) return;
    }
    if (await act.run(() => api.patch(`/admin/pandits/${p._id}/kyc`, { status, reason }))) {
      setSelected(null);
      reload();
    }
  };

  const toggleActive = async (p) => {
    if (await act.run(() => api.patch(`/admin/pandits/${p._id}`, { isActive: !p.isActive }))) {
      setSelected(null);
      reload();
    }
  };

  const hasFilters = Boolean(kyc || activeFilter || langFilter || search);

  const clearFilters = () => {
    setKyc('');
    setActiveFilter('');
    setLangFilter('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-bold text-maroon-900 sm:text-3xl">Pandits</h1>
        <p className="mt-0.5 text-sm text-stone-500">Review pandit KYC applications and manage active profiles</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-sm">
        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            className="input pl-9"
            placeholder="Search pandit name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="input max-w-[11rem]"
          value={kyc}
          onChange={(e) => {
            setKyc(e.target.value);
            setPage(1);
          }}
          aria-label="KYC Status Filter"
        >
          <option value="">All KYC Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          className="input max-w-[10rem]"
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Account Status Filter"
        >
          <option value="">All Accounts</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          className="input max-w-[10rem]"
          value={langFilter}
          onChange={(e) => {
            setLangFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Language Filter"
        >
          <option value="">All Languages</option>
          {['Telugu', 'Hindi', 'Sanskrit', 'Tamil', 'Kannada', 'English'].map((l) => (
            <option key={l} value={l}>
              {l}
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

      {act.error && !selected && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {act.error}
        </p>
      )}

      {loading && <Loader />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && filteredRows.length === 0 && (
        <EmptyState title="No pandits found" message="Try adjusting or clearing your filters." />
      )}

      {data && filteredRows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-stone-200/90 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
              <tr>
                <th className="w-14 px-4 py-3.5">S.No</th>
                <th className="px-4 py-3.5">Pandit</th>
                <th className="px-4 py-3.5">Specializations</th>
                <th className="px-4 py-3.5">Languages</th>
                <th className="px-4 py-3.5">Experience</th>
                <th className="px-4 py-3.5">KYC Status</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRows.map((p, idx) => (
                <tr key={p._id} className="align-middle transition hover:bg-stone-50/80">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-stone-500">
                    {(page - 1) * limit + idx + 1}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-maroon-900">{p.user?.name}</div>
                    <div className="text-xs text-stone-500">+91 {p.user?.phone}</div>
                  </td>
                  <td className="max-w-xs px-4 py-3.5">
                    <div className="truncate font-medium text-stone-800">
                      {p.specializations.join(', ')}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-stone-600">{p.languages.join(', ')}</td>
                  <td className="px-4 py-3.5 text-xs font-medium text-stone-700">
                    {p.experienceYears} yrs
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={p.kyc.status} meta={STATUS_META} />
                      {!p.isActive && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-maroon-900 shadow-sm transition hover:border-saffron-500 hover:bg-amber-50/50"
                      onClick={() => setSelected(p)}
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
        total={meta?.total ?? filteredRows.length}
        page={page}
        limit={limit}
        onPage={setPage}
        onLimit={setLimit}
      />

      {selected && (
        <PanditKycModal
          pandit={selected}
          onClose={() => setSelected(null)}
          onReview={review}
          onToggleActive={toggleActive}
          busy={act.busy}
          error={act.error}
        />
      )}
    </div>
  );
}
